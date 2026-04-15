<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\App;
use App\Models\Assignment;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get global dashboard stats, app list, and recent tables
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $updatedSince = $request->input('updated_since');
        $serverTime = now()->toIso8601String();

        // 1. Global Stats (All Apps)
        // Count assignments specific to this user (enumerator or supervisor)
        $statsQuery = Assignment::query()
            ->where(function ($q) use ($user) {
                $q->where('enumerator_id', $user->id)
                    ->orWhere('supervisor_id', $user->id);
            });

        $stats = [
            'pending' => (clone $statsQuery)->where('status', 'assigned')->count(),
            'in_progress' => (clone $statsQuery)->where('status', 'in_progress')->count(),
            'completed' => (clone $statsQuery)->whereIn('status', ['submitted', 'approved', 'rejected'])->count(),
        ];

        // 2. Apps List (User's Apps)
        if ($user->isSuperAdmin()) {
            $appIds = App::withTrashed()->pluck('id');
        } else {
            // Get Direct Memberships
            $directAppIds = $user->appMemberships()->pluck('app_id');

            // Get Apps via Organization Membership
            $orgAppIds = App::whereHas('organizations.members', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })->pluck('apps.id');

            $appIds = $directAppIds->concat($orgAppIds)->unique();
        }

        $appsQuery = App::whereIn('id', $appIds);

        if ($updatedSince) {
            $appsQuery->withTrashed()->where('updated_at', '>=', \Carbon\Carbon::parse($updatedSince));
        }

        $allQueriedApps = $appsQuery->get();
        $activeApps = $allQueriedApps->whereNull('deleted_at');
        $deletedAppIds = $allQueriedApps->whereNotNull('deleted_at')->pluck('id')->values()->all();

        $apps = $activeApps->map(function ($app) {
            // In future, calculate stats per app here
            return [
                'id' => $app->id,
                'name' => $app->name,
                'description' => $app->description,
                'slug' => $app->slug,
                'navigation' => $app->navigation,
                'view_configs' => $app->view_configs,
                'created_at' => $app->created_at,
            ];
        })->values();

        // 3. Recent Tables (e.g. last edited or accessed)
        // For now, list all active tables user has access to, limited to 5
        $tableIds = Table::whereIn('app_id', $appIds)->pluck('id');
        $recentTables = Table::whereIn('id', $tableIds)
            ->with(['app'])
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($table) {
                return [
                    'id' => $table->id,
                    'name' => $table->name,
                    'app_name' => $table->app->name ?? 'Unknown App',
                    'updated_at' => $table->updated_at,
                    'version' => $table->current_version,
                ];
            });

        // 4. All Tables (for Client Sync)
        $tablesQuery = Table::whereIn('app_id', $appIds);

        if ($updatedSince) {
            $tablesQuery->withTrashed()->where('updated_at', '>=', \Carbon\Carbon::parse($updatedSince));
        }

        $allQueriedTables = $tablesQuery->get();
        $activeTables = $allQueriedTables->whereNull('deleted_at');
        $deletedTableIds = $allQueriedTables->whereNotNull('deleted_at')->pluck('id')->values()->all();

        $allTables = $activeTables->map(function ($table) {
            return [
                'id' => $table->id,
                'app_id' => $table->app_id,
                'name' => $table->name,
                'description' => $table->description,
                'version' => $table->current_version,
                'version_policy' => $table->settings['version_policy'] ?? 'accept_all',
                'updated_at' => $table->updated_at,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'server_time' => $serverTime,
            'deleted_apps' => $deletedAppIds,
            'deleted_tables' => $deletedTableIds,
            'data' => [
                'stats' => $stats,
                'apps' => $apps,
                'recent_tables' => $recentTables, // Renamed from recent_forms
                'tables' => $allTables, // Renamed from forms
            ],
        ]);
    }
}
