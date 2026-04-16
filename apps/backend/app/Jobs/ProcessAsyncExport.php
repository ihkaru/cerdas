<?php

namespace App\Jobs;

use App\Models\Assignment;
use App\Models\ExportJob;
use App\Models\Response;
use App\Models\TableVersion;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProcessAsyncExport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 3600; // Allow 1 hour for huge exports

    protected ExportJob $exportJob;

    public function __construct(ExportJob $exportJob)
    {
        $this->exportJob = $exportJob;
    }

    public function handle(): void
    {
        $this->exportJob->markProcessing();

        try {
            $table = $this->exportJob->table;
            $version = $this->exportJob->version;

            $tableVersion = TableVersion::where('table_id', $table->id)
                ->where('version', $version)
                ->published()
                ->first();

            if (!$tableVersion) {
                throw new \Exception("Schema version {$version} not found for this table.");
            }

            $fields = $tableVersion->getFields();
            $fieldsMap = collect($fields)->pluck('type', 'name')->toArray();
            $fieldNames = array_keys($fieldsMap);

            $baseUrl = rtrim(config('app.url'), '/');

            // Set up local temp file to write to. OOM safe approach.
            $tmpFileName = 'export_' . $this->exportJob->id . '.csv';
            $storagePath = 'exports/' . $tmpFileName;
            
            // Ensure directory exists
            Storage::makeDirectory('exports');
            $fullPath = Storage::path($storagePath);

            $file = fopen($fullPath, 'w');
            
            // Add UTF-8 BOM
            fputs($file, "\xEF\xBB\xBF");

            $csvHeaders = array_merge(['Assignment ID', 'Status', 'Submitted Version', 'Created At'], $fieldNames);
            fputcsv($file, $csvHeaders);

            // Fetch all ASSIGNMENTS via cursor to ensure we see the full project scope (monitoring)
            // Even if an assignment hasn't been filled yet, it will appear in the CSV.
            $assignmentsCursor = Assignment::where('table_id', $table->id)
                ->with(['responses' => function($query) {
                    $query->latest(); // Get latest response if multiple exist
                }])
                ->cursor();

            $totalRows = 0;
            foreach ($assignmentsCursor as $assignment) {
                // Take the latest response if available
                $response = $assignment->responses->first();
                
                // 2026 Best Practice: Data Merging
                // Start with prelist_data as the baseline (pre-filled data)
                // then merge with response data if available.
                $prelistData = is_string($assignment->prelist_data) 
                    ? json_decode($assignment->prelist_data, true) 
                    : ($assignment->prelist_data ?? []);
                
                $rawData = $prelistData;
                $submittedVersion = '';
                $createdAt = '';

                if ($response) {
                    $responseData = is_string($response->data) 
                        ? json_decode($response->data, true) 
                        : ($response->data ?? []);
                    
                    // Merge response data over prelist data
                    $rawData = array_merge($rawData, $responseData);
                    
                    $submittedVersion = $response->submitted_version;
                    $createdAt = $response->created_at;
                }

                $row = [
                    $assignment->id,
                    $assignment->status,
                    $submittedVersion,
                    $createdAt,
                ];

                foreach ($fieldNames as $field) {
                    $val = $rawData[$field] ?? '';
                    $type = $fieldsMap[$field] ?? 'text';

                    // 2026 Best Practice: Absolute Media URL Resolution
                    // If it's a media field (image, signature, file) and the value looks like a relative path,
                    // we convert it to an absolute URL so it's accessible in external tools like Mail Merge.
                    if (in_array($type, ['image', 'signature', 'file']) && is_string($val) && !empty($val)) {
                        if (!\Illuminate\Support\Str::startsWith($val, 'http')) {
                            // Ensure it starts with / (normalize)
                            $path = \Illuminate\Support\Str::startsWith($val, '/') ? $val : '/' . $val;
                            $val = $baseUrl . $path;
                        }
                    }

                    if (is_array($val) || is_object($val)) {
                        $val = json_encode($val);
                    }
                    
                    // 2026 Best Practice: Prevent CSV Injection (Formula Injection)
                    // If a cell starts with =, +, -, or @, we prepend a single quote to neutralize it.
                    if (is_string($val) && strlen($val) > 0) {
                        if (in_array($val[0], ['=', '+', '-', '@'])) {
                            $val = "'" . $val;
                        }
                    }

                    $row[] = $val;
                }

                fputcsv($file, $row);
                $totalRows++;
            }

            fclose($file);

            // Mark job success
            $this->exportJob->markCompleted($storagePath, $totalRows);

        } catch (Throwable $e) {
            \Illuminate\Support\Facades\Log::error("[ExportJob] Failed", [
                'job_id' => $this->exportJob->id,
                'error' => $e->getMessage()
            ]);
            $this->exportJob->markFailed($e->getMessage());
        }
    }
}
