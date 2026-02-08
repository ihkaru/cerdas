<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\PrelistImport;
use App\Models\TableVersion;
use App\Models\Assignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Log;

class AssignmentController extends Controller {
    /**
     * List assignments for the current user
     */
    /**
     * List assignments for the current user
     */
    public function index(Request $request): JsonResponse {
        $user = $request->user();

        $query = Assignment::query()
            ->whereHas('tableVersion.table', function ($q) use ($user) {
                // Filter by app access
                $q->whereIn('app_id', $user->appMemberships->pluck('app_id'));
            });

        // Filter based on role
        if (!$user->isSuperAdmin()) {
            // Determine which apps allow unassigned access
            // Logic: App Mode = 'simple' AND restrict_unassigned != true
            $allowedAppIds = $user->apps()
                ->where('mode', 'simple')
                ->get()
                ->filter(fn($app) => ($app->settings['restrict_unassigned'] ?? false) === false)
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

        if ($request->has('table_id')) {
            $query->whereHas('tableVersion', function ($q) use ($request) {
                $q->where('table_id', $request->table_id);
            });
        }

        $perPage = (int) $request->input('per_page', 50);
        if ($perPage > 5000) $perPage = 5000; // Increased limit for faster sync

        Log::info("Fetching Assignments", [
            'user_id' => $user->id,
            'page' => $request->page,
            'per_page' => $perPage
        ]);

        $assignments = $query->with('tableVersion')->orderBy('id')->paginate($perPage);

        Log::info("Assignments Fetched", [
            'count' => $assignments->count(),
            'total' => $assignments->total()
        ]);

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }

    /**
     * Import assignments from Excel/CSV
     */
    public function import(Request $request): JsonResponse {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,xls',
            'table_version_id' => 'required|exists:table_versions,id',
        ]);

        $tableVersion = TableVersion::with('table')->find($request->table_version_id);
        $user = $request->user();

        if (!$user->hasAppAccess($tableVersion->table->app_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        if (!$tableVersion->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'Can only assign to published versions',
            ], 400);
        }

        try {
            Excel::import(new PrelistImport($tableVersion->id, $tableVersion->table->app_id, $tableVersion->table_id), $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => 'Assignments imported successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific assignment
     */
    public function show(Request $request, Assignment $assignment): JsonResponse {
        $user = $request->user();

        // Check explicit assignment
        $isAssigned = $assignment->enumerator_id === $user->id || $assignment->supervisor_id === $user->id;

        if (!$isAssigned && !$user->isSuperAdmin()) {
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

            if (!$accessGranted) {
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
}
