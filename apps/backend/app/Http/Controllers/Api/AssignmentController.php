<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\PrelistImport;
use App\Models\Assignment;
use App\Models\Response;
use App\Models\TableVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Maatwebsite\Excel\Facades\Excel;

class AssignmentController extends Controller
{
    /**
     * List assignments for the current user
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $tableId = $request->input('table_id');
        if ($tableId) {
            $this->maybeSyncFromGoogleSheet((string) $tableId);
        }

        $query = Assignment::query()
            ->whereHas('tableVersion.table', function ($q) use ($user) {
                // Filter by app access
                $q->whereIn('app_id', $user->getAccessibleAppIds());
            });

        // Filter based on role
        if (! $user->isSuperAdmin()) {
            // Determine which apps allow unassigned access
            // Logic: App Mode = 'simple' AND restrict_unassigned != true
            $allowedAppIds = \App\Models\App::whereIn('id', $user->getAccessibleAppIds())
                ->where('mode', 'simple')
                ->get()
                ->filter(fn ($app) => ($app->settings['restrict_unassigned'] ?? false) === false)
                ->pluck('id');

            $query->where(function ($q) use ($user, $allowedAppIds) {
                // 1. Explicitly assigned
                $q->where('enumerator_id', $user->id)
                    ->orWhere('supervisor_id', $user->id);

                // 2. Unassigned in allowed apps (Simple Mode & Not Restricted)
                // MODIFIED: Also include assigned tasks in Simple Mode (Shared Access)
                if ($allowedAppIds->isNotEmpty()) {
                    $q->orWhereHas('tableVersion.table', function ($t) use ($allowedAppIds) {
                        $t->whereIn('app_id', $allowedAppIds);
                    });
                }
            });
        }

        // Optional filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($tableId) {
            $query->whereHas('tableVersion', function ($q) use ($tableId) {
                $q->where('table_id', $tableId);
            });
        }

        // Delta Sync: Filter by updated_at
        if ($request->has('updated_since')) {
            $updatedSince = \Carbon\Carbon::parse($request->input('updated_since'));
            if ($request->boolean('include_deleted')) {
                $query->withTrashed();
                // Include either active records updated since X OR soft-deleted records deleted since X
                $query->where(function ($q) use ($updatedSince) {
                    $q->where('updated_at', '>=', $updatedSince)
                        ->orWhere('deleted_at', '>=', $updatedSince);
                });
            } else {
                $query->where('updated_at', '>=', $updatedSince);
            }
        }

        $perPage = (int) $request->input('per_page', 50);
        if ($perPage > 5000) {
            $perPage = 5000;
        } // Increased limit for faster sync

        Log::info('Fetching Assignments', [
            'user_id' => $user->id,
            'page' => $request->page,
            'per_page' => $perPage,
        ]);

        if ($request->has('cursor') || $request->boolean('use_cursor')) {
            $assignments = $query->with('tableVersion')->orderBy('id')->cursorPaginate($perPage);
        } else {
            $assignments = $query->with('tableVersion')->orderBy('id')->paginate($perPage);
        }

        Log::info('Assignments Fetched', [
            'count' => $assignments->count(),
            'total' => method_exists($assignments, 'total') ? $assignments->total() : 'cursor',
        ]);

        return response()->json([
            'success' => true,
            'server_time' => now()->toIso8601String(),
            'data' => $assignments,
        ]);
    }

    /**
     * Import assignments from Excel/CSV
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,xls',
            'table_version_id' => 'required|exists:table_versions,id',
        ]);

        $tableVersion = TableVersion::with('table')->find($request->table_version_id);

        if (! $tableVersion) {
            return response()->json([
                'success' => false,
                'message' => 'Table version not found',
            ], 404);
        }

        $user = $request->user();

        /** @var \App\Models\Table $table */
        $table = $tableVersion->table;

        if (! $user->hasAppAccess($table->app_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        if (! $tableVersion->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'Can only assign to published versions',
            ], 400);
        }

