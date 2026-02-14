<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Response;
use App\Models\Table;
use App\Models\TableVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ExportController — Schema-Aware Response Export
 *
 * Filters response JSON data through the field definitions of a specific
 * schema version, ensuring ghost data (from removed fields) is excluded
 * and only fields defined in the requested version are exported.
 */
class ExportController extends Controller {
    /**
     * Export responses for a table, filtered through a specific schema version.
     *
     * GET /api/tables/{table}/export?version={version}
     */
    public function export(Request $request, Table $table): JsonResponse {

        // Determine which version to filter by
        $requestedVersion = $request->input('version', $table->current_version);

        // Load the schema for the requested version
        $tableVersion = TableVersion::where('table_id', $table->id)
            ->where('version', $requestedVersion)
            ->published()
            ->first();

        if (! $tableVersion) {
            return response()->json([
                'success' => false,
                'message' => "Schema version {$requestedVersion} not found for this table.",
            ], 404);
        }

        // Extract field names from schema
        $fields = $tableVersion->getFields();
        $fieldNames = collect($fields)->pluck('name')->filter()->toArray();

        // Load responses
        $responses = Response::whereHas('assignment', function ($q) use ($table) {
            $q->where('table_id', $table->id);
        })->get();

        // Filter each response's data through the schema fields
        $exportData = $responses->map(function ($response) use ($fieldNames, $requestedVersion) {
            $rawData = is_string($response->data) ? json_decode($response->data, true) : ($response->data ?? []);

            // Only include keys that exist in the requested schema version
            $filteredData = array_intersect_key($rawData, array_flip($fieldNames));

            return [
                'id' => $response->id,
                'assignment_id' => $response->assignment_id,
                'submitted_version' => $response->submitted_version,
                'data' => $filteredData,
                'created_at' => $response->created_at,
                'updated_at' => $response->updated_at,
            ];
        });

        return response()->json([
            'success' => true,
            'meta' => [
                'table_id' => $table->id,
                'table_name' => $table->name,
                'schema_version' => (int) $requestedVersion,
                'field_count' => count($fieldNames),
                'fields' => $fieldNames,
                'total_responses' => $exportData->count(),
            ],
            'data' => $exportData->values(),
        ]);
    }
}
