<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\App;
use App\Models\Table;
use App\Models\TableVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TableController extends Controller {
    /**
     * List all tables for an app
     */
    public function index(Request $request): JsonResponse {
        $request->validate([
            'app_id' => 'nullable|exists:apps,id',
        ]);

        $user = $request->user();
        $appId = $request->app_id;

        $query = Table::with('latestPublishedVersion');

        if ($appId) {
            // Check app access via AppMembership
            if (!$user->isSuperAdmin() && !$user->apps()->where('app_id', $appId)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to this app',
                ], 403);
            }
            $query->where('app_id', $appId);
        } else {
            // Return tables from all apps user has access to
            $userAppIds = $user->appMemberships->pluck('app_id');
            $query->whereIn('app_id', $userAppIds);
        }

        $tables = $query->get();

        return response()->json([
            'success' => true,
            'data' => $tables,
        ]);
    }

    /**
     * Create a new table
     */
    public function store(Request $request): JsonResponse {
        $validated = $request->validate([
            'app_id' => 'required|exists:apps,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'settings' => 'nullable|array',
            'source_type' => 'nullable|string|in:internal,google_sheets,airtable,api',
            'source_config' => 'nullable|array',
        ]);

        $user = $request->user();

        if (!$user->isSuperAdmin() && !$user->apps()->where('app_id', $validated['app_id'])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this app',
            ], 403);
        }

        // Generate slug from name
        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;

        while (Table::where('app_id', $validated['app_id'])
            ->where('slug', $slug)
            ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter++;
        }

        $table = Table::create([
            'app_id' => $validated['app_id'],
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'settings' => $validated['settings'] ?? null,
            'source_type' => $validated['source_type'] ?? 'internal',
            'source_config' => $validated['source_config'] ?? null,
        ]);

        // Create initial draft version with empty fields
        $table->versions()->create([
            'version' => 1,
            'fields' => [], // Previously schema
            'layout' => [],
        ]);

        return response()->json([
            'success' => true,
            'data' => $table->load('versions'),
            'message' => 'Table created successfully',
        ], 201);
    }

    /**
     * Get a specific table with its current version
     */
    public function show(Request $request, Table $table): JsonResponse {
        $user = $request->user();

        // Check access (super admin bypasses)
        if (!$user->isSuperAdmin() && !$user->apps()->where('app_id', $table->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this table',
            ], 403);
        }

        $table->load(['versions']);

        return response()->json([
            'success' => true,
            'data' => $table,
        ]);
    }

    /**
     * Update table metadata (not fields)
     */
    public function update(Request $request, Table $table): JsonResponse {
        $user = $request->user();

        if (!$user->isSuperAdmin() && !$user->apps()->where('app_id', $table->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'settings' => 'nullable|array',
            'source_type' => 'nullable|string|in:internal,google_sheets,airtable,api',
            'source_config' => 'nullable|array',
        ]);

        $table->update($validated);

        return response()->json([
            'success' => true,
            'data' => $table,
            'message' => 'Table updated successfully',
        ]);
    }

    /**
     * Delete a table (soft delete)
     */
    public function destroy(Request $request, Table $table): JsonResponse {
        $user = $request->user();

        if (!$user->isSuperAdmin() && !$user->apps()->where('app_id', $table->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        // Cascading Hard Delete (Permanent)
        // User requested strict cleanup to avoid DB bloat.

        // 1. Permanently Delete all AppRecords associated with this table
        \App\Models\AppRecord::where('table_id', $table->id)->forceDelete();

        // 2. Permanently Delete all Assignments associated with this table
        \App\Models\Assignment::where('table_id', $table->id)->forceDelete();

        // 3. Permanently Delete the table itself
        $table->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'Table and all associated data PERMANENTLY deleted',
        ]);
    }

    /**
     * List all versions for a table (Version History)
     */
    public function listVersions(Request $request, Table $table): JsonResponse {
        $user = $request->user();

        if (!$user->isSuperAdmin() && !$user->apps()->where('app_id', $table->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        \Illuminate\Support\Facades\Log::debug('Listing versions for table', [
            'table_id' => $table->id,
            'user_id' => $user->id
        ]);

        $versions = $table->versions()
            ->orderByDesc('version')
            ->select(['id', 'version', 'changelog', 'published_at', 'created_at', 'updated_at'])
            ->get()
            ->map(function ($v) {
                return [
                    'id' => $v->id,
                    'version' => $v->version,
                    'changelog' => $v->changelog,
                    'is_published' => $v->published_at !== null,
                    'published_at' => $v->published_at,
                    'created_at' => $v->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $versions,
        ]);
    }

    /**
     * Get a specific version
     */
    public function showVersion(Request $request, Table $table, int $version): JsonResponse {
        $user = $request->user();

        if (!$user->isSuperAdmin() && !$user->apps()->where('app_id', $table->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $tableVersion = $table->versions()
            ->where('version', $version)
            ->first();

        if (!$tableVersion) {
            return response()->json([
                'success' => false,
                'message' => 'Version not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'version' => $tableVersion,
                'fields' => $tableVersion->fields, // Renamed from schema
                'layout' => $tableVersion->layout,
            ],
        ]);
    }

    /**
     * Update a version's fields/layout (Editor Save)
     */
    public function updateVersion(Request $request, Table $table, int $version): JsonResponse {
        $user = $request->user();

        if (!$user->isSuperAdmin() && !$user->apps()->where('app_id', $table->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $tableVersion = $table->versions()->where('version', $version)->first();

        if (!$tableVersion) {
            return response()->json(['success' => false, 'message' => 'Version not found'], 404);
        }

        if ($tableVersion->isPublished()) {
            return response()->json(['success' => false, 'message' => 'Cannot edit published version'], 400);
        }

        \Illuminate\Support\Facades\Log::debug('Updating version', [
            'id' => $version,
            'fields_type' => gettype($request->fields),
            'layout_type' => gettype($request->layout),
            'request_all' => $request->all()
        ]);

        try {
            $validated = $request->validate([
                'fields' => 'nullable|array', // Renamed from schema
                'layout' => 'nullable|array',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Validation failed', $e->errors());
            throw $e;
        }

        $tableVersion->update($validated);

        return response()->json([
            'success' => true,
            'data' => $tableVersion->fresh(),
            'message' => 'Table version saved successfully',
        ]);
    }

    /**
     * Publish a version (makes it immutable)
     */
    public function publishVersion(Request $request, Table $table, int $version): JsonResponse {
        $user = $request->user();

        if (!$user->isSuperAdmin() && !$user->apps()->where('app_id', $table->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $tableVersion = $table->versions()->where('version', $version)->first();

        if (!$tableVersion) {
            return response()->json([
                'success' => false,
                'message' => 'Version not found',
            ], 404);
        }

        if ($tableVersion->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'This version is already published and immutable',
            ], 400);
        }

        \Illuminate\Support\Facades\Log::debug('Publishing version', [
            'id' => $version,
            'changelog' => $request->input('changelog'),
            'request_all' => $request->all()
        ]);

        $changelog = $request->input('changelog', 'Published version ' . $version);
        $tableVersion->publish($changelog);

        // Auto-create new draft version removed. 
        // User should explicitly create draft when they start editing again.

        return response()->json([
            'success' => true,
            'data' => $tableVersion->fresh(),
            'message' => 'Version published successfully.',
        ]);
    }

    /**
     * Create a new draft version based on latest published or specific version
     */
    public function createDraftVersion(Request $request, Table $table): JsonResponse {
        $user = $request->user();

        if (!$user->isSuperAdmin() && !$user->apps()->where('app_id', $table->app_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        // Check if latest version is already a draft
        $latestVersionObj = $table->versions()->orderByDesc('version')->first();

        if ($latestVersionObj && !$latestVersionObj->isPublished()) {
            return response()->json([
                'success' => true,
                'data' => $latestVersionObj,
                'message' => 'Using existing draft version',
            ]);
        }

        // Get latest version number
        $latestVersion = $latestVersionObj ? $latestVersionObj->version : 0;
        $newVersionNum = $latestVersion + 1;

        $newVersion = $table->versions()->create([
            'version' => $newVersionNum,
            'fields' => $latestVersionObj ? $latestVersionObj->fields : [],
            'layout' => $latestVersionObj ? $latestVersionObj->layout : [],
            'published_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $newVersion,
            'message' => 'Draft version created successfully',
        ], 201);
    }
}
