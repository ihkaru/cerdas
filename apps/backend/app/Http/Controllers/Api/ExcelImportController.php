<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ImportExcelJob;
use App\Models\App;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExcelImportController extends Controller
{
    /**
     * Upload file for temporary storage
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:65536', // 64MB max
        ]);

        $file = $request->file('file');
        $path = $file->store('imports'); // Store in storage/app/imports

        return response()->json([
            'message' => 'File uploaded successfully',
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
        ]);
    }

    /**
     * Preview columns and infer types from a specific sheet
     */
    public function preview(Request $request): JsonResponse
    {
        // Increase limits for preview memory if needed
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        $request->validate([
            'file_path' => 'required|string',
            'sheet' => 'nullable|string',
        ]);

        $filePath = Storage::path($request->file_path);

        if (! file_exists($filePath)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        try {
            $extension = pathinfo($filePath, PATHINFO_EXTENSION);
            $reader = $this->getReader($extension);
            $reader->open($filePath);

            $sheetIterator = $reader->getSheetIterator();
            $targetSheet = null;
            $sheetNames = [];

            // Get all sheet names and find target
            foreach ($sheetIterator as $sheet) {
                $sheetNames[] = $sheet->getName();
                if ($request->sheet && $sheet->getName() === $request->sheet) {
                    $targetSheet = $sheet;
                }
                if (! $request->sheet && ! $targetSheet) {
                    $targetSheet = $sheet; // Default to first
                }
            }

            if (! $targetSheet) {
                return response()->json(['error' => 'Sheet not found'], 404);
            }

            // Read first 5 rows for preview
            $rows = [];
            $rowCount = 0;
            foreach ($targetSheet->getRowIterator() as $row) {
                if ($rowCount >= 5) {
                    break;
                }

                $cells = $row->cells;
                $rowData = [];
                foreach ($cells as $cell) {
                    $val = $cell->getValue();
                    if ($val instanceof \DateTime) {
                        $val = $val->format('Y-m-d H:i:s');
                    }
                    $rowData[] = $val;
                }
                $rows[] = $rowData;
                $rowCount++;
            }

            $reader->close();

            // Infer columns
            $headers = $rows[0] ?? [];
            $previewData = array_slice($rows, 1);
            $columns = [];

            foreach ($headers as $index => $header) {
                $sampleValues = array_column($previewData, $index);
                $inferredType = 'text'; // Default

                // Simple inference logic
                $isNumeric = true;
                foreach ($sampleValues as $val) {
                    if (! is_numeric($val) && $val !== null && $val !== '') {
                        $isNumeric = false;
                        break;
                    }
                }
                if ($isNumeric && count($sampleValues) > 0) {
                    $inferredType = 'number';
                }

                $columns[] = [
                    'name' => Str::slug($header, '_'),
                    'label' => $header,
                    'original_header' => $header, // Frontend matches this
                    'type' => $inferredType,
                    'source_index' => $index,
                ];
            }

            return response()->json([
                'sheets' => $sheetNames,
                'columns' => $columns,
                'preview' => $previewData,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Dispatch Import Job
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file_path' => 'required|string',
            'table_name' => 'required|string', // Changed from table_id
            'app_id' => 'required|uuid',
            'columns' => 'required|array',
            'sheet' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // 1. Generate Unique Slug
            $slug = Str::slug($request->table_name);
            $originalSlug = $slug;
            $count = 1;
            while (Table::withTrashed()->where('app_id', $request->app_id)->where('slug', $slug)->exists()) {
                $slug = "{$originalSlug}-{$count}";
                $count++;
            }

            // 2. Create Table
            $table = Table::create([
                'id' => Str::uuid()->toString(),
                'app_id' => $request->app_id,
                'name' => $request->table_name.($count > 1 ? " ({$count})" : ''),
                'slug' => $slug,
            ]);

            // 2. Create Initial Version
            // Map columns to schema definition
            $schema = [];
            foreach ($request->columns as $col) {
                $schema[] = [
                    'name' => $col['name'],
                    'type' => $col['type'],
                    'label' => $col['label'] ?? $col['name'],
                ];
            }

            $version = $table->versions()->create([
                'id' => Str::uuid()->toString(),
                'version' => 1,
                'fields' => $schema,
                'layout' => null, // Set to null to trigger smart defaults in frontend
                'published_at' => now(),
            ]);

            DB::commit();

            $jobId = Str::uuid()->toString();
            $authUserId = '543d2fc6-2e02-4fc3-a7a7-5b51808282da'; // Hardcoded for now

            ImportExcelJob::dispatch(
                $request->file_path,
                $table->id, // Pass the newly created table ID
                $request->app_id,
                $request->columns,
                $request->sheet,
                $jobId,
                $authUserId
            );

            // Init status in cache
            Cache::put("import_job_{$jobId}", [
                'status' => 'queued',
                'rows_processed' => 0,
                'message' => 'Job queued...',
                'updated_at' => now()->timestamp,
            ], 3600);

            return response()->json([
                'message' => 'Import started in background',
                'job_id' => $jobId,
                'table_id' => $table->id, // Return table_id so frontend knows where to go
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Import Failed: '.$e->getMessage()."\n".$e->getTraceAsString());

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Check Import Status
     */
    public function checkStatus($jobId): JsonResponse
    {
        $status = Cache::get("import_job_{$jobId}");

        if (! $status) {
            return response()->json(['status' => 'not_found'], 404);
        }

        return response()->json($status);
    }

    protected function getReader($extension)
    {

        switch (strtolower($extension)) {
            case 'xlsx':
                return new \OpenSpout\Reader\XLSX\Reader;
            case 'csv':
                return new \OpenSpout\Reader\CSV\Reader;
            case 'ods':
                return new \OpenSpout\Reader\ODS\Reader;
            default:
                throw new \Exception("Unsupported file type: $extension");
        }
    }
}
