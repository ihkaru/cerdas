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
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:102400', // 100MB max
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
     * Upload chunk for temporary storage and assemble when complete
     */
    public function uploadChunk(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file',
            'chunk_index' => 'required|integer',
            'total_chunks' => 'required|integer',
            'uuid' => 'required|string',
            'filename' => 'required|string',
        ]);

        $file = $request->file('file');
        $chunkIndex = (int) $request->chunk_index;
        $totalChunks = (int) $request->total_chunks;
        $uuid = $request->uuid;
        $filename = $request->filename;

        // Ensure temporary folder exists
        $tempPath = storage_path("app/chunks/{$uuid}");
        if (!file_exists($tempPath)) {
            mkdir($tempPath, 0755, true);
        }

        // Save chunk
        $file->move($tempPath, "chunk_{$chunkIndex}");

        // Check if all chunks are uploaded
        $uploadedChunks = count(glob("{$tempPath}/chunk_*"));
        if ($uploadedChunks === $totalChunks) {
            // Assemble file
            $extension = pathinfo($filename, PATHINFO_EXTENSION);
            $finalFilename = Str::uuid()->toString() . '.' . $extension;
            $finalPath = "imports/{$finalFilename}";
            $destFile = Storage::path($finalPath);
            
            // Ensure imports directory exists
            $destDir = dirname($destFile);
            if (!file_exists($destDir)) {
                mkdir($destDir, 0755, true);
            }

            $out = fopen($destFile, 'wb');
            if ($out === false) {
                return response()->json(['error' => 'Failed to create final file'], 500);
            }

            for ($i = 0; $i < $totalChunks; $i++) {
                $chunkFile = "{$tempPath}/chunk_{$i}";
                if (!file_exists($chunkFile)) {
                    fclose($out);
                    return response()->json(['error' => "Missing chunk: {$i}"], 400);
                }
                
                $in = fopen($chunkFile, 'rb');
                if ($in === false) {
                    fclose($out);
                    return response()->json(['error' => "Failed to read chunk: {$i}"], 500);
                }

                while ($buff = fread($in, 4096)) {
                    fwrite($out, $buff);
                }
                fclose($in);
                unlink($chunkFile); // Remove chunk after writing
            }
            fclose($out);
            
            // Clean up directory
            rmdir($tempPath);

            return response()->json([
                'message' => 'File uploaded and assembled successfully',
                'file_path' => $finalPath,
                'original_name' => $filename,
            ]);
        }

        return response()->json([
            'message' => 'Chunk uploaded successfully',
            'chunk_index' => $chunkIndex,
            'progress' => round((($chunkIndex + 1) / $totalChunks) * 100, 2),
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

        if (!file_exists($filePath)) {
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
                if (!$request->sheet && !$targetSheet) {
                    $targetSheet = $sheet; // Default to first
                }
            }

            if (!$targetSheet) {
                return response()->json(['error' => 'Sheet not found'], 404);
            }

            // Read first 25 rows for preview and accurate type inference
            $rows = [];
            $rowCount = 0;
            foreach ($targetSheet->getRowIterator() as $row) {
                if ($rowCount >= 25) {
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
                $headerStr = trim((string)$header);
                $sampleValues = array_column($previewData, $index);
                $inferenceResult = $this->inferColumnType($headerStr, $sampleValues);

                $columns[] = [
                    'name' => Str::slug($headerStr, '_') ?: 'col_'.$index,
                    'label' => $headerStr,
                    'original_header' => $headerStr, // Frontend matches this
                    'type' => $inferenceResult['type'],
                    'options' => $inferenceResult['options'] ?? [],
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
     * Infer column type and optional categorical options based on header and sample values
     */
    private function inferColumnType(string $header, array $sampleValues): array
    {
        $h = strtolower(trim($header));

        // Filter non-empty trimmed values
        $nonEmpty = [];
        foreach ($sampleValues as $v) {
            if ($v !== null) {
                $str = trim((string)$v);
                if ($str !== '') {
                    $nonEmpty[] = $str;
                }
            }
        }

        // 1. Text Protection for Codes, IDs, NIK, Phone, Zip (Prevent Loss of Leading Zeros / Text IDs)
        if (preg_match('/(^|_)(nik|nokk|no_kk|kk|ktp|id_|kode_|kd_|rt|rw|telepon|telp|hp|wa|phone|postal|kodepos|nip|nisn)($|_)/i', $h)) {
            return ['type' => 'text'];
        }

        // 2. Keyword check for GPS coordinates
        if (preg_match('/(^|_)(gps|koordinat|coordinate|lat_long|latlong|lat_lng|titik_lokasi)($|_)/i', $h)) {
            return ['type' => 'gps'];
        }

        // 3. Keyword check for Image / Photo
        if (preg_match('/(^|_)(foto|photo|gambar|image|lampiran|file_ktp|file_kk)($|_)/i', $h)) {
            return ['type' => 'image'];
        }

        // 4. Keyword check for Signature
        if (preg_match('/(^|_)(ttd|signature|paraf|tanda_tangan)($|_)/i', $h)) {
            return ['type' => 'signature'];
        }

        // 5. Keyword check for URL / Link
        if (preg_match('/(^|_)(url|link|tautan|website|web)($|_)/i', $h)) {
            return ['type' => 'url'];
        }

        // 6. If no sample values are available, use header hints or default to 'text'
        if (empty($nonEmpty)) {
            if (preg_match('/(^|_)(tgl|tanggal|date|tgl_lahir|birth_date)($|_)/i', $h)) {
                return ['type' => 'date'];
            }
            if (preg_match('/(^|_)(jam|pukul|time)($|_)/i', $h)) {
                return ['type' => 'time'];
            }
            if (preg_match('/(^|_)(nominal|jumlah|total|harga|biaya|pengeluaran|pendapatan|gaji|omset|target|kuota|usia|umur|skor|nilai|bobot|luas|volume|berat|tinggi)($|_)/i', $h)) {
                return ['type' => 'number'];
            }
            return ['type' => 'text'];
        }

        // 7. Value Pattern Analysis on Non-Empty Values

        // 7a. Check GPS coordinates pattern (e.g. "-0.4791, 108.9585" or "-0.4791,108.9585")
        $isGps = true;
        foreach ($nonEmpty as $val) {
            if (!preg_match('/^-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+$/', $val)) {
                $isGps = false;
                break;
            }
        }
        if ($isGps) {
            return ['type' => 'gps'];
        }

        // 7b. Check URL pattern
        $isUrl = true;
        foreach ($nonEmpty as $val) {
            if (!filter_var($val, FILTER_VALIDATE_URL) && !preg_match('/^https?:\/\//i', $val)) {
                $isUrl = false;
                break;
            }
        }
        if ($isUrl) {
            return ['type' => 'url'];
        }

        // 7c. Check Image filename pattern
        $isImage = true;
        foreach ($nonEmpty as $val) {
            if (!preg_match('/\.(jpg|jpeg|png|webp|gif|svg)$/i', $val)) {
                $isImage = false;
                break;
            }
        }
        if ($isImage) {
            return ['type' => 'image'];
        }

        // 7d. Check Time pattern (HH:MM or HH:MM:SS)
        $isTime = true;
        foreach ($nonEmpty as $val) {
            if (!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/', $val)) {
                $isTime = false;
                break;
            }
        }
        if ($isTime) {
            return ['type' => 'time'];
        }

        // 7e. Check Date / DateTime pattern
        $isDate = true;
        $isDateTime = false;
        foreach ($nonEmpty as $val) {
            $isIsoDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', $val);
            $isIsoDateTime = preg_match('/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?/', $val);
            $isDmy = preg_match('/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/', $val);

            if ($isIsoDateTime) {
                $isDateTime = true;
            } elseif ($isIsoDate || $isDmy) {
                // ok date
            } else {
                $isDate = false;
                break;
            }
        }
        if ($isDate) {
            return ['type' => $isDateTime ? 'datetime' : 'date'];
        }

        // 7f. Check Numeric (Numbers without leading zeros, or clean decimals)
        $isNumeric = true;
        foreach ($nonEmpty as $val) {
            // Check if purely numeric
            if (!is_numeric($val)) {
                $isNumeric = false;
                break;
            }
            // Check for leading zero like "01", "08123" (which indicates code/string, except "0" or "0.5")
            if (preg_match('/^0\d+/', $val)) {
                $isNumeric = false;
                break;
            }
        }
        if ($isNumeric) {
            return ['type' => 'number'];
        }

        // 7g. Check Categorical Choices (Options like "1. Ya", "2. Tidak", or survey codes)
        $uniqueValues = array_values(array_unique($nonEmpty));
        $hasNumberedPrefix = false;
        foreach ($uniqueValues as $uv) {
            if (preg_match('/^\d+[\.\-\)]\s*.+/', $uv)) {
                $hasNumberedPrefix = true;
                break;
            }
        }

        if ($hasNumberedPrefix && count($uniqueValues) <= 15) {
            $options = array_map(fn($v) => ['label' => $v, 'value' => $v], $uniqueValues);
            return ['type' => 'select', 'options' => $options];
        }

        // 8. Default to text
        return ['type' => 'text'];
    }

    /**
     * Dispatch Import Job
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file_path' => 'required|string',
            'table_name' => 'required|string',
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
            // Map columns to schema definition with full field type support
            $schema = [];
            foreach ($request->columns as $col) {
                $fieldDef = [
                    'name' => $col['name'],
                    'type' => $col['type'] ?? 'text',
                    'label' => $col['label'] ?? $col['original_header'] ?? $col['name'],
                ];
                if (!empty($col['options']) && in_array($col['type'], ['select', 'radio', 'checkbox'])) {
                    $fieldDef['options'] = $col['options'];
                }
                $schema[] = $fieldDef;
            }

            $version = $table->versions()->create([
                'id' => Str::uuid()->toString(),
                'version' => 1,
                'fields' => $schema,
                'layout' => null, // Set to null to trigger smart defaults in frontend
                'published_at' => null,
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

        if (!$status) {
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
