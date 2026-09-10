<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Jobs\GoogleSheetReconcileHeadersJob;
use App\Models\App;
use App\Models\Table;
use App\Models\TableVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AgentSchemaController extends Controller
{
    /**
     * Inspect a table's schema, published fields, draft fields, and all logic closures.
     *
     * GET /api/agent/v1/apps/{app}/tables/{table}
     */
    public function showTable(Request $request, string $appId, string $tableId): JsonResponse
    {
        $app = App::withTrashed()->where('id', $appId)->orWhere('slug', $appId)->firstOrFail();

        $table = Table::withTrashed()
            ->where('app_id', $app->id)
            ->where(function ($q) use ($tableId) {
                $q->where('id', $tableId)->orWhere('slug', $tableId);
            })
            ->firstOrFail();

        $publishedVersion = TableVersion::where('table_id', $table->id)
            ->whereNotNull('published_at')
            ->orderByDesc('version')
            ->first();

        $draftVersion = TableVersion::where('table_id', $table->id)
            ->whereNull('published_at')
            ->orderByDesc('version')
            ->first();

        // Extract closures overview for agent rapid diagnosis
        $activeFields = $draftVersion?->fields ?? $publishedVersion?->fields ?? [];
        $closuresReport = [];

        foreach ($activeFields as $field) {
            $key = $field['key'] ?? $field['name'] ?? 'unknown';
            $closures = [];

            foreach ([
                'formula_fn',
                'validation_js',
                'warning_fn',
                'show_if_fn',
                'editable_if_fn',
                'required_if_fn',
                'options_fn',
                'initial_value_fn',
            ] as $closureProp) {
                if (! empty($field[$closureProp])) {
                    $closures[$closureProp] = $field[$closureProp];
                }
            }

            if (! empty($closures)) {
                $closuresReport[] = [
                    'field_key' => $key,
                    'field_name' => $field['name'] ?? $key,
                    'field_type' => $field['type'] ?? 'unknown',
                    'closures' => $closures,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'table' => [
                    'id' => $table->id,
                    'name' => $table->name,
                    'slug' => $table->slug,
                    'description' => $table->description,
                    'current_version' => $table->current_version,
                    'source_type' => $table->source_type,
                    'source_config' => $table->source_config,
                    'published_at' => $table->published_at?->toIso8601String(),
                ],
                'closures_summary' => $closuresReport,
                'published_version' => $publishedVersion ? [
                    'id' => $publishedVersion->id,
                    'version' => $publishedVersion->version,
                    'fields_count' => count($publishedVersion->fields ?? []),
                    'fields' => $publishedVersion->fields,
                    'layout' => $publishedVersion->layout,
                    'changelog' => $publishedVersion->changelog,
                    'published_at' => $publishedVersion->published_at?->toIso8601String(),
                ] : null,
                'draft_version' => $draftVersion ? [
                    'id' => $draftVersion->id,
                    'version' => $draftVersion->version,
                    'fields_count' => count($draftVersion->fields ?? []),
                    'fields' => $draftVersion->fields,
                    'layout' => $draftVersion->layout,
                    'created_at' => $draftVersion->created_at?->toIso8601String(),
                ] : null,
            ],
        ]);
    }

    /**
     * Hotfix a specific field definition or closure in the table's draft schema.
     * If no draft exists, auto-forks a new draft from the current version.
     *
     * PATCH /api/agent/v1/apps/{app}/tables/{table}/field
     */
    public function patchField(Request $request, string $appId, string $tableId): JsonResponse
    {
        $app = App::withTrashed()->where('id', $appId)->orWhere('slug', $appId)->firstOrFail();

        $table = Table::withTrashed()
            ->where('app_id', $app->id)
            ->where(function ($q) use ($tableId) {
                $q->where('id', $tableId)->orWhere('slug', $tableId);
            })
            ->firstOrFail();

        $validated = $request->validate([
            'field_key' => 'required|string',
            'patch' => 'required|array',
            'create_if_missing' => 'nullable|boolean',
        ]);

        $fieldKey = $validated['field_key'];
        $patch = $validated['patch'];
        $createIfMissing = (bool) ($validated['create_if_missing'] ?? false);

        // 1. Get or create draft version
        $draft = TableVersion::where('table_id', $table->id)
            ->whereNull('published_at')
            ->orderByDesc('version')
            ->first();

        $isNewDraft = false;
        if (! $draft) {
            $latestVersion = $table->versions()->orderByDesc('version')->first();
            $newVersionNumber = $latestVersion ? $latestVersion->version + 1 : 1;

            $draft = TableVersion::create([
                'table_id' => $table->id,
                'version' => $newVersionNumber,
                'fields' => $latestVersion?->fields ?? [],
                'layout' => $latestVersion?->layout ?? [],
                'changelog' => 'Draft created automatically for Agent hotfix',
            ]);
            $isNewDraft = true;
        }

        // 2. Locate and patch the field
        $fields = $draft->fields ?? [];
        $found = false;
        $patchedField = null;

        foreach ($fields as $idx => $field) {
            $currentKey = $field['key'] ?? $field['name'] ?? null;
            if ($currentKey === $fieldKey) {
                $beforeField = $field;
                // Merge patch into existing field definition
                $fields[$idx] = array_merge($field, $patch);
                // Ensure key/name remains consistent
                $fields[$idx]['key'] = $field['key'] ?? $fieldKey;
                $fields[$idx]['name'] = $field['name'] ?? $fieldKey;
                $patchedField = $fields[$idx];
                $found = true;

                Log::info('[AGENT_MUTATION] Patched existing field in draft schema', [
                    'table_id' => $table->id,
                    'version' => $draft->version,
                    'field_key' => $fieldKey,
                    'before' => $beforeField,
                    'after' => $fields[$idx],
                ]);
                break;
            }
        }

        if (! $found) {
            if ($createIfMissing) {
                $newField = array_merge([
                    'key' => $fieldKey,
                    'name' => $patch['name'] ?? $fieldKey,
                    'type' => $patch['type'] ?? 'text',
                ], $patch);

                $fields[] = $newField;
                $patchedField = $newField;

                Log::info('[AGENT_MUTATION] Created new field in draft schema', [
                    'table_id' => $table->id,
                    'version' => $draft->version,
                    'field_key' => $fieldKey,
                    'field' => $newField,
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => "Field with key '{$fieldKey}' was not found in draft schema. Set create_if_missing: true to add it.",
                ], 404);
            }
        }

        $draft->update(['fields' => $fields]);

        return response()->json([
            'success' => true,
            'message' => 'Field patched successfully in draft schema',
            'is_new_draft' => $isNewDraft,
            'draft_version' => $draft->version,
            'patched_field' => $patchedField,
        ]);
    }

    /**
     * Publish the current draft version to make it live.
     *
     * POST /api/agent/v1/apps/{app}/tables/{table}/publish
     */
    public function publishTable(Request $request, string $appId, string $tableId): JsonResponse
    {
        $app = App::withTrashed()->where('id', $appId)->orWhere('slug', $appId)->firstOrFail();

        $table = Table::withTrashed()
            ->where('app_id', $app->id)
            ->where(function ($q) use ($tableId) {
                $q->where('id', $tableId)->orWhere('slug', $tableId);
            })
            ->firstOrFail();

        $draft = TableVersion::where('table_id', $table->id)
            ->whereNull('published_at')
            ->orderByDesc('version')
            ->first();

        if (! $draft) {
            return response()->json([
                'success' => false,
                'message' => 'No draft version found to publish for this table.',
            ], 400);
        }

        $changelog = $request->input('changelog', 'Published via Agent REST API');
        $versionPolicy = $request->input('version_policy');

        $draft->publish($changelog);

        if ($versionPolicy && in_array($versionPolicy, ['accept_all', 'warn', 'require_update'])) {
            $settings = $table->settings ?? [];
            $settings['version_policy'] = $versionPolicy;
            $table->update(['settings' => $settings]);
        }

        // Auto-reconcile Google Sheet headers if table is connected to Google Sheets
        if ($table->source_type === 'google_sheets') {
            GoogleSheetReconcileHeadersJob::dispatch($table->id, $draft->version);
        }

        Log::info('[AGENT_MUTATION] Published table version', [
            'table_id' => $table->id,
            'version' => $draft->version,
            'changelog' => $changelog,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Table version {$draft->version} published successfully.",
            'table' => $table->fresh(),
            'version' => $draft->fresh(),
        ]);
    }
}