        try {
            Excel::import(new PrelistImport($tableVersion->id, $table->app_id, $table->id), $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => 'Assignments imported successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific assignment
     */
    public function show(Request $request, Assignment $assignment): JsonResponse
    {
        $user = $request->user();

        // Check explicit assignment
        $isAssigned = $assignment->enumerator_id === $user->id || $assignment->supervisor_id === $user->id;

        if (! $isAssigned && ! $user->isSuperAdmin()) {
            // Check if unassigned and allowed
            $isUnassigned = is_null($assignment->enumerator_id);
            $accessGranted = false;

            if ($isUnassigned) {
                // Load Table -> App to check settings
                $assignment->loadMissing('tableVersion.table.app');
                $app = $assignment->tableVersion->table->app;

                if ($app->mode === 'simple' && ($app->settings['restrict_unassigned'] ?? false) === false) {
                    $accessGranted = true;
                }
            }

            if (! $accessGranted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied',
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $assignment->load(['tableVersion.table', 'organization']),
        ]);
    }

    /**
     * Delete (soft-delete) an assignment and its responses/records
     */
    public function destroy(Request $request, Assignment $assignment): JsonResponse
    {
        try {
            $user = $request->user();

            // Permission check: Assigned enumerator/supervisor or SuperAdmin or App Admin
            $isAssigned = $assignment->enumerator_id === $user->id || $assignment->supervisor_id === $user->id;

            if (! $isAssigned && ! $user->isSuperAdmin()) {
                $assignment->loadMissing(['table.app', 'tableVersion.table.app']);
                $app = $assignment->tableVersion?->table?->app ?? $assignment->table?->app;

                if ($app && ! $user->hasAppAccess($app->id)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied',
                    ], 403);
                }
            }

            // Delete associated responses (using Eloquent models so deleting events trigger Google Sheet sync)
            Response::where('assignment_id', $assignment->id)->get()->each(fn ($response) => $response->delete());

            // Soft-delete assignment
            $assignment->delete();

            Log::info("[AssignmentController] Soft-deleted assignment {$assignment->id} by user {$user->id}");

            return response()->json([
                'success' => true,
                'message' => 'Assignment deleted successfully',
            ]);
        } catch (\Throwable $e) {
            Log::error("[AssignmentController] Failed to delete assignment {$assignment->id}: {$e->getMessage()}", [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete assignment: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Smart Import JSON Prelist with Strategies:
     * - 'upsert': Match and update in-place, insert new (default)
     * - 'merge_columns': Merge new columns into existing prelists by match_key
     * - 'append': Add new rows only
     * - 'replace_prelist': Replace untouched assigned tasks
     */
    public function importJson(Request $request): JsonResponse
    {
        $request->validate([
            'table_id' => 'required|string',
            'rows' => 'required|array|min:1',
            'strategy' => 'nullable|string|in:upsert,merge_columns,append,replace_prelist',
            'match_key' => 'nullable|string',
        ]);

        $user = $request->user();
        $tableId = $request->input('table_id');
        $rows = $request->input('rows');
        $strategy = $request->input('strategy', 'upsert');
        $matchKey = $request->input('match_key');

        $table = \App\Models\Table::find($tableId);
        if (! $table) {
            return response()->json(['success' => false, 'message' => 'Table not found'], 404);
        }

        if (! $user->hasAppAccess($table->app_id) && ! $user->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Access denied'], 403);
        }

        $versionModel = $table->versions()->latest('version')->first();
        $versionId = $versionModel?->id;
        $defaultOrgId = $table->app->organizations()->first()?->id;
        $now = now();

        \Illuminate\Support\Facades\DB::beginTransaction();

        try {
            // Existing untouched 'assigned' assignments for this table
            $existingAssignments = Assignment::where('table_id', $tableId)
                ->where('status', 'assigned')
                ->whereDoesntHave('responses')
                ->get();

            $existingMap = [];
            $unkeyedList = [];

            if (! empty($matchKey)) {
                $isIdMatch = in_array(strtolower(trim($matchKey)), ['id', 'assignment_id', 'assignment id', 'external_id', '_cerdas_id']);
                foreach ($existingAssignments as $existing) {
                    $val = $isIdMatch 
                        ? ($existing->id ?? $existing->external_id) 
                        : ($existing->prelist_data[$matchKey] ?? $existing->external_id ?? $existing->id);

                    if ($val !== null && trim((string) $val) !== '') {
                        $existingMap[trim(strtolower((string) $val))] = $existing;
                    } else {
                        $unkeyedList[] = $existing;
                    }
                }
            } else {
                $unkeyedList = $existingAssignments->all();
            }

            $unkeyedIndex = 0;
            $usedAssignmentIds = [];
            $updatedCount = 0;
            $createdCount = 0;
            $insertRecords = [];

            $metadataKeys = array_flip([
                'Assignment ID', 'assignment_id', 'id',
                'Status', 'status',
                'Submitted Version', 'submitted_version',
                'Created At', 'created_at',
                'Updated At', 'updated_at',
                'Deleted At', 'deleted_at',
                'Status History', 'status_history',
                'Enumerator', 'enumerator',
                'Supervisor', 'supervisor',
                'Organization', 'organization'
            ]);

            foreach ($rows as $rowIndex => $rowData) {
                if (! is_array($rowData) || empty($rowData)) {
                    continue;
                }

                // Clean system metadata columns so they don't pollute prelist attributes
                $cleanRowData = array_diff_key($rowData, $metadataKeys);
                if (empty($cleanRowData)) {
                    $cleanRowData = $rowData; // Fallback if entire row was in metadata keys
                }

                $recordId = \Illuminate\Support\Str::orderedUuid()->toString();
                $jsonData = json_encode($cleanRowData);

                $insertRecords[] = [
                    'id' => $recordId,
                    'app_id' => $table->app_id,
                    'table_id' => $table->id,
                    'data' => $jsonData,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $matchedAssignment = null;

                if ($strategy !== 'append') {
                    if (! empty($matchKey) && isset($rowData[$matchKey])) {
                        $matchVal = trim(strtolower((string) $rowData[$matchKey]));
                        $matchedAssignment = $existingMap[$matchVal] ?? null;
                    } elseif (isset($unkeyedList[$unkeyedIndex])) {
                        $matchedAssignment = $unkeyedList[$unkeyedIndex];
                        $unkeyedIndex++;
                    }
                }

                if ($matchedAssignment) {
                    // Update in place
                    if ($strategy === 'merge_columns') {
                        $merged = array_merge($matchedAssignment->prelist_data ?? [], $cleanRowData);
                        $matchedAssignment->prelist_data = $merged;
                    } else {
                        $matchedAssignment->prelist_data = $cleanRowData;
                    }

                    $matchedAssignment->table_version_id = $versionId;
                    $matchedAssignment->updated_at = $now;
                    $matchedAssignment->save();

                    $usedAssignmentIds[] = $matchedAssignment->id;
                    $updatedCount++;
                } else {
                    // Create New Assignment
                    $newAssignment = new Assignment();
                    $newAssignment->id = (string) \Illuminate\Support\Str::uuid();
                    $newAssignment->table_id = $table->id;
                    $newAssignment->table_version_id = $versionId;
                    $newAssignment->organization_id = $defaultOrgId;
                    $newAssignment->supervisor_id = null;
                    $newAssignment->enumerator_id = null;
                    $newAssignment->status = 'assigned';
                    $newAssignment->prelist_data = $cleanRowData;
                    $newAssignment->created_at = $now;
                    $newAssignment->updated_at = $now;
                    $newAssignment->save();

                    $usedAssignmentIds[] = $newAssignment->id;
                    $createdCount++;
                }
            }

            // Sync to AppRecord for Data Preview (Replace cleanly)
            \App\Models\AppRecord::where('table_id', $table->id)->forceDelete();
            if (! empty($insertRecords)) {
                foreach (array_chunk($insertRecords, 250) as $chunk) {
                    \App\Models\AppRecord::insert($chunk);
                }
            }

            // If replace_prelist strategy, soft-delete untouched prelists that were not present
            $softDeletedCount = 0;
            if ($strategy === 'replace_prelist') {
                $unusedAssignments = $existingAssignments->whereNotIn('id', $usedAssignmentIds);
                foreach ($unusedAssignments as $orphan) {
                    $orphan->delete();
                    $softDeletedCount++;
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data prelist berhasil diproses',
                'updated' => $updatedCount,
                'created' => $createdCount,
                'soft_deleted' => $softDeletedCount,
                'total' => $updatedCount + $createdCount,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            Log::error("[AssignmentController] importJson failed: {$e->getMessage()}");

            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses import data: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Quick Prelist Edit (In-Place Update for Single Typo Fixes)
     */
    public function updatePrelist(Request $request, Assignment $assignment): JsonResponse
    {
        $request->validate([
            'prelist_data' => 'required|array',
        ]);

        $user = $request->user();
        $assignment->loadMissing('tableVersion.table');
        $table = $assignment->tableVersion?->table;

        if ($table && ! $user->hasAppAccess($table->app_id) && ! $user->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Access denied'], 403);
        }

        $assignment->prelist_data = $request->input('prelist_data');
        $assignment->save();

        return response()->json([
            'success' => true,
            'message' => 'Data prelist berhasil diperbarui',
            'data' => $assignment,
        ]);
    }

    /**
     * Proactively sync latest changes from Google Sheet on client pull (rate-limited to max 1 per 5s).
     */
    private function maybeSyncFromGoogleSheet(string $tableId): void
    {
        $rateKey = "gsheet_sync_on_pull:{$tableId}";
        RateLimiter::attempt($rateKey, 1, function () use ($tableId) {
            $table = \App\Models\Table::with(['app', 'versions'])->find($tableId);
            if (! $table || $table->source_type !== 'google_sheets') {
                return;
            }

            $sourceConfig = $table->source_config['google_sheet'] ?? null;
            if (! $sourceConfig || empty($sourceConfig['sync_enabled']) || empty($sourceConfig['inbound_sync_enabled']) || empty($sourceConfig['spreadsheet_id'])) {
                return;
            }

            // Echo guard: don't pull if we just wrote outbound in the last 10s
            if (! empty($sourceConfig['last_flushed_at'])) {
                $flushedTime = strtotime($sourceConfig['last_flushed_at']);
                if ($flushedTime && (time() - $flushedTime) < 10) {
                    return;
                }
            }

            $app = $table->app;
            if (! $app) {
                return;
            }

            $version = $table->getWorkingVersion();
            $fields = $version?->fields ?? [];

            try {
                $importAction = app(\App\Actions\GoogleSheet\ImportGoogleSheetRowsAction::class);
                $importAction->execute(
                    $app,
                    $table,
                    $sourceConfig['spreadsheet_id'],
                    $sourceConfig['sheet_name'] ?? $table->name,
                    $fields
                );
            } catch (\Throwable $e) {
                Log::warning("maybeSyncFromGoogleSheet failed for table [{$tableId}]: ".$e->getMessage());
            }
        }, decaySeconds: 5);
    }
}
