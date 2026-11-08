<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Models\App;
use App\Models\Assignment;
use App\Models\Response;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AgentAppController extends Controller
{
    /**
     * List all applications with comprehensive metrics for agent inspection.
     *
     * GET /api/agent/v1/apps
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status', 'all'); // all, active, inactive, trashed
        $mode = $request->input('mode', 'all');     // all, simple, complex
        $search = $request->input('search');

        $query = App::query();

        match ($status) {
            'trashed' => $query->onlyTrashed(),
            'active' => $query->where('is_active', true),
            'inactive' => $query->where('is_active', false),
            default => $query->withTrashed(),
        };

        if ($mode && $mode !== 'all') {
            $query->where('mode', $mode);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $apps = $query->with(['creator:id,name,email'])
            ->withCount(['tables', 'memberships'])
            ->orderByDesc('updated_at')
            ->get();

        // Optimized bulk pre-aggregation across apps to prevent N+1 timeout
        $appIds = $apps->pluck('id')->all();
        $allTables = Table::withTrashed()->whereIn('app_id', $appIds)->get(['id', 'app_id', 'source_type']);
        $tableIdsByApp = $allTables->groupBy('app_id')->map(fn ($t) => $t->pluck('id')->all());
        $allTblIds = $allTables->pluck('id')->all();

        $assignCounts = ! empty($allTblIds)
            ? Assignment::withTrashed()->whereIn('table_id', $allTblIds)->groupBy('table_id')->selectRaw('table_id, count(*) as cnt')->pluck('cnt', 'table_id')->all()
            : [];
        $respCounts = ! empty($allTblIds)
            ? Response::withTrashed()->join('assignments', 'responses.assignment_id', '=', 'assignments.id')
                ->whereIn('assignments.table_id', $allTblIds)->groupBy('assignments.table_id')
                ->selectRaw('assignments.table_id, count(*) as cnt')->pluck('cnt', 'assignments.table_id')->all()
            : [];

        $appSummaries = $apps->map(function (App $app) use ($allTables, $tableIdsByApp, $assignCounts, $respCounts) {
            $tIds = $tableIdsByApp[$app->id] ?? [];
            $assignmentsCount = array_sum(array_map(fn ($id) => $assignCounts[$id] ?? 0, $tIds));
            $responsesCount = array_sum(array_map(fn ($id) => $respCounts[$id] ?? 0, $tIds));
            $connectedSheetsCount = $allTables->where('app_id', $app->id)->where('source_type', 'google_sheets')->count();

            return [
                'id' => $app->id,
                'name' => $app->name,
                'slug' => $app->slug,
                'description' => $app->description,
                'mode' => $app->mode,
                'is_active' => (bool) $app->is_active,
                'is_trashed' => $app->trashed(),
                'creator' => $app->creator ? [
                    'id' => $app->creator->id,
                    'name' => $app->creator->name,
                    'email' => $app->creator->email,
                ] : null,
                'metrics' => [
                    'tables_count' => $app->tables_count,
                    'members_count' => $app->memberships_count,
                    'assignments_count' => $assignmentsCount,
                    'responses_count' => $responsesCount,
                    'google_sheets_connected_tables' => $connectedSheetsCount,
                ],
                'created_at' => $app->created_at?->toIso8601String(),
                'updated_at' => $app->updated_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'total' => $appSummaries->count(),
            'data' => $appSummaries,
        ]);
    }

    /**
     * Get detailed blueprint of a specific application.
     *
     * GET /api/agent/v1/apps/{app}
     */
    public function show(Request $request, string $appId): JsonResponse
    {
        $app = App::withTrashed()
            ->where('id', $appId)
            ->orWhere('slug', $appId)
            ->with(['creator:id,name,email', 'members:id,name,email', 'tables' => function ($tQ) {
                $tQ->withTrashed()->with(['versions' => function ($vQ) {
                    $vQ->select(['id', 'table_id', 'version', 'published_at', 'changelog', 'created_at']);
                }]);
            }])
            ->firstOrFail();

        $tableSummaries = $app->tables->map(function (Table $table) {
            return [
                'id' => $table->id,
                'name' => $table->name,
                'slug' => $table->slug,
                'description' => $table->description,
                'current_version' => $table->current_version,
                'source_type' => $table->source_type,
                'is_trashed' => $table->trashed(),
                'google_sheet_synced' => $table->source_type === 'google_sheets' && ! empty($table->source_config['google_sheet']['sync_enabled']),
                'google_sheet_config' => $table->source_type === 'google_sheets' ? [
                    'spreadsheet_id' => $table->source_config['google_sheet']['spreadsheet_id'] ?? null,
                    'sheet_name' => $table->source_config['google_sheet']['sheet_name'] ?? null,
                    'sync_mode' => $table->source_config['google_sheet']['sync_mode'] ?? 'append_only',
                ] : null,
                'published_at' => $table->published_at?->toIso8601String(),
                'versions' => $table->versions->map(fn ($v) => [
                    'version' => $v->version,
                    'is_published' => $v->published_at !== null,
                    'published_at' => $v->published_at?->toIso8601String(),
                    'changelog' => $v->changelog,
                ]),
            ];
        });

        $members = $app->members->map(fn ($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->pivot->role ?? 'enumerator',
        ]);

        $activeJoinLink = $app->joinLinks()->where('is_active', true)->first();
        $rawClient = env('CERDAS_CLIENT_URL', env('CERDAS_APP_URL', env('APP_URL', 'https://app.dvlpid.my.id')));
        $clientUrl = str_contains($rawClient, 'api.') ? str_replace('api.', 'app.', $rawClient) : $rawClient;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $app->id,
                'name' => $app->name,
                'slug' => $app->slug,
                'description' => $app->description,
                'mode' => $app->mode,
                'is_active' => (bool) $app->is_active,
                'start_date' => $app->start_date?->toIso8601String(),
                'end_date' => $app->end_date?->toIso8601String(),
                'expired_behavior' => $app->expired_behavior,
                'settings' => $app->settings,
                'join_link' => $activeJoinLink ? [
                    'id' => $activeJoinLink->id,
                    'token' => $activeJoinLink->token,
                    'role' => $activeJoinLink->role,
                    'is_active' => (bool) $activeJoinLink->is_active,
                    'full_url' => rtrim($clientUrl, '/').'/join/'.$activeJoinLink->token,
                    'expires_at' => $activeJoinLink->expires_at?->toIso8601String(),
                ] : null,
                'navigation' => $app->navigation,
                'view_configs' => $app->view_configs,
                'creator' => $app->creator,
                'tables' => $tableSummaries,
                'members' => $members,
                'created_at' => $app->created_at?->toIso8601String(),
                'updated_at' => $app->updated_at?->toIso8601String(),
                'deleted_at' => $app->deleted_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Hotfix or update app configuration/settings.
     *
     * PATCH /api/agent/v1/apps/{app}
     */
    public function update(Request $request, string $appId): JsonResponse
    {
        $app = App::withTrashed()->where('id', $appId)->orWhere('slug', $appId)->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255', 'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean', 'mode' => 'sometimes|string|in:simple,complex',
            'start_date' => 'nullable|date', 'end_date' => 'nullable|date',
            'expired_behavior' => 'nullable|string|in:read_only,hidden',
            'settings' => 'sometimes|array', 'navigation' => 'sometimes|array', 'view_configs' => 'sometimes|array',
            'created_by' => 'sometimes|string|exists:users,id', 'owner_email' => 'sometimes|email|exists:users,email',
        ]);

        // Resolve ownership transfer
        $newOwnerId = $validated['created_by'] ?? null;
        if (! $newOwnerId && ! empty($validated['owner_email'])) {
            $targetUser = \App\Models\User::where('email', $validated['owner_email'])->first();
            $newOwnerId = $targetUser?->id;
        }

        if ($newOwnerId) {
            $validated['created_by'] = $newOwnerId;

            // Ensure new owner is granted app_admin membership
            \App\Models\AppMembership::updateOrCreate(
                ['app_id' => $app->id, 'user_id' => $newOwnerId],
                ['role' => 'app_admin', 'is_active' => true]
            );
        }
        unset($validated['owner_email']);

        // Validate view_configs table_ids if provided
        if (isset($validated['view_configs']) && is_array($validated['view_configs'])) {
            $validTbls = Table::withTrashed()->where('app_id', $app->id)->pluck('id')->all();
            foreach ($validated['view_configs'] as $vKey => $cfg) {
                if (is_array($cfg) && ! empty($cfg['table_id']) && ! empty($validTbls) && ! in_array($cfg['table_id'], $validTbls)) {
                    return response()->json(['success' => false, 'message' => "Invalid table_id in view_configs for '{$vKey}'. Table does not belong to this app."], 422);
                }
            }
        }

        $beforeState = [
            'is_active' => $app->is_active,
            'mode' => $app->mode,
            'created_by' => $app->created_by,
        ];

        $app->update($validated);

        Log::info('[AGENT_MUTATION] App configuration updated by Agent', [
            'app_id' => $app->id,
            'before' => $beforeState,
            'updated_keys' => array_keys($validated),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'App updated successfully',
            'data' => $app->fresh(),
        ]);
    }

    /**
     * Create a new application / survey project programmatically.
     *
     * POST /api/agent/v1/apps
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255', 'description' => 'nullable|string',
            'mode' => 'nullable|string|in:simple,complex', 'is_active' => 'nullable|boolean',
            'start_date' => 'nullable|date', 'end_date' => 'nullable|date',
            'expired_behavior' => 'nullable|string|in:read_only,hidden',
            'organization_id' => 'nullable|string|exists:organizations,id',
            'settings' => 'nullable|array', 'navigation' => 'nullable|array', 'view_configs' => 'nullable|array',
        ]);

        $user = $request->user();
        $slug = \Illuminate\Support\Str::slug($validated['name']);

        // Ensure unique slug
        $originalSlug = $slug;
        $counter = 1;
        while (App::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }

        $app = App::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'mode' => $validated['mode'] ?? 'simple',
            'is_active' => $validated['is_active'] ?? true,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'expired_behavior' => $validated['expired_behavior'] ?? 'read_only',
            'created_by' => $user?->id,
            'settings' => $validated['settings'] ?? [],
            'navigation' => $validated['navigation'] ?? [],
            'view_configs' => $validated['view_configs'] ?? [],
        ]);

        // Attach organization
        $orgId = $validated['organization_id'] ?? $user?->organizations()->first()?->id;
        if ($orgId) {
            $app->organizations()->syncWithoutDetaching([$orgId]);
        }

        return response()->json([
            'success' => true,
            'message' => 'App created successfully',
            'data' => $app,
        ], 201);
    }

    /**
     * Delete (soft-delete) an application.
     *
     * DELETE /api/agent/v1/apps/{app}
     */
    public function destroy(Request $request, string $appId): JsonResponse
    {
        $app = App::where('id', $appId)->orWhere('slug', $appId)->firstOrFail();
        $app->delete();

        return response()->json([
            'success' => true,
            'message' => 'App deleted successfully',
        ]);
    }

    /**
     * Restore a soft-deleted application.
     *
     * POST /api/agent/v1/apps/{app}/restore
     */
    public function restore(Request $request, string $appId): JsonResponse
    {
        $app = App::onlyTrashed()->where('id', $appId)->orWhere('slug', $appId)->firstOrFail();
        $app->restore();

        return response()->json([
            'success' => true,
            'message' => 'App restored successfully',
            'data' => $app,
        ]);
    }
}
