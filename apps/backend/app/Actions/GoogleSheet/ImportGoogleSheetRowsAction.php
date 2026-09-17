<?php

namespace App\Actions\GoogleSheet;

use App\Models\App;
use App\Models\AppRecord;
use App\Models\Assignment;
use App\Models\Table;
use App\Services\GoogleSheetsService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * ImportGoogleSheetRowsAction
 *
 * Ingests initial or refreshed rows from a connected Google Sheet
 * into the local AppRecord (for Data Preview) and Assignment (for Live Preview / Enumerators).
 *
 * Scalability Architecture:
 * - Range-based streaming (5,000 rows/request) prevents Google Sheets API 10MB payload limit.
 * - Selective DB matching per chunk keeps RAM usage O(1) (< 50MB) even on 100k+ rows.
 * - Mini-transactions (1,000 rows/commit) eliminate table locks & prevent deadlocks with mobile users.
 * - Real-time progress cached for UI status polling.
 */
class ImportGoogleSheetRowsAction
{
    public function __construct(
        private readonly GoogleSheetsService $sheetsService
    ) {}

    /**
     * Ingest all data rows from a Google Sheet tab into a Table.
     *
     * @param  App  $app  Parent App
     * @param  Table  $table  Target Table
     * @param  string  $spreadsheetId  Google Spreadsheet ID
     * @param  string  $sheetName  Tab name in spreadsheet
     * @param  array<int, array{name: string, type?: string, original_header?: string, source_index?: int}>  $columns  Field definitions
     * @return int Number of rows imported
     */
    public function execute(
        App $app,
        Table $table,
        string $spreadsheetId,
        string $sheetName,
        array $columns
    ): int {
        // 1. Fetch header row (Row 1 only) to discover structure & column boundaries
        try {
            $headerRows = $this->sheetsService->getSheetRowRange($app, $spreadsheetId, $sheetName, 1, 1, 'ZZ');
        } catch (\Exception $e) {
            Log::warning('ImportGoogleSheetRowsAction: failed to fetch sheet header', [
                'table_id' => $table->id,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }

        if (empty($headerRows) || count($headerRows) === 0 || empty($headerRows[0])) {
            return 0;
        }

        $headerRow = $headerRows[0];
        $totalHeaderCols = count($headerRow);
        $lastColLetter = $this->sheetsService->columnIndexToLetter($totalHeaderCols);

        // Map column definitions to header indices
        $headerMap = [];
        foreach ($headerRow as $idx => $headerText) {
            $normalized = trim(strtolower((string) $headerText));
            if ($normalized !== '') {
                $headerMap[$normalized] = $idx;
            }
        }

        $columnMappings = [];
        foreach ($columns as $idx => $col) {
            $colName = $col['name'];
            $origHeader = isset($col['original_header']) ? trim(strtolower((string) $col['original_header'])) : '';

            $sourceIdx = $col['source_index'] ?? null;
            if ($sourceIdx === null || $sourceIdx === -1) {
                if ($origHeader !== '' && isset($headerMap[$origHeader])) {
                    $sourceIdx = $headerMap[$origHeader];
                } elseif (isset($headerMap[strtolower($colName)])) {
                    $sourceIdx = $headerMap[strtolower($colName)];
                } else {
                    $sourceIdx = $idx;
                }
            }

            $columnMappings[] = [
                'name' => $colName,
                'source_index' => (int) $sourceIdx,
            ];
        }

        // Smart name & address aliases
        $nameField = null;
        $addressField = null;
        foreach ($columns as $col) {
            $slug = strtolower($col['name']);
            if (! $nameField && in_array($slug, ['name', 'nama', 'title', 'judul', 'customer_name', 'full_name', 'nama_lengkap'], true)) {
                $nameField = $col['name'];
            }
            if (! $addressField && in_array($slug, ['address', 'alamat', 'location', 'lokasi', 'alamat_lengkap', 'full_address', 'kota'], true)) {
                $addressField = $col['name'];
            }
        }

        @ini_set('memory_limit', '1024M');
        @set_time_limit(900);
        DB::disableQueryLog();

        $versionModel = $table->versions()->latest('version')->first();
        $versionId = $versionModel?->id;
        $defaultOrgId = $app->organizations()->first()?->id;
        $syncStartTime = now();
        $nowFormatted = $syncStartTime->format('Y-m-d H:i:s');

        $configuredKeyCol = $table->source_config['google_sheet']['key_column'] ?? null;
        if ($configuredKeyCol === '_cerdas_id') {
            $configuredKeyCol = null;
        }

        // 2. Clear old preview records in small chunks to prevent lock escalation
        while (true) {
            $deleted = AppRecord::where('table_id', $table->id)->limit(5000)->forceDelete();
            if ($deleted === 0) {
                break;
            }
        }

        // 3. Check for any legacy unkeyed assignments (fallback for pre-GSheet assignments)
        $unkeyedAssignments = [];
        $unkeyedIndex = 0;
        if (Assignment::where('table_id', $table->id)->whereNull('external_id')->exists()) {
            $unkeyedAssignments = Assignment::where('table_id', $table->id)
                ->whereNull('external_id')
                ->select(['id', 'external_id', 'status', 'prelist_data', 'supervisor_id', 'enumerator_id'])
                ->withExists('responses')
                ->limit(5000)
                ->get()
                ->map(function ($existing) {
                    $prelist = is_array($existing->prelist_data)
                        ? $existing->prelist_data
                        : (json_decode($existing->prelist_data ?? '{}', true) ?: []);
                    return [
                        'id' => (string) $existing->id,
                        'external_id' => null,
                        'status' => $existing->status,
                        'supervisor_id' => $existing->supervisor_id,
                        'enumerator_id' => $existing->enumerator_id,
                        'responses_exists' => (bool) $existing->responses_exists,
                        'prelist_data' => $prelist,
                    ];
                })
                ->all();
        }

        // 4. Stream data rows in bounded range chunks (5,000 rows per Google API request)
        $chunkSize = 5000;
        $startRow = 2; // Google Sheets row 1 is header, data starts at row 2
        $importedCount = 0;

        try {
            while (true) {
                $endRow = $startRow + $chunkSize - 1;

                try {
                    $rangeRows = $this->sheetsService->getSheetRowRange(
                        $app,
                        $spreadsheetId,
                        $sheetName,
                        $startRow,
                        $endRow,
                        $lastColLetter
                    );
                } catch (\Exception $e) {
                    Log::error('ImportGoogleSheetRowsAction: error fetching range chunk', [
                        'table_id' => $table->id,
                        'range' => "{$sheetName}!A{$startRow}:{$lastColLetter}{$endRow}",
                        'error' => $e->getMessage(),
                    ]);
                    throw $e;
                }

                $rangeCount = count($rangeRows);
                if ($rangeCount === 0) {
                    break; // No more rows in sheet
                }

                // Parse and map rows in this chunk
                $chunkItems = [];
                $chunkExternalKeys = [];

                foreach ($rangeRows as $offset => $row) {
                    $actualSheetRow = $startRow + $offset;
                    $recordData = [];
                    $hasData = false;

                    foreach ($columnMappings as $mapping) {
                        $val = $row[$mapping['source_index']] ?? null;
                        if ($val !== null && trim((string) $val) !== '') {
                            $hasData = true;
                        }
                        $recordData[$mapping['name']] = $val;
                    }

                    if (! $hasData) {
                        continue; // Skip entirely blank rows
                    }

                    // Inject aliases
                    if ($nameField && ! isset($recordData['name']) && isset($recordData[$nameField])) {
                        $recordData['name'] = $recordData[$nameField];
                    }
                    if ($addressField && ! isset($recordData['address']) && isset($recordData[$addressField])) {
                        $recordData['address'] = $recordData[$addressField];
                    }

                    $recordData['_source_row_index'] = $actualSheetRow;

                    $bizKey = $this->extractBusinessKey($recordData, $configuredKeyCol);
                    $bizExternalKey = $bizKey !== null
                        ? $this->generateDeterministicUuid("gsheet_{$table->id}_key_{$bizKey}")
                        : null;
                    $rowExternalKey = $this->generateDeterministicUuid("gsheet_{$table->id}_" . ($actualSheetRow - 2));

                    // Collect keys for selective DB query
                    if ($bizExternalKey !== null) {
                        $chunkExternalKeys[] = $bizExternalKey;
                    }
                    $chunkExternalKeys[] = $rowExternalKey;

                    $chunkItems[] = [
                        'recordData' => $recordData,
                        'bizKey' => $bizKey,
                        'bizExternalKey' => $bizExternalKey,
                        'rowExternalKey' => $rowExternalKey,
                        'actualSheetRow' => $actualSheetRow,
                    ];
                }

                if (! empty($chunkItems)) {
                    // Selective DB query: Load ONLY the assignments matching this chunk's external keys
                    $uniqueExternalKeys = array_values(array_unique($chunkExternalKeys));
                    $matchedDbRows = Assignment::where('table_id', $table->id)
                        ->whereIn('external_id', $uniqueExternalKeys)
                        ->select(['id', 'external_id', 'status', 'prelist_data', 'supervisor_id', 'enumerator_id'])
                        ->withExists('responses')
                        ->get();

                    $matchedByExternalId = [];
                    foreach ($matchedDbRows as $dbRow) {
                        $prelist = is_array($dbRow->prelist_data)
                            ? $dbRow->prelist_data
                            : (json_decode($dbRow->prelist_data ?? '{}', true) ?: []);

                        $matchedByExternalId[$dbRow->external_id] = [
                            'id' => (string) $dbRow->id,
                            'external_id' => $dbRow->external_id,
                            'status' => $dbRow->status,
                            'supervisor_id' => $dbRow->supervisor_id,
                            'enumerator_id' => $dbRow->enumerator_id,
                            'responses_exists' => (bool) $dbRow->responses_exists,
                            'prelist_data' => $prelist,
                        ];
                    }

                    $assignmentsForChunk = [];
                    $recordsForChunk = [];

                    foreach ($chunkItems as $item) {
                        $recordData = $item['recordData'];
                        $bizExternalKey = $item['bizExternalKey'];
                        $rowExternalKey = $item['rowExternalKey'];
                        $targetExternalKey = $bizExternalKey ?? $rowExternalKey;

                        $jsonData = json_encode($recordData);
                        $recordId = Str::orderedUuid()->toString();

                        $recordsForChunk[] = [
                            'id' => $recordId,
                            'app_id' => $app->id,
                            'table_id' => $table->id,
                            'data' => $jsonData,
                            'created_at' => $nowFormatted,
                            'updated_at' => $nowFormatted,
                        ];

                        // Match priority: 1) Business Key UUID, 2) Row Key UUID, 3) Legacy Unkeyed
                        $matched = null;
                        if ($bizExternalKey !== null && isset($matchedByExternalId[$bizExternalKey])) {
                            $matched = $matchedByExternalId[$bizExternalKey];
                        } elseif (isset($matchedByExternalId[$rowExternalKey])) {
                            $matched = $matchedByExternalId[$rowExternalKey];
                        } elseif (isset($unkeyedAssignments[$unkeyedIndex])) {
                            $matched = $unkeyedAssignments[$unkeyedIndex];
                            $unkeyedIndex++;
                        }

                        if ($matched) {
                            $assignmentId = $matched['id'];
                            $currentPrelist = $matched['prelist_data'];
                            $currentPrelist['_source_row_index'] = $item['actualSheetRow'];

                            $isSubmittedOrActive = $matched['status'] !== 'assigned' || $matched['responses_exists'];
                            $finalPrelist = $isSubmittedOrActive
                                ? $currentPrelist
                                : array_merge($currentPrelist, $recordData);

                            $assignmentsForChunk[] = [
                                'id' => $assignmentId,
                                'table_id' => $table->id,
                                'table_version_id' => $versionId,
                                'organization_id' => $defaultOrgId,
                                'supervisor_id' => $matched['supervisor_id'],
                                'enumerator_id' => $matched['enumerator_id'],
                                'external_id' => $targetExternalKey,
                                'status' => $matched['status'],
                                'prelist_data' => json_encode($finalPrelist),
                                'status_history' => null,
                                'created_at' => $nowFormatted,
                                'updated_at' => $nowFormatted,
                            ];
                        } else {
                            // Brand new Assignment
                            $assignmentsForChunk[] = [
                                'id' => (string) Str::uuid(),
                                'table_id' => $table->id,
                                'table_version_id' => $versionId,
                                'organization_id' => $defaultOrgId,
                                'supervisor_id' => null,
                                'enumerator_id' => null,
                                'external_id' => $targetExternalKey,
                                'status' => 'assigned',
                                'prelist_data' => $jsonData,
                                'status_history' => json_encode([
                                    ['status' => 'assigned', 'timestamp' => $syncStartTime->toISOString(), 'source' => 'gsheet_import'],
                                ]),
                                'created_at' => $nowFormatted,
                                'updated_at' => $nowFormatted,
                            ];
                        }
                    }

                    // Flush mini-batches (1,000 rows/commit) to keep transactions short & release locks immediately
                    $subBatchSize = 1000;
                    $assignChunks = array_chunk($assignmentsForChunk, $subBatchSize);
                    $recordChunks = array_chunk($recordsForChunk, $subBatchSize);

                    foreach ($assignChunks as $subIdx => $subAssignments) {
                        $subRecords = $recordChunks[$subIdx] ?? [];
                        DB::transaction(function () use ($subAssignments, $subRecords) {
                            $this->flushBatch($subAssignments, $subRecords);
                        });
                    }

                    $importedCount += count($assignmentsForChunk);

                    // Update real-time sync progress cache for UI polling
                    Cache::put("sheet_sync_progress_{$table->id}", [
                        'status' => 'syncing',
                        'rows_synced' => $importedCount,
                        'last_sheet_row' => $startRow + $rangeCount - 1,
                        'updated_at' => now()->toISOString(),
                    ], 3600);
                }

                // Advance startRow
                $startRow += $rangeCount;

                // Memory hygiene: free chunk references and trigger PHP garbage collector
                unset(
                    $rangeRows,
                    $chunkItems,
                    $chunkExternalKeys,
                    $uniqueExternalKeys,
                    $matchedDbRows,
                    $matchedByExternalId,
                    $assignmentsForChunk,
                    $recordsForChunk,
                    $assignChunks,
                    $recordChunks
                );
                gc_collect_cycles();

                // If Google returned fewer rows than requested chunk, we reached EOF
                if ($rangeCount < $chunkSize) {
                    break;
                }
            }

            // 5. Clean up untouched orphan 'assigned' assignments that were removed from Google Sheet
            // Uses chunked deletion of 1,000 rows to prevent table lock escalation
            $softDeletedCount = 0;
            while (true) {
                $deleted = Assignment::where('table_id', $table->id)
                    ->where('status', 'assigned')
                    ->whereDoesntHave('responses')
                    ->where('updated_at', '<', $syncStartTime)
                    ->limit(1000)
                    ->delete();

                $softDeletedCount += $deleted;
                if ($deleted < 1000) {
                    break;
                }
            }

            // Clear progress cache on success
            Cache::forget("sheet_sync_progress_{$table->id}");

            Log::info('ImportGoogleSheetRowsAction: completed extreme-scale sync', [
                'table_id' => $table->id,
                'imported_count' => $importedCount,
                'soft_deleted_count' => $softDeletedCount,
            ]);

            return $importedCount;
        } catch (\Throwable $e) {
            Cache::put("sheet_sync_progress_{$table->id}", [
                'status' => 'failed',
                'rows_synced' => $importedCount,
                'error' => $e->getMessage(),
                'updated_at' => now()->toISOString(),
            ], 3600);

            Log::error('ImportGoogleSheetRowsAction: error during row ingestion', [
                'table_id' => $table->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Flush a batch of assignments and preview records in bulk.
     *
     * @param  array<int, array<string, mixed>>  $assignments
     * @param  array<int, array<string, mixed>>  $records
     */
    private function flushBatch(array $assignments, array $records): void
    {
        if (! empty($assignments)) {
            Assignment::upsert(
                $assignments,
                ['id'],
                ['table_version_id', 'external_id', 'status', 'prelist_data', 'updated_at']
            );
        }

        if (! empty($records)) {
            AppRecord::insert($records);
        }
    }

    /**
     * Extract a natural business key from row/prelist data.
     */
    private function extractBusinessKey(array $data, ?string $configuredKey = null): ?string
    {
        // 1. Check explicitly configured key column (if not _cerdas_id)
        if ($configuredKey && $configuredKey !== '_cerdas_id') {
            if (isset($data[$configuredKey]) && trim((string) $data[$configuredKey]) !== '') {
                return trim((string) $data[$configuredKey]);
            }
        }

        // 2. High-priority known domain natural ID keys (e.g. BSPS, Perkimtan, Social Surveys)
        $priorityKeys = [
            'no_usulan_perkimtan',
            'no_usulan',
            'nomor_usulan',
            'nik_pemohon',
            'nik',
            'no_kk',
            'nomor_kk',
            'id_responden',
            'kode_responden',
            'kode_keluarga',
            'id_penerima',
            'id_pelanggan',
            'id',
            'uuid',
        ];

        foreach ($priorityKeys as $key) {
            if (isset($data[$key]) && trim((string) $data[$key]) !== '') {
                return trim((string) $data[$key]);
            }
        }

        // 3. Heuristic pattern search for any key starting with no_ or ending with _id / _kode
        foreach ($data as $k => $v) {
            if ($v === null || trim((string) $v) === '' || str_starts_with((string) $k, '_')) {
                continue;
            }
            $slug = strtolower((string) $k);
            if (preg_match('/(^|_)(nik|id|kode|uuid)($|_)/i', $slug) || str_starts_with($slug, 'no_') || str_starts_with($slug, 'nomor_')) {
                return trim((string) $v);
            }
        }

        // 4. Natural composite fallback: name + address / location if both exist
        $name = $data['name'] ?? $data['nama'] ?? $data['nama_calon_penerima'] ?? null;
        $address = $data['address'] ?? $data['alamat'] ?? $data['desa_kelurahan'] ?? $data['nama_sls'] ?? null;
        if ($name && $address && trim((string) $name) !== '' && trim((string) $address) !== '') {
            return strtolower(trim((string) $name)).'__'.strtolower(trim((string) $address));
        }

        return null;
    }

    /**
     * Generate a deterministic valid UUID v4 formatted string from a seed.
     */
    private function generateDeterministicUuid(string $seed): string
    {
        $hash = md5($seed);

        return sprintf('%08s-%04s-%04s-%04s-%12s',
            substr($hash, 0, 8),
            substr($hash, 8, 4),
            substr($hash, 12, 4),
            substr($hash, 16, 4),
            substr($hash, 20, 12)
        );
    }
}
