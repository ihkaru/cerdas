<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Table;
use App\Models\App;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use \PhpOffice\PhpSpreadsheet\IOFactory;

class ExcelImportController extends Controller {
    /**
     * Upload Excel file and return available sheets
     */
    public function upload(Request $request): JsonResponse {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
        ]);

        try {
            $path = $request->file('file')->store('temp-imports');
            $fullPath = Storage::path($path);

            // Use PhpSpreadsheet directly to list sheets
            $reader = IOFactory::createReaderForFile($fullPath);
            $sheetNames = $reader->listWorksheetNames($fullPath);

            return response()->json([
                'file_path' => $path,
                'sheets' => array_values($sheetNames)
            ]);
        } catch (\Exception $e) {
            Log::error('Excel Upload Failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to process file: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Preview columns and infer types from a specific sheet
     */
    public function preview(Request $request): JsonResponse {
        $request->validate([
            'file_path' => 'required|string',
            'sheet' => 'nullable|string',
        ]);

        $path = $request->input('file_path');
        $sheetName = $request->input('sheet');
        $fullPath = Storage::path($path);

        if (!Storage::exists($path)) {
            return response()->json(['error' => 'File expired or not found'], 404);
        }

        try {
            // Get sheet index mapping
            $reader = IOFactory::createReaderForFile($fullPath);
            $sheetNames = $reader->listWorksheetNames($fullPath);

            $sheetIndex = 0;
            foreach ($sheetNames as $idx => $name) {
                if ($name === $sheetName) {
                    $sheetIndex = $idx;
                    break;
                }
            }

            // Read data
            $sheets = Excel::toArray(new \stdClass(), $path);
            $rows = $sheets[$sheetIndex] ?? [];

            if (empty($rows)) {
                return response()->json(['error' => 'Sheet is empty or not found'], 400);
            }

            // Extract headers (first row)
            $headers = array_map('strval', $rows[0]);
            array_shift($rows); // Remove header row

            // Infer Schema
            $columns = [];
            $previewRows = array_slice($rows, 0, 5);
            $previewData = [];

            // Format preview data as objects
            foreach ($previewRows as $row) {
                $item = [];
                foreach ($headers as $i => $h) {
                    $item[Str::slug($h, '_')] = $row[$i] ?? null;
                }
                $previewData[] = $item;
            }

            foreach ($headers as $index => $header) {
                if ($header === '') continue;

                $slug = Str::slug($header, '_');
                $type = 'text';
                $sampleValues = array_column(array_slice($rows, 0, 50), $index);

                $isNumeric = true;
                $hasData = false;

                foreach ($sampleValues as $val) {
                    if (is_null($val) || $val === '') continue;
                    $hasData = true;
                    if (!is_numeric($val)) $isNumeric = false;
                }

                if ($hasData && $isNumeric) {
                    $type = 'number';
                }

                $columns[] = [
                    'original_header' => $header,
                    'source_index' => $index,
                    'name' => $slug,
                    'type' => $type,
                    'is_primary' => in_array(strtolower($slug), ['id', 'uuid', 'code', 'no']),
                ];
            }

            return response()->json([
                'columns' => $columns,
                'preview' => $previewData,
                'total_rows' => count($rows)
            ]);
        } catch (\Exception $e) {
            Log::error('Preview Failed: ' . $e->getMessage());
            return response()->json(['error' => 'Preview failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create table and import data
     */
    public function import(Request $request): JsonResponse {
        $request->validate([
            'app_id' => 'required|exists:apps,id',
            'table_name' => 'required|string',
            'file_path' => 'required|string',
            'sheet' => 'nullable|string',
            'columns' => 'required|array',
        ]);

        $app = App::findOrFail($request->app_id);
        $path = $request->file_path;
        $baseSlug = Str::slug($request->table_name, '_');
        $tableName = $baseSlug;
        $counter = 1;

        while ($app->tables()->withTrashed()->where('slug', $tableName)->exists()) {
            $tableName = $baseSlug . '_' . $counter++;
        }

        $columns = $request->columns;
        $fullPath = Storage::path($path);

        if (!Storage::exists($path)) {
            return response()->json(['error' => 'File expired'], 404);
        }

        DB::beginTransaction();
        try {
            // 1. Create App Schema Definition
            $fields = [];
            foreach ($columns as $col) {
                $fields[] = [
                    'id' => Str::uuid()->toString(),
                    'name' => $col['name'],
                    'label' => Str::title(str_replace('_', ' ', $col['name'])),
                    'type' => $col['type'],
                    'required' => false,
                    'meta' => ['source_index' => $col['source_index'] ?? -1]
                ];
            }

            $newTable = $app->tables()->create([
                'name' => $request->table_name,
                'slug' => $tableName,
                'source_type' => 'internal',
                'source_config' => ['imported_from' => $path]
            ]);

            $newTable->versions()->create([
                'version' => 1,
                'fields' => $fields,
                'published_at' => now()
            ]);

            // 2. Import Data (Stored in AppRecord AND Assignments)
            $sheets = Excel::toArray(new \stdClass(), $path);
            $reader = IOFactory::createReaderForFile($fullPath);
            $sheetNames = $reader->listWorksheetNames($fullPath);

            $sheetIndex = 0;
            if ($request->sheet) {
                foreach ($sheetNames as $idx => $name) {
                    if ($name === $request->sheet) {
                        $sheetIndex = $idx;
                        break;
                    }
                }
            }

            $rows = $sheets[$sheetIndex] ?? [];
            if (!empty($rows)) array_shift($rows); // Skip header

            // Determine Organization ID (Use first found or null)
            // Ideally we check user membership or app default
            $defaultOrgId = $app->organizations()->first()?->id;

            $insertRecords = [];
            $insertAssignments = [];

            $now = now();
            // Get the ID of the version we just created
            // We need to fetch it because create() returns model but we want ID for bulk insert
            // Actually create() returns the model instance with ID if standard Eloquent create is used.
            // But earlier code: $newTable->versions()->create(...) returns instance.
            // The issue is we didn't capture the version instance in a variable in previous code block.
            // Let's look at Lines 193-196 of original file to capture it.
            // Wait, I cannot see lines 193-196 in this replacement block.
            // I need to start replacement earlier to capture version ID.

            // Re-fetching latest version to be safe or assuming version 1 is specific enough?
            // Actually, I should probably just fetch it:
            $versionModel = $newTable->versions()->latest('version')->first();
            $versionId = $versionModel->id;

            // Smart Mapping Logic - Identify Name/Address Columns
            $nameField = null;
            $addressField = null;

            foreach ($columns as $col) {
                $slug = $col['name'];
                // Check name candidates
                if (!$nameField && in_array($slug, ['name', 'nama', 'title', 'judul', 'customer_name', 'nama_pelanggan', 'full_name', 'nama_lengkap'])) {
                    $nameField = $slug;
                }
                // Check address candidates
                if (!$addressField && in_array($slug, ['address', 'alamat', 'location', 'lokasi', 'alamat_lengkap', 'full_address', 'kabupaten', 'kota'])) {
                    $addressField = $slug;
                }
            }

            foreach ($rows as $row) {
                $recordData = [];
                // Map columns to data keys
                foreach ($columns as $col) {
                    $idx = $col['source_index'] ?? -1;
                    $value = null;

                    if ($idx >= 0 && isset($row[$idx])) {
                        if ($col['type'] == 'date' && is_numeric($row[$idx])) {
                            try {
                                $value = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row[$idx]);
                            } catch (\Exception $e) {
                                $value = null;
                            }
                        } else {
                            $value = $row[$idx];
                        }
                    }
                    $recordData[$col['name']] = $value;
                }

                // Inject aliases for Default View if not present
                if ($nameField && !isset($recordData['name'])) {
                    $recordData['name'] = $recordData[$nameField];
                }
                if ($addressField && !isset($recordData['address'])) {
                    $recordData['address'] = $recordData[$addressField];
                }

                $recordId = Str::uuid()->toString();
                $jsonData = json_encode($recordData);

                // Prepare AppRecord structure
                $insertRecords[] = [
                    'id' => $recordId,
                    'app_id' => $app->id,
                    'table_id' => $newTable->id,
                    'data' => $jsonData,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                // Prepare Assignment structure
                $insertAssignments[] = [
                    'id' => Str::uuid()->toString(),
                    'table_id' => $newTable->id,
                    'table_version_id' => $versionId,
                    'organization_id' => $defaultOrgId,
                    'supervisor_id' => null, // Unassigned
                    'enumerator_id' => null, // Unassigned
                    'external_id' => $recordId, // Link to Record
                    'status' => 'assigned',
                    'prelist_data' => $jsonData, // Same data as record
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if (count($insertRecords) >= 200) {
                    \App\Models\AppRecord::insert($insertRecords);
                    \App\Models\Assignment::insert($insertAssignments);
                    $insertRecords = [];
                    $insertAssignments = [];
                }
            }

            if (!empty($insertRecords)) {
                \App\Models\AppRecord::insert($insertRecords);
                \App\Models\Assignment::insert($insertAssignments);
            }

            DB::commit();
            Storage::delete($path);

            return response()->json(['success' => true, 'table_id' => $newTable->id]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Import Failed: ' . $e->getMessage());
            return response()->json(['error' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }
}
