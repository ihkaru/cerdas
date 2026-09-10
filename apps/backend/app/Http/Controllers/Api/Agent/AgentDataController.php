<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Jobs\GoogleSheetEnqueueRowJob;
use App\Models\App;
use App\Models\Assignment;
use App\Models\Response as SurveyResponse;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AgentDataController extends Controller
{
    /**
     * Query and search submissions/responses for an app with JSON filtering and full-text keyword search.
     *
     * GET /api/agent/v1/apps/{app}/submissions
     */
    public function submissions(Request $request, string $appId): JsonResponse
    {
        $app = App::withTrashed()->where('id', $appId)->orWhere('slug', $appId)->firstOrFail();

        $tableId = $request->input('table_id');
        if ($tableId) {
            $tableIds = Table::withTrashed()->where('app_id', $app->id)->where('id', $tableId)->pluck('id');
        } else {
            $tableIds = Table::withTrashed()->where('app_id', $app->id)->pluck('id');
        }

        $query = Assignment::query()
            ->with([
                'enumerator:id,name,email',
                'supervisor:id,name,email',
                'table:id,name,slug,current_version',
                'responses' => function ($rQ) {
                    $rQ->latest('updated_at');
                },
            ])
            ->whereIn('table_id', $tableIds);

        // 1. Status Filter
        $status = $request->input('status');
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        // 2. Enumerator Filter
        $enumeratorId = $request->input('enumerator_id');
        if ($enumeratorId) {
            $query->where('enumerator_id', $enumeratorId);
        }

        // 3. Date Range Filter
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        if ($dateFrom) {
            $query->where('updated_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('updated_at', '<=', $dateTo);
        }

        // 4. Global Keyword Search (Searches prelist_data, enumerator name, and response JSON data)
        $search = $request->input('search');
        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('prelist_data', 'like', "%{$search}%")
                    ->orWhereHas('enumerator', function ($uQ) use ($search) {
                        $uQ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('responses', function ($rQ) use ($search) {
                        $rQ->where('data', 'like', "%{$search}%");
                    });
            });
        }

        // 5. Advanced JSON Filtering (by specific field keys)
        $filtersParam = $request->input('filters');
        if ($filtersParam) {
            $filters = is_string($filtersParam) ? json_decode($filtersParam, true) : $filtersParam;
            if (is_array($filters)) {
                foreach ($filters as $f) {
                    $field = $f['field'] ?? null;
                    $operator = $f['operator'] ?? 'equals';
                    $val = $f['value'] ?? null;

                    if (! $field || $val === null || $val === '') {
                        continue;
                    }

                    $query->where(function ($subQ) use ($field, $operator, $val) {
                        $subQ->where(function ($q) use ($field, $operator, $val) {
                            $this->applyJsonFilter($q, 'prelist_data', $field, $operator, $val);
                        })->orWhereHas('responses', function ($rQ) use ($field, $operator, $val) {
                            $this->applyJsonFilter($rQ, 'data', $field, $operator, $val);
                        });
                    });
                }
            }
        }

        $perPage = min((int) $request->input('per_page', 25), 100);
        $paginated = $query->orderByDesc('updated_at')->paginate($perPage);

        // Format items with clear data preview
        $transformed = collect($paginated->items())->map(function (Assignment $assignment) {
            $latestResponse = $assignment->responses->first();

            return [
                'assignment_id' => $assignment->id,
                'status' => $assignment->status,
                'table' => [
                    'id' => $assignment->table?->id,
                    'name' => $assignment->table?->name,
                ],
                'enumerator' => $assignment->enumerator ? [
                    'id' => $assignment->enumerator->id,
                    'name' => $assignment->enumerator->name,
                    'email' => $assignment->enumerator->email,
                ] : null,
                'external_id' => $assignment->external_id,
                'prelist_data' => $assignment->prelist_data,
                'status_history' => $assignment->status_history,
                'rejection_note' => $assignment->rejection_note,
                'latest_response' => $latestResponse ? [
                    'id' => $latestResponse->id,
                    'data' => $latestResponse->data,
                    'synced_at' => $latestResponse->synced_at?->toIso8601String(),
                    'submitted_version' => $latestResponse->submitted_version,
                    'created_at' => $latestResponse->created_at?->toIso8601String(),
                ] : null,
                'created_at' => $assignment->created_at?->toIso8601String(),
                'updated_at' => $assignment->updated_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
            'data' => $transformed,
        ]);
    }

    /**
     * Inspect a single response in depth, including raw JSON payload, parent/child lineage.
     *
     * GET /api/agent/v1/submissions/{response}
     */
    public function showSubmission(Request $request, string $responseId): JsonResponse
    {
        $response = SurveyResponse::withTrashed()
            ->with([
                'assignment.table',
                'assignment.enumerator',
                'assignment.supervisor',
            ])
            ->findOrFail($responseId);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $response->id,
                'local_id' => $response->local_id,
                'table_version_id' => $response->table_version_id,
                'metadata' => $response->metadata,
                'device_id' => $response->device_id,
                'submitted_version' => $response->submitted_version,
                'synced_at' => $response->synced_at?->toIso8601String(),
                'raw_data' => $response->data,
                'assignment' => [
                    'id' => $response->assignment?->id,
                    'status' => $response->assignment?->status,
                    'status_history' => $response->assignment?->status_history,
                    'rejection_note' => $response->assignment?->rejection_note,
                    'table_id' => $response->assignment?->table_id,
                    'table_name' => $response->assignment?->table?->name,
                    'enumerator' => $response->assignment?->enumerator ? [
                        'id' => $response->assignment->enumerator->id,
                        'name' => $response->assignment->enumerator->name,
                        'email' => $response->assignment->enumerator->email,
                    ] : null,
                ],
                'created_at' => $response->created_at?->toIso8601String(),
                'updated_at' => $response->updated_at?->toIso8601String(),
                'deleted_at' => $response->deleted_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Hotfix response payload data (e.g. fix corrupted values or typos).
     *
     * PATCH /api/agent/v1/submissions/{response}
     */
    public function patchSubmission(Request $request, string $responseId): JsonResponse
    {
        $response = SurveyResponse::findOrFail($responseId);

        $validated = $request->validate([
            'patch_data' => 'required|array',
            're_sync' => 'nullable|boolean',
        ]);

        $patchData = $validated['patch_data'];
        $reSync = (bool) ($validated['re_sync'] ?? false);

        $beforeData = $response->data ?? [];
        // Merge patched keys cleanly into existing data
        $mergedData = array_merge($beforeData, $patchData);

        $response->update([
            'data' => $mergedData,
        ]);

        Log::info('[AGENT_MUTATION] Patched response payload data', [
            'response_id' => $response->id,
            'assignment_id' => $response->assignment_id,
            'patched_keys' => array_keys($patchData),
            'patch' => $patchData,
        ]);

        // Optional immediate re-enqueue to Google Sheet sync
        if ($reSync) {
            GoogleSheetEnqueueRowJob::dispatch($response->id, 'upsert');
        }

        return response()->json([
            'success' => true,
            'message' => 'Response payload patched successfully',
            're_synced' => $reSync,
            'data' => $response->fresh(),
        ]);
    }

    /**
     * List assignments for an app with search/filtering.
     *
     * GET /api/agent/v1/apps/{app}/assignments
     */
    public function assignments(Request $request, string $appId): JsonResponse
    {
        $app = App::withTrashed()->where('id', $appId)->orWhere('slug', $appId)->firstOrFail();
        $tableIds = Table::withTrashed()->where('app_id', $app->id)->pluck('id');

        $query = Assignment::query()
            ->with(['enumerator:id,name,email', 'table:id,name'])
            ->whereIn('table_id', $tableIds);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->input('table_id'));
        }

        if ($request->filled('enumerator_id')) {
            $query->where('enumerator_id', $request->input('enumerator_id'));
        }

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('prelist_data', 'like', "%{$s}%")
                    ->orWhere('external_id', 'like', "%{$s}%");
            });
        }

        $perPage = min((int) $request->input('per_page', 25), 100);
        $paginated = $query->orderByDesc('updated_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'total' => $paginated->total(),
            ],
            'data' => $paginated->items(),
        ]);
    }

    /**
     * Force update assignment status or reassign to another user.
     *
     * PATCH /api/agent/v1/assignments/{assignment}/status
     */
    public function patchAssignmentStatus(Request $request, string $assignmentId): JsonResponse
    {
        $assignment = Assignment::findOrFail($assignmentId);

        $validated = $request->validate([
            'status' => 'sometimes|string|in:assigned,in_progress,submitted,approved,rejected',
            'rejection_note' => 'nullable|string',
            'enumerator_id' => 'nullable|string|exists:users,id',
            'supervisor_id' => 'nullable|string|exists:users,id',
        ]);

        $beforeStatus = $assignment->status;
        $assignment->update($validated);

        Log::info('[AGENT_MUTATION] Assignment status/assignee overridden by Agent', [
            'assignment_id' => $assignment->id,
            'before_status' => $beforeStatus,
            'new_status' => $assignment->status,
            'updates' => $validated,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Assignment updated successfully',
            'data' => $assignment->fresh(['enumerator', 'table']),
        ]);
    }

    /**
     * Helper to apply dynamic JSON operators in SQL query
     */
    private function applyJsonFilter($query, string $column, string $field, string $operator, $value): void
    {
        $sanitizedField = preg_replace('/[^a-zA-Z0-9_\.\-]/', '', $field);
        if (empty($sanitizedField)) {
            return;
        }

        $jsonField = "{$column}->".str_replace('.', '->', $sanitizedField);
        $lowerValue = strtolower($value);

        match ($operator) {
            'equals' => $query->whereRaw("LOWER({$jsonField}) = ?", [$lowerValue]),
            'contains' => $query->whereRaw("LOWER({$jsonField}) like ?", ["%{$lowerValue}%"]),
            'starts_with' => $query->whereRaw("LOWER({$jsonField}) like ?", ["{$lowerValue}%"]),
            'ends_with' => $query->whereRaw("LOWER({$jsonField}) like ?", ["%{$lowerValue}"]),
            'greater_than' => $query->whereRaw("CAST(JSON_UNQUOTE({$jsonField}) AS DECIMAL(10,2)) > ?", [$value]),
            'less_than' => $query->whereRaw("CAST(JSON_UNQUOTE({$jsonField}) AS DECIMAL(10,2)) < ?", [$value]),
            default => $query->whereRaw("LOWER({$jsonField}) = ?", [$lowerValue]),
        };
    }
}
