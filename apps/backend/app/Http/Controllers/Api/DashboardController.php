<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\App;
use App\Models\Assignment;
use App\Models\Form;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller {
    /**
     * Get global dashboard stats, app list, and recent forms
     */
    public function index(Request $request): JsonResponse {
        $user = $request->user();

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
            $appsQuery = App::query();
        } else {
            $appsQuery = $user->apps();
        }

        $apps = $appsQuery->get()->map(function ($app) use ($user) {
            // In future, calculate stats per app here
            return [
                'id' => $app->id,
                'name' => $app->name,
                'description' => $app->description,
                'slug' => $app->slug,
                'created_at' => $app->created_at,
            ];
        });

        // 3. Recent Forms (e.g. last edited or accessed)
        // For now, list all forms user has access to, limited to 5
        $formIds = Form::whereIn('app_id', $user->apps->pluck('id'))->pluck('id');
        $recentForms = Form::whereIn('id', $formIds)
            ->with(['app'])
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($form) {
                return [
                    'id' => $form->id,
                    'name' => $form->name,
                    'app_name' => $form->app->name ?? 'Unknown App',
                    'updated_at' => $form->updated_at,
                    'version' => $form->current_version,
                ];
            });

        // 4. All Forms (for Client Sync)
        $allForms = Form::whereIn('app_id', $user->apps->pluck('id'))
            ->get()
            ->map(function ($form) {
                return [
                    'id' => $form->id,
                    'app_id' => $form->app_id,
                    'name' => $form->name,
                    'description' => $form->description,
                    'version' => $form->current_version,
                    'updated_at' => $form->updated_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'apps' => $apps,
                'recent_forms' => $recentForms,
                'forms' => $allForms
            ]
        ]);
    }
}
