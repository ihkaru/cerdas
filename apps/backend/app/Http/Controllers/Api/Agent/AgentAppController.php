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

        if ($status === 'trashed') {
            $query->onlyTrashed();
        } elseif ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        } else {
            $query->withTrashed();
        }

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

        // Calculate assignments & responses aggregates per app
        $appSummaries = $apps->map(function (App $app) {
            $tableIds = Table::withTrashed()->where('app_id', $app->id)->pluck('id');

            $assignmentsCount = Assignment::withTrashed()->whereIn('table_id', $tableIds)->count();
            $responsesCount = Response::withTrashed()->whereHas('assignment', function ($q) use ($tableIds) {
                $q->whereIn('table_id', $tableIds);
            })->count();

            $connectedSheetsCount = Table::where('app_id', $app->id)
                ->where('source_type', 'google_sheets')
                ->count();

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

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $app->id,
                'name' => $app->name,
                'slug' => $app->slug,
                'description' => $app->description,
                'mode' => $app->mode,
                'is_active' => (bool) $app->is_active,
                'settings' => $app->settings,
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
        $app = App::withTrashed()
            ->where('id', $appId)
            ->orWhere('slug', $appId)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'mode' => 'sometimes|string|in:simple,complex',
            'settings' => 'sometimes|array',
            'navigation' => 'sometimes|array',
            'view_configs' => 'sometimes|array',
        ]);

        $beforeState = [
            'is_active' => $app->is_active,
            'mode' => $app->mode,
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
}
