<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\App;
use App\Models\Table;
use App\Models\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * App Schema Controller
 * 
 * Handles full App-level JSON schema operations for import/export and code editing.
 */
class AppSchemaController extends Controller {
    /**
     * Get full App schema as JSON.
     * 
     * Returns the comprehensive JSON representation including:
     * - App metadata (name, slug, description, mode, navigation)
     * - All Tables with their fields, settings, source config
     * - All Views with their table references and config
     */
    public function getSchema(App $app): JsonResponse {
        // Load all relationships
        $app->load(['tables.latestVersion', 'views']);

        // Build the schema structure
        $schema = [
            'app' => [
                'name' => $app->name,
                'slug' => $app->slug,
                'description' => $app->description ?? '',
                'mode' => $app->mode ?? 'simple',
            ],
            'tables' => [],
            'views' => [],
            'navigation' => $app->navigation ?? [],
        ];

        // Add tables
        foreach ($app->tables as $table) {
            $version = $table->latestVersion;
            $schema['tables'][$table->slug] = [
                'name' => $table->name,
                'description' => $table->description ?? '',
                'source_type' => $table->source_type ?? 'internal',
                'source_config' => $table->source_config ?? [],
                'fields' => $version?->fields ?? [],
                'settings' => $version?->layout['settings'] ?? [
                    'icon' => 'list_bullet',
                    'actions' => [
                        'header' => [],
                        'row' => [],
                        'swipe' => ['left' => [], 'right' => []]
                    ]
                ],
            ];
        }

        // Add views
        foreach ($app->views as $view) {
            // Find the table slug for this view
            $table = $app->tables->firstWhere('id', $view->table_id);
            $tableSlug = $table ? $table->slug : 'unknown';

            $schema['views'][$view->name] = [
                'table' => $tableSlug,
                'name' => $view->name,
                'type' => $view->type ?? 'deck',
                'description' => $view->description ?? '',
                'config' => $view->config ?? [],
            ];
        }

        return response()->json($schema);
    }

