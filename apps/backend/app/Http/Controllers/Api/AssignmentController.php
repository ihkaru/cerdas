<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\PrelistImport;
use App\Models\FormVersion;
use App\Models\Assignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class AssignmentController extends Controller {
    /**
     * List assignments for the current user
     */
    public function index(Request $request): JsonResponse {
        $user = $request->user();

        $query = Assignment::query()
            ->whereHas('formVersion.form', function ($q) use ($user) {
                // Filter by app access
                $q->whereIn('app_id', $user->appMemberships->pluck('app_id'));
            });

        // Filter based on role
        if (!$user->isSuperAdmin()) {
            // If enumerator, only show own assignments
            $query->where(function ($q) use ($user) {
                $q->where('enumerator_id', $user->id)
                    ->orWhere('supervisor_id', $user->id);
            });
        }

        // Optional filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('form_id')) {
            $query->whereHas('formVersion', function ($q) use ($request) {
                $q->where('form_id', $request->form_id);
            });
        }

        $perPage = (int) $request->input('per_page', 50);
        if ($perPage > 5000) $perPage = 5000; // Increased limit for faster sync

        \Illuminate\Support\Facades\Log::info("Fetching Assignments", [
            'user_id' => $user->id,
            'page' => $request->page,
            'per_page' => $perPage
        ]);

        $assignments = $query->with('formVersion')->orderBy('id')->paginate($perPage);

        \Illuminate\Support\Facades\Log::info("Assignments Fetched", [
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
            'form_version_id' => 'required|exists:form_versions,id',
        ]);

        $formVersion = FormVersion::with('form')->find($request->form_version_id);
        $user = $request->user();

        if (!$user->hasAppAccess($formVersion->form->app_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        if (!$formVersion->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'Can only assign to published versions',
            ], 400);
        }

        try {
            // Updated PrelistImport to accept form_id
            Excel::import(new PrelistImport($formVersion->id, $formVersion->form->app_id, $formVersion->form_id), $request->file('file'));

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

        // TODO: Proper authorization check (policy)
        if (
            $assignment->enumerator_id !== $user->id &&
            $assignment->supervisor_id !== $user->id &&
            !$user->isSuperAdmin()
        ) {

            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $assignment->load(['formVersion.form', 'organization']),
        ]);
    }
}
