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
            'assigned' => (clone $statsQuery)->where('status', 'assigned')->count(),
            'in_progress' => (clone $statsQuery)->where('status', 'in_progress')->count(),
            // 'submitted' and 'approved' represent finalized/submitted work
            'completed' => (clone $statsQuery)->whereIn('status', ['submitted', 'approved', 'synced', 'rejected'])->count(),
        ];

        // 2. Apps List (User's Apps)
        if ($user->isSuperAdmin()) {
            $appIds = App::withTrashed()->pluck('id');
        } else {
            $appIds = $user->getAccessibleAppIds();
            // Ensure creator's soft-deleted apps are tracked for delta sync
            $createdAppIds = App::withTrashed()->where('created_by', $user->id)->pluck('id')->toArray();
            $appIds = array_values(array_unique(array_merge($appIds, $createdAppIds)));
        }

        $appsQuery = App::query()->whereIn('id', $appIds);

        if ($updatedSince) {
            $since = \Carbon\Carbon::parse($updatedSince);

            // Critical Fix: An app is "updated" for a user if:
            // 1. The App record itself changed (updated_at) or was soft-deleted (deleted_at).
            // 2. The User's membership for that app was just created/updated.
            $appsQuery->withTrashed()->where(function ($q) use ($since, $user) {
                $q->where('updated_at', '>=', $since)
                    ->orWhere('deleted_at', '>=', $since)
                    ->orWhereHas('memberships', function ($mq) use ($since, $user) {
                        $mq->where('user_id', $user->id)
                            ->where('updated_at', '>=', $since);
                    });
            });
        }

        $allQueriedApps = $appsQuery->get();

        if (! $user->isSuperAdmin()) {
            // For surveyors, inactive apps are treated as deleted/inaccessible
            $activeApps = $allQueriedApps->whereNull('deleted_at')->where('is_active', true);
            $deletedApps = $allQueriedApps->filter(function ($app) {
                return $app->deleted_at !== null || ! $app->is_active;
            });
            $deletedAppIds = $deletedApps->pluck('id')->values()->all();
        } else {
            $activeApps = $allQueriedApps->whereNull('deleted_at');
            $deletedAppIds = $allQueriedApps->whereNotNull('deleted_at')->pluck('id')->values()->all();
        }

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

        // 4. All Tables (for Client Sync) — eager load latestVersion for fields/layout/settings
        $tablesQuery = Table::whereIn('app_id', $appIds)->with('latestVersion');

        if ($updatedSince) {
            $since = \Carbon\Carbon::parse($updatedSince);
            $tablesQuery->withTrashed()->where(function ($q) use ($since) {
                $q->where('updated_at', '>=', $since)
                    ->orWhere('deleted_at', '>=', $since);
            });
        }

        $allQueriedTables = $tablesQuery->get();
        if (! $user->isSuperAdmin()) {
            // For surveyors, exclude tables belonging to inactive apps
            $activeAppIds = App::whereIn('id', $appIds)->where('is_active', true)->pluck('id')->toArray();

            $activeTables = $allQueriedTables->whereNull('deleted_at')->filter(function ($table) use ($activeAppIds) {
                return in_array($table->app_id, $activeAppIds);
            });

            $deletedTables = $allQueriedTables->filter(function ($table) use ($activeAppIds) {
                return $table->deleted_at !== null || ! in_array($table->app_id, $activeAppIds);
            });
            $deletedTableIds = $deletedTables->pluck('id')->values()->all();
        } else {
            $activeTables = $allQueriedTables->whereNull('deleted_at');
            $deletedTableIds = $allQueriedTables->whereNotNull('deleted_at')->pluck('id')->values()->all();
        }

        $allTables = $activeTables->map(function ($table) {
            $version = $table->latestVersion;
            // settings dari layout.settings (sumber kebenaran schema) atau dari kolom settings tabel
            $layoutSettings = $version?->layout['settings'] ?? null;
            $tableSettings = $table->settings ?? [];
            $mergedSettings = $layoutSettings ?? $tableSettings;

            return [
                'id' => $table->id,
                'app_id' => $table->app_id,
                'name' => $table->name,
                'description' => $table->description,
                'version' => $table->current_version,
                'version_policy' => $tableSettings['version_policy'] ?? 'accept_all',
                'updated_at' => $table->updated_at,
                // Schema data untuk SQLite lokal client (diperlukan untuk FAB & UI config)
                'fields' => $version?->fields ?? [],
                'layout' => $version?->layout ?? [],
                'settings' => $mergedSettings,
            ];
        })->values();

        $latestApkSetting = \App\Models\SystemSetting::where('key', 'latest_apk')->first();
        $latestApk = $latestApkSetting ? $latestApkSetting->value : [
            'version' => '0.2.28',
            'url' => 'https://github.com/ihkaru/cerdas/releases/latest',
            'changelog' => [
                'Fitur Pusat Unduhan APK langsung di Dashboard',
                'Auto-sinkronisasi versi APK terbaru dari GitHub Releases',
                'Endpoint API publik untuk redirect download APK dan metadata info',
            ],
            'force_update' => false,
        ];

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
                'latest_apk' => $latestApk,
            ],
        ]);
    }
}
