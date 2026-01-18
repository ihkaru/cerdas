<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSchemaVersion;
use App\Models\Field;
use App\Models\FieldOption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FieldController extends Controller {
    /**
     * List all fields for a schema version
     */
    public function index(Request $request): JsonResponse {
        $request->validate([
            'schema_version_id' => 'required|exists:app_schema_versions,id',
        ]);

        $schemaVersion = AppSchemaVersion::with(['appSchema'])->find($request->schema_version_id);
        $user = $request->user();

        if (!$user->hasProjectAccess($schemaVersion->appSchema->project_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $fields = $schemaVersion->rootFields()
            ->with(['options', 'childFields.options'])
            ->get()
            ->map->toClientFormat();

        return response()->json([
            'success' => true,
            'data' => $fields,
        ]);
    }

    /**
     * Create a new field
     */
    public function store(Request $request): JsonResponse {
        $validated = $request->validate([
            'schema_version_id' => 'required|exists:app_schema_versions,id',
            'parent_field_id' => 'nullable|exists:fields,id',
            'name' => 'required|string|max:100|regex:/^[a-z][a-z0-9_]*$/',
            'label' => 'required|string|max:255',
            'type' => 'required|in:' . implode(',', Field::TYPES),
            'config' => 'nullable|array',
            'default_value' => 'nullable',
            'is_required' => 'boolean',
            'is_readonly' => 'boolean',
            'is_hidden' => 'boolean',
            'validation_js' => 'nullable|string',
            'show_if_js' => 'nullable|string',
            'editable_if_js' => 'nullable|string',
            'computed_js' => 'nullable|string',
            'order' => 'nullable|integer',
            'group' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'placeholder' => 'nullable|string|max:255',
            'options' => 'nullable|array', // For select/radio/checkbox
            'options.*.value' => 'required_with:options|string',
            'options.*.label' => 'required_with:options|string',
        ]);

        $schemaVersion = AppSchemaVersion::with('appSchema')->find($validated['schema_version_id']);
        $user = $request->user();

        if (!$user->hasProjectAccess($schemaVersion->appSchema->project_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        if ($schemaVersion->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify a published version',
            ], 400);
        }

        // Check unique name within schema version
        $exists = Field::where('app_schema_version_id', $schemaVersion->id)
            ->where('name', $validated['name'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Field name already exists in this schema version',
            ], 422);
        }

        // Set order if not provided
        if (!isset($validated['order'])) {
            $maxOrder = Field::where('app_schema_version_id', $schemaVersion->id)
                ->where('parent_field_id', $validated['parent_field_id'] ?? null)
                ->max('order');
            $validated['order'] = ($maxOrder ?? 0) + 1;
        }

        $field = Field::create([
            'app_schema_version_id' => $schemaVersion->id,
            'parent_field_id' => $validated['parent_field_id'] ?? null,
            'name' => $validated['name'],
            'label' => $validated['label'],
            'type' => $validated['type'],
            'config' => $validated['config'] ?? null,
            'default_value' => $validated['default_value'] ?? null,
            'is_required' => $validated['is_required'] ?? false,
            'is_readonly' => $validated['is_readonly'] ?? false,
            'is_hidden' => $validated['is_hidden'] ?? false,
            'validation_js' => $validated['validation_js'] ?? null,
            'show_if_js' => $validated['show_if_js'] ?? null,
            'editable_if_js' => $validated['editable_if_js'] ?? null,
            'computed_js' => $validated['computed_js'] ?? null,
            'order' => $validated['order'],
            'group' => $validated['group'] ?? null,
            'description' => $validated['description'] ?? null,
            'placeholder' => $validated['placeholder'] ?? null,
        ]);

        // Create options if provided
        if (!empty($validated['options'])) {
            foreach ($validated['options'] as $index => $opt) {
                $field->options()->create([
                    'value' => $opt['value'],
                    'label' => $opt['label'],
                    'order' => $index,
                    'show_if_js' => $opt['show_if_js'] ?? null,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $field->load('options')->toClientFormat(),
            'message' => 'Field created successfully',
        ], 201);
    }

    /**
     * Get a specific field
     */
    public function show(Request $request, Field $field): JsonResponse {
        $user = $request->user();
        $schemaVersion = $field->schemaVersion->load('appSchema');

        if (!$user->hasProjectAccess($schemaVersion->appSchema->project_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $field->load(['options', 'childFields.options'])->toClientFormat(),
        ]);
    }

    /**
     * Update a field
     */
    public function update(Request $request, Field $field): JsonResponse {
        $user = $request->user();
        $schemaVersion = $field->schemaVersion->load('appSchema');

        if (!$user->hasProjectAccess($schemaVersion->appSchema->project_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        if ($schemaVersion->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify a published version',
            ], 400);
        }

        $validated = $request->validate([
            'label' => 'sometimes|string|max:255',
            'config' => 'nullable|array',
            'default_value' => 'nullable',
            'is_required' => 'boolean',
            'is_readonly' => 'boolean',
            'is_hidden' => 'boolean',
            'validation_js' => 'nullable|string',
            'show_if_js' => 'nullable|string',
            'editable_if_js' => 'nullable|string',
            'computed_js' => 'nullable|string',
            'order' => 'nullable|integer',
            'group' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'placeholder' => 'nullable|string|max:255',
        ]);

        $field->update($validated);

        return response()->json([
            'success' => true,
            'data' => $field->fresh()->load('options')->toClientFormat(),
            'message' => 'Field updated successfully',
        ]);
    }

    /**
     * Delete a field
     */
    public function destroy(Request $request, Field $field): JsonResponse {
        $user = $request->user();
        $schemaVersion = $field->schemaVersion->load('appSchema');

        if (!$user->hasProjectAccess($schemaVersion->appSchema->project_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        if ($schemaVersion->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify a published version',
            ], 400);
        }

        $field->delete();

        return response()->json([
            'success' => true,
            'message' => 'Field deleted successfully',
        ]);
    }

    /**
     * Reorder fields
     */
    public function reorder(Request $request): JsonResponse {
        $validated = $request->validate([
            'schema_version_id' => 'required|exists:app_schema_versions,id',
            'field_orders' => 'required|array',
            'field_orders.*.id' => 'required|exists:fields,id',
            'field_orders.*.order' => 'required|integer',
        ]);

        $schemaVersion = AppSchemaVersion::with('appSchema')->find($validated['schema_version_id']);
        $user = $request->user();

        if (!$user->hasProjectAccess($schemaVersion->appSchema->project_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        if ($schemaVersion->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify a published version',
            ], 400);
        }

        foreach ($validated['field_orders'] as $fieldOrder) {
            Field::where('id', $fieldOrder['id'])
                ->where('app_schema_version_id', $schemaVersion->id)
                ->update(['order' => $fieldOrder['order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Fields reordered successfully',
        ]);
    }
}
