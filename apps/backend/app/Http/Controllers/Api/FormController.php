<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\App;
use App\Models\Form;
use App\Models\FormVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FormController extends Controller {
    /**
     * List all forms for an app
     */
    public function index(Request $request): JsonResponse {
        $request->validate([
            'app_id' => 'nullable|exists:apps,id',
        ]);

        $user = $request->user();
        $appId = $request->app_id;

        $query = Form::with('latestPublishedVersion');

        if ($appId) {
            // Check app access via AppMembership
            if (!$user->apps()->where('app_id', $appId)->exists()) {
                // For now, simple check. Ideally use a Policy or helper.
                // Assuming existing logic: user access is checked against memberships.
                // We don't have hasProjectAccess helper anymore? We need to implement it in user or here.
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to this app',
                ], 403);
            }
            $query->where('app_id', $appId);
        } else {
            // Return forms from all apps user has access to
            $userAppIds = $user->appMemberships->pluck('app_id');
            $query->whereIn('app_id', $userAppIds);
        }

        $forms = $query->get();

        return response()->json([
            'success' => true,
            'data' => $forms,
        ]);
    }

    /**
     * Create a new form
     */
    public function store(Request $request): JsonResponse {
        $validated = $request->validate([
            'app_id' => 'required|exists:apps,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'settings' => 'nullable|array',
        ]);

        $user = $request->user();

        if (!$user->apps()->where('app_id', $validated['app_id'])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this app',
            ], 403);
        }

        // Generate slug from name
        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;

        while (Form::where('app_id', $validated['app_id'])
            ->where('slug', $slug)
            ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter++;
        }

        $form = Form::create([
            'app_id' => $validated['app_id'],
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'settings' => $validated['settings'] ?? null,
        ]);

        // Create initial draft version with empty JSON schema
        $form->versions()->create([
            'version' => 1,
            'schema' => ['fields' => []],
            'layout' => [],
        ]);

        return response()->json([
            'success' => true,
            'data' => $form->load('versions'),
            'message' => 'Form created successfully',
        ], 201);
    }

    /**
     * Get a specific form with its current version
     */
    public function show(Request $request, Form $form): JsonResponse {
        $user = $request->user();

        // Check access
        if (!$user->apps()->where('app_id', $form->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this form',
            ], 403);
        }

        $form->load(['versions']);

        return response()->json([
            'success' => true,
            'data' => $form,
        ]);
    }

    /**
     * Update form metadata (not fields)
     */
    public function update(Request $request, Form $form): JsonResponse {
        $user = $request->user();

        if (!$user->apps()->where('app_id', $form->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'settings' => 'nullable|array',
        ]);

        $form->update($validated);

        return response()->json([
            'success' => true,
            'data' => $form,
            'message' => 'Form updated successfully',
        ]);
    }

    /**
     * Delete a form (soft delete)
     */
    public function destroy(Request $request, Form $form): JsonResponse {
        $user = $request->user();

        if (!$user->apps()->where('app_id', $form->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $form->delete();

        return response()->json([
            'success' => true,
            'message' => 'Form deleted successfully',
        ]);
    }

    /**
     * Get a specific version
     */
    public function showVersion(Request $request, Form $form, int $version): JsonResponse {
        $user = $request->user();

        if (!$user->apps()->where('app_id', $form->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $formVersion = $form->versions()
            ->where('version', $version)
            ->first();

        if (!$formVersion) {
            return response()->json([
                'success' => false,
                'message' => 'Version not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'version' => $formVersion,
                'schema' => $formVersion->schema, // Use JSON column
                'layout' => $formVersion->layout,
            ],
        ]);
    }

    /**
     * Update a version's schema/layout (Editor Save)
     */
    public function updateVersion(Request $request, Form $form, int $version): JsonResponse {
        $user = $request->user();

        if (!$user->apps()->where('app_id', $form->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $formVersion = $form->versions()->where('version', $version)->first();

        if (!$formVersion) {
            return response()->json(['success' => false, 'message' => 'Version not found'], 404);
        }

        if ($formVersion->isPublished()) {
            return response()->json(['success' => false, 'message' => 'Cannot edit published version'], 400);
        }

        $validated = $request->validate([
            'schema' => 'nullable|array',
            'layout' => 'nullable|array',
        ]);

        $formVersion->update($validated);

        return response()->json([
            'success' => true,
            'data' => $formVersion->fresh(),
            'message' => 'Form version saved successfully',
        ]);
    }

    /**
     * Publish a version (makes it immutable)
     */
    public function publishVersion(Request $request, Form $form, int $version): JsonResponse {
        $user = $request->user();

        if (!$user->apps()->where('app_id', $form->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $formVersion = $form->versions()->where('version', $version)->first();

        if (!$formVersion) {
            return response()->json([
                'success' => false,
                'message' => 'Version not found',
            ], 404);
        }

        if ($formVersion->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'This version is already published and immutable',
            ], 400);
        }

        $changelog = $request->input('changelog', 'Published version ' . $version);
        $formVersion->publish($changelog); // Ensure publish method exists in Model or implement here

        // Update form current_version
        $form->update(['current_version' => $version]);

        return response()->json([
            'success' => true,
            'data' => $formVersion->fresh(),
            'message' => 'Version published successfully',
        ]);
    }

    /**
     * Create a new draft version based on latest published or specific version
     */
    public function createDraftVersion(Request $request, Form $form): JsonResponse {
        $user = $request->user();

        if (!$user->apps()->where('app_id', $form->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        // Get latest version number
        $latestVersion = $form->versions()->max('version') ?? 0;
        $newVersionNum = $latestVersion + 1;

        // Find source version to copy from (latest one)
        $sourceVersion = $form->versions()->orderByDesc('version')->first();

        $newVersion = $form->versions()->create([
            'version' => $newVersionNum,
            'schema' => $sourceVersion ? $sourceVersion->schema : ['fields' => []],
            'layout' => $sourceVersion ? $sourceVersion->layout : [],
            'published_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $newVersion,
            'message' => 'Draft version created successfully',
        ], 201);
    }
}