    /**
     * Update App from JSON schema.
     * 
     * Accepts a full App JSON and updates:
     * - App metadata
     * - Creates/Updates/Deletes Tables
     * - Creates/Updates/Deletes Views
     * - Updates Navigation
     */
    public function updateSchema(Request $request, App $app): JsonResponse {
        $data = $request->json()->all();

        // Validate structure (basic validation, more in frontend)
        $validator = Validator::make($data, [
            'app' => 'required|array',
            'app.name' => 'required|string',
            'app.slug' => 'required|string',
            'tables' => 'required|array',
            'views' => 'present|array',
            'navigation' => 'present|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Update App metadata
            $app->update([
                'name' => $data['app']['name'],
                'slug' => $data['app']['slug'],
                'description' => $data['app']['description'] ?? null,
                'mode' => $data['app']['mode'] ?? 'simple',
                'navigation' => $data['navigation'] ?? [],
            ]);

            // Track existing tables for deletion
            $existingTableSlugs = $app->tables->pluck('slug')->toArray();
            $newTableSlugs = array_keys($data['tables']);

            // Update/Create tables
            foreach ($data['tables'] as $slug => $tableData) {
                $table = $app->tables()->where('slug', $slug)->first();

                if ($table) {
                    // Update existing table
                    $table->update([
                        'name' => $tableData['name'],
                        'description' => $tableData['description'] ?? null,
                        'source_type' => $tableData['source_type'] ?? 'internal',
                        'source_config' => $tableData['source_config'] ?? [],
                    ]);
                } else {
                    // Create new table
                    $table = $app->tables()->create([
                        'slug' => $slug,
                        'name' => $tableData['name'],
                        'description' => $tableData['description'] ?? null,
                        'source_type' => $tableData['source_type'] ?? 'internal',
                        'source_config' => $tableData['source_config'] ?? [],
                    ]);
                }

                // Create/Update version with fields and layout
                $version = $table->latestDraftVersion ?? $table->createDraftVersion();
                $version->update([
                    'fields' => $tableData['fields'] ?? [],
                    'layout' => [
                        'type' => 'standard',
                        'settings' => $tableData['settings'] ?? [],
                        'views' => $version->layout['views'] ?? [],
                    ],
                ]);
            }

            // Delete removed tables
            $tablesToDelete = array_diff($existingTableSlugs, $newTableSlugs);
            $app->tables()->whereIn('slug', $tablesToDelete)->delete();

            // Refresh tables for view processing
            $app->load('tables');

            // Track existing views for deletion
            $existingViewNames = $app->views->pluck('name')->toArray();
            $newViewNames = array_keys($data['views'] ?? []);

            // Update/Create views
            foreach ($data['views'] ?? [] as $viewKey => $viewData) {
                // Find table by slug
                $table = $app->tables->firstWhere('slug', $viewData['table']);
                if (!$table) {
                    continue; // Skip if table not found
                }

                $view = $app->views()->where('name', $viewKey)->first();

                $viewPayload = [
                    'table_id' => $table->id,
                    'name' => $viewData['name'] ?? $viewKey,
                    'type' => $viewData['type'] ?? 'deck',
                    'description' => $viewData['description'] ?? null,
                    'config' => $viewData['config'] ?? [],
                ];

                if ($view) {
                    $view->update($viewPayload);
                } else {
                    $app->views()->create($viewPayload);
                }
            }

            // Delete removed views
            $viewsToDelete = array_diff($existingViewNames, $newViewNames);
            $app->views()->whereIn('name', $viewsToDelete)->delete();

            DB::commit();

            return response()->json([
                'message' => 'Schema updated successfully',
                'app' => $app->fresh(['tables.latestVersion', 'views'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update schema',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export App schema as downloadable JSON file.
     */
    public function exportSchema(App $app): JsonResponse {
        // Get schema using getSchema method
        $schemaResponse = $this->getSchema($app);
        $schema = json_decode($schemaResponse->getContent(), true);

        return response()->json($schema)
            ->header('Content-Disposition', 'attachment; filename="' . $app->slug . '-schema.json"')
            ->header('Content-Type', 'application/json');
    }

    /**
     * Import/Create App from JSON schema.
     */
    public function importSchema(Request $request): JsonResponse {
        $data = $request->json()->all();

        // Validate structure
        $validator = Validator::make($data, [
            'app' => 'required|array',
            'app.name' => 'required|string',
            'app.slug' => 'required|string',
            'tables' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if slug exists
        $existingApp = App::where('slug', $data['app']['slug'])->first();
        if ($existingApp) {
            return response()->json([
                'message' => 'App with slug "' . $data['app']['slug'] . '" already exists',
                'existing_app_id' => $existingApp->id
            ], 409);
        }

        try {
            DB::beginTransaction();

            // Create App
            $app = App::create([
                'name' => $data['app']['name'],
                'slug' => $data['app']['slug'],
                'description' => $data['app']['description'] ?? null,
                'mode' => $data['app']['mode'] ?? 'simple',
                'navigation' => $data['navigation'] ?? [],
                'created_by' => $request->user()->id,
            ]);

            // Create tables
            foreach ($data['tables'] as $slug => $tableData) {
                $table = $app->tables()->create([
                    'slug' => $slug,
                    'name' => $tableData['name'],
                    'description' => $tableData['description'] ?? null,
                    'source_type' => $tableData['source_type'] ?? 'internal',
                    'source_config' => $tableData['source_config'] ?? [],
                ]);

                // Create initial version
                $table->versions()->create([
                    'version' => 1,
                    'fields' => $tableData['fields'] ?? [],
                    'layout' => [
                        'type' => 'standard',
                        'settings' => $tableData['settings'] ?? [],
                        'views' => [],
                    ],
                ]);

                $table->update(['current_version' => 1]);
            }

            // Refresh and create views
            $app->load('tables');

            foreach ($data['views'] ?? [] as $viewKey => $viewData) {
                $table = $app->tables->firstWhere('slug', $viewData['table']);
                if (!$table) continue;

                $app->views()->create([
                    'table_id' => $table->id,
                    'name' => $viewData['name'] ?? $viewKey,
                    'type' => $viewData['type'] ?? 'deck',
                    'description' => $viewData['description'] ?? null,
                    'config' => $viewData['config'] ?? [],
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'App imported successfully',
                'app' => $app->fresh(['tables.latestVersion', 'views'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to import schema',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
