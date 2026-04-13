<?php

namespace App\Jobs;

use App\Models\App;
use App\Models\Table;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportExcelJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /** Max number of attempts before marking as failed */
    public int $tries = 3;

    /** Max exceptions before marking as failed (regardless of tries) */
    public int $maxExceptions = 2;

    /** Timeout per attempt in seconds */
    public int $timeout = 14400;

    protected $filePath;

    protected $tableId;

    protected $appId;

    protected $columns;

    protected $sheetName;

    protected $jobId;

    protected $userId;

    /**
     * Exponential backoff: wait 10s, 60s, 300s between retries.
     */
    public function backoff(): array
    {
        return [10, 60, 300];
    }

    /**
     * Create a new job instance.
     */
    public function __construct($filePath, $tableId, $appId, $columns, $sheetName, $jobId, $userId)
    {
        $this->filePath = $filePath;
        $this->tableId = $tableId;
        $this->appId = $appId;
        $this->columns = $columns;
        $this->sheetName = $sheetName;
        $this->jobId = $jobId;
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $fullPath = Storage::path($this->filePath);

        try {
            ini_set('memory_limit', '512M');
            set_time_limit(14400); // 4 hours

            $this->updateStatus('processing', 0, 'Reading file...');

            // Determine reader type based on extension
            $extension = pathinfo($fullPath, PATHINFO_EXTENSION);
            $reader = $this->getReader($extension);
            $reader->open($fullPath);

            $sheetIterator = $reader->getSheetIterator();
            $targetSheet = null;

            // Find target sheet
            foreach ($sheetIterator as $sheet) {
                if ($this->sheetName && $sheet->getName() === $this->sheetName) {
                    $targetSheet = $sheet;

                    break;
                }
                // Default to first sheet if not specified
                if (!$this->sheetName) {
                    $targetSheet = $sheet;

                    break;
                }
            }

            if (!$targetSheet) {
                throw new \Exception('Sheet not found: '.($this->sheetName ?? 'First Sheet'));
            }

            // Setup Context
            $app = App::find($this->appId);
            $table = Table::withTrashed()->find($this->tableId);

            if (!$table) {
                // Retry once with a slight delay if it's a propagation issue
                sleep(1);
                $table = Table::withTrashed()->find($this->tableId);
            }

            if (!$table) {
                throw new \Exception("Table not found for import: {$this->tableId}");
            }

            $defaultOrgId = $app->organizations()->first()?->id;
            $versionModel = $table->versions()->latest('version')->first();

            if (!$versionModel) {
                throw new \Exception("Table version not found for import: {$this->tableId}");
            }

            $versionId = $versionModel->id;
            $now = now();

            // Smart Mapping Logic
            $nameField = null;
            $addressField = null;
            foreach ($this->columns as $col) {
                $slug = $col['name'];
                if (!$nameField && in_array($slug, ['name', 'nama', 'title', 'judul', 'customer_name', 'nama_pelanggan', 'full_name', 'nama_lengkap'])) {
                    $nameField = $slug;
                }
                if (!$addressField && in_array($slug, ['address', 'alamat', 'location', 'lokasi', 'alamat_lengkap', 'full_address', 'kabupaten', 'kota'])) {
                    $addressField = $slug;
                }
            }

            $rowCount = 0;
            $insertRecords = [];
            $insertAssignments = [];
            DB::disableQueryLog();
            $batchSize = 200; // Reduced to 200 to prevent "Server Gone Away"
            DB::reconnect(); // Ensure fresh connection before starting

            foreach ($targetSheet->getRowIterator() as $row) {
                // Skip header row (assuming first row is header)
                // OpenSpout row index starts at 1
                if ($rowCount === 0) {
                    $rowCount++;

                    continue;
                }

                $cells = $row->cells;
                $recordData = [];
                $hasData = false;

                foreach ($this->columns as $col) {
                    $idx = $col['source_index'] ?? -1;
                    $value = null;

                    if ($idx >= 0 && isset($cells[$idx])) {
                        $cellReceived = $cells[$idx];
                        $value = $cellReceived->getValue();

                        // Date handling if needed (OpenSpout handles dates relatively well as DateTime objects if configured)
                        if ($value instanceof \DateTime) {
                            $value = $value->format('Y-m-d H:i:s');
                        }

                        if ($value !== null && $value !== '') {
                            $hasData = true;
                        }
                    }
                    $recordData[$col['name']] = $value;
                }

                if (!$hasData) {
                    continue;
                } // Skip empty rows

                // Inject aliases
                if ($nameField && !isset($recordData['name'])) {
                    $recordData['name'] = $recordData[$nameField];
                }
                if ($addressField && !isset($recordData['address'])) {
                    $recordData['address'] = $recordData[$addressField];
                }

                $recordId = Str::orderedUuid()->toString();
                $jsonData = json_encode($recordData);

                $insertRecords[] = [
                    'id' => $recordId,
                    'app_id' => $this->appId,
                    'table_id' => $this->tableId,
                    'data' => $jsonData,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $insertAssignments[] = [
                    'id' => Str::orderedUuid()->toString(),
                    'table_id' => $this->tableId,
                    'table_version_id' => $versionId,
                    'organization_id' => $defaultOrgId,
                    'supervisor_id' => null,
                    'enumerator_id' => null,
                    'external_id' => $recordId,
                    'status' => 'assigned',
                    'prelist_data' => $jsonData,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $rowCount++;

                // Process Batch
                if (count($insertRecords) >= $batchSize) {
                    $this->insertBatchRecursive($insertRecords, $insertAssignments);

                    $insertRecords = [];
                    $insertAssignments = [];

                    // Update Progress
                    $this->updateStatus('processing', $rowCount, "Processed $rowCount rows...");

                    // Force garbage collection
                    gc_collect_cycles();
                }
            }

            // Flush remaining
            if (!empty($insertRecords)) {
                $this->insertBatchRecursive($insertRecords, $insertAssignments);
            }

            $reader->close();
            Storage::delete($this->filePath);

            $this->updateStatus('completed', $rowCount, 'Import finished successfully.');
        } catch (\Exception $e) {
            Log::error('Import Job Failed: '.$e->getMessage());

            // If we have retries left, let the queue handler retry (re-throw).
            // Only update to 'queued_retry' status so the UI can show retrying.
            if ($this->attempts() < $this->tries) {
                $this->updateStatus('queued_retry', 0, 'Retrying... (Attempt '.$this->attempts().' of '.$this->tries.')');
            } else {
                $this->updateStatus('failed', 0, 'Error: '.$e->getMessage());
            }

            throw $e;
        }
    }

    /**
     * Handle a job that has permanently failed (all retries exhausted).
     * Laravel calls this automatically after all tries are consumed.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("ImportExcelJob permanently failed for table {$this->tableId}", [
            'error' => $exception->getMessage(),
            'jobId' => $this->jobId,
        ]);

        // Update cache status so the UI stops polling
        $this->updateStatus('failed', 0, 'Import failed permanently: '.$exception->getMessage());

        // Clean up the uploaded file so it doesn't linger on disk
        if ($this->filePath && Storage::exists($this->filePath)) {
            Storage::delete($this->filePath);
            Log::info("Cleaned up abandoned import file: {$this->filePath}");
        }
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

    protected function updateStatus($status, $rows, $message)
    {
        Cache::put("import_job_{$this->jobId}", [
            'status' => $status,
            'rows_processed' => $rows,
            'message' => $message,
            'updated_at' => now()->timestamp,
        ], 3600); // 1 hour TTL
    }

    /**
     * Insert batch with recursive retry logic.
     * If a batch fails due to connection issues, it splits the batch in half and retries.
     */
    protected function insertBatchRecursive(array $records, array $assignments, $attempt = 1)
    {
        // Ensure fresh connection for impactful operations
        try {
            DB::reconnect();
        } catch (\Exception $e) {
            Log::warning('Failed to force reconnect DB: '.$e->getMessage());
        }

        try {
            DB::transaction(function () use ($records, $assignments) {
                // Bulk insert records
                DB::table('app_records')->insert($records);
                // Bulk insert assignments
                DB::table('assignments')->insert($assignments);
            });
        } catch (\Exception $e) {
            $msg = $e->getMessage();
            $isConnectionError = Str::contains($msg, ['server has gone away', 'Lost connection', '2006', '2013']);

            if ($isConnectionError) {
                $count = count($records);
                Log::warning("Batch insert failed (Row count: $count). Error: $msg");

                if ($count > 1) {
                    // Split and retry
                    $mid = (int) ceil($count / 2);
                    Log::info("Splitting batch of $count into $mid and ".($count - $mid));

                    $recordsChunk1 = array_slice($records, 0, $mid);
                    $recordsChunk2 = array_slice($records, $mid);

                    $assignmentsChunk1 = array_slice($assignments, 0, $mid);
                    $assignmentsChunk2 = array_slice($assignments, $mid);

                    // Recursive calls
                    $this->insertBatchRecursive($recordsChunk1, $assignmentsChunk1, $attempt + 1);
                    $this->insertBatchRecursive($recordsChunk2, $assignmentsChunk2, $attempt + 1);

                    return;
                } else {
                    // Single row failure, cannot split further
                    Log::error('Single row insert failed after splits. Skipping potentially bad row.');

                    throw $e;
                }
            }

            throw $e; // Rethrow non-connection errors
        }
    }
}
