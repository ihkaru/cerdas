<?php

namespace App\Actions\GoogleSheet;

use App\Models\App;
use App\Models\AppRecord;
use App\Models\Assignment;
use App\Models\Table;
use App\Services\GoogleSheetsService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * ImportGoogleSheetRowsAction
 *
 * Ingests initial or refreshed rows from a connected Google Sheet
 * into the local AppRecord (for Data Preview) and Assignment (for Live Preview / Enumerators).
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
        try {
            $rawRows = $this->sheetsService->getAllSheetRows($app, $spreadsheetId, $sheetName);
        } catch (\Exception $e) {
            Log::warning('ImportGoogleSheetRowsAction: failed to fetch sheet rows', [
                'table_id' => $table->id,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }

        if (empty($rawRows) || count($rawRows) <= 1) {
            // Only header or empty
            return 0;
        }

        $headerRow = $rawRows[0];
        $dataRows = array_slice($rawRows, 1);

        // Map column definitions to header indices
        $headerMap = [];
        foreach ($headerRow as $idx => $headerText) {
            $normalized = trim(strtolower((string) $headerText));
            $headerMap[$normalized] = $idx;
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

        $versionModel = $table->versions()->latest('version')->first();
        $versionId = $versionModel?->id;
        $defaultOrgId = $app->organizations()->first()?->id;
        $now = now();

        $batchSize = 250;
        $insertRecords = [];
        $insertAssignments = [];
        $importedCount = 0;

        $configuredKeyCol = $table->source_config['google_sheet']['key_column'] ?? null;
        if ($configuredKeyCol === '_cerdas_id') {
            $configuredKeyCol = null;
        }

        DB::beginTransaction();

        try {
            // Delete preview records for fresh pull (idempotent overwrite)
            AppRecord::where('table_id', $table->id)->forceDelete();

            // Fetch ALL existing assignments for this table to prevent duplicates when records are submitted
            $allAssignments = Assignment::where('table_id', $table->id)->get();

            $existingByKey = [];
            $existingByBizKey = [];
            $unkeyedList = [];

            foreach ($allAssignments as $existing) {
                if (! empty($existing->external_id)) {
                    $existingByKey[$existing->external_id] = $existing;
                } else {
                    $unkeyedList[] = $existing;
                }

                // Also index existing assignments by business key from prelist_data
                $prelist = is_array($existing->prelist_data)
                    ? $existing->prelist_data
                    : (json_decode($existing->prelist_data ?? '{}', true) ?: []);

                $existingBizKey = $this->extractBusinessKey($prelist, $configuredKeyCol);
                if ($existingBizKey !== null) {
                    $isSubmitted = $existing->status === 'submitted' || $existing->responses()->exists();
                    if (! isset($existingByBizKey[$existingBizKey]) || $isSubmitted) {
                        $existingByBizKey[$existingBizKey] = $existing;
                    }
                }
            }

            $unkeyedIndex = 0;
            $usedAssignmentIds = [];
            $insertRecords = [];
            $importedCount = 0;

            foreach ($dataRows as $rowIndex => $row) {
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

                // Save exact source row number in sheet (row 1 is header, data starts at row 2)
                $recordData['_source_row_index'] = $rowIndex + 2;

                $recordId = Str::orderedUuid()->toString();
                $jsonData = json_encode($recordData);

                $insertRecords[] = [
                    'id' => $recordId,
                    'app_id' => $app->id,
                    'table_id' => $table->id,
                    'data' => $jsonData,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $bizKey = $this->extractBusinessKey($recordData, $configuredKeyCol);
                $externalKey = $bizKey !== null
                    ? $this->generateDeterministicUuid("gsheet_{$table->id}_key_{$bizKey}")
                    : $this->generateDeterministicUuid("gsheet_{$table->id}_{$rowIndex}");

                // 1. Check if an assignment already exists with this exact externalKey
                $matchedAssignment = $existingByKey[$externalKey] ?? null;

                // 2. Match by natural business key (handles shifted rows & upgrades legacy row keys!)
                if (! $matchedAssignment && $bizKey !== null && isset($existingByBizKey[$bizKey])) {
                    $matchedAssignment = $existingByBizKey[$bizKey];
                }

                // 3. Fallback: match from unkeyed legacy prelists if available
                if (! $matchedAssignment && isset($unkeyedList[$unkeyedIndex])) {
                    $matchedAssignment = $unkeyedList[$unkeyedIndex];
                    $unkeyedIndex++;
                }

                if ($matchedAssignment) {
                    $usedAssignmentIds[] = $matchedAssignment->id;

                    $currentPrelist = is_array($matchedAssignment->prelist_data)
                        ? $matchedAssignment->prelist_data
                        : (json_decode($matchedAssignment->prelist_data ?? '{}', true) ?: []);
                    $currentPrelist['_source_row_index'] = $rowIndex + 2;

                    // Upgrade external_id to the stable natural business key
                    $matchedAssignment->external_id = $externalKey;

                    // Only overwrite prelist values if assignment has NOT been submitted / completed
                    if ($matchedAssignment->status === 'assigned' && ! $matchedAssignment->responses()->exists()) {
                        $matchedAssignment->table_version_id = $versionId;
                        $matchedAssignment->prelist_data = array_merge($currentPrelist, $recordData);
                        $matchedAssignment->updated_at = $now;
                        $matchedAssignment->save();
                    } else {
                        // Assignment is in_progress/submitted: update source row index metadata only
                        $matchedAssignment->prelist_data = $currentPrelist;
                        $matchedAssignment->save();
                    }
                } else {
                    // Create New Assignment with deterministic external_id
                    $newAssignment = new Assignment();
                    $newAssignment->id = (string) Str::uuid();
                    $newAssignment->table_id = $table->id;
                    $newAssignment->table_version_id = $versionId;
                    $newAssignment->organization_id = $defaultOrgId;
                    $newAssignment->supervisor_id = null;
                    $newAssignment->enumerator_id = null;
                    $newAssignment->external_id = $externalKey;
                    $newAssignment->status = 'assigned';
                    $newAssignment->prelist_data = $recordData;
                    $newAssignment->created_at = $now;
                    $newAssignment->updated_at = $now;
                    $newAssignment->save();

                    $usedAssignmentIds[] = $newAssignment->id;
                }

                $importedCount++;
            }

            // Insert AppRecords for Data Preview in batch
            if (! empty($insertRecords)) {
                foreach (array_chunk($insertRecords, 250) as $chunk) {
                    AppRecord::insert($chunk);
                }
            }

            // Soft-delete any untouched 'assigned' assignments that were removed from Google Sheet
            // or are duplicate ghosts resulting from past row shifts
            $unusedAssignments = Assignment::where('table_id', $table->id)
                ->where('status', 'assigned')
                ->whereDoesntHave('responses')
                ->whereNotIn('id', $usedAssignmentIds)
                ->get();
            foreach ($unusedAssignments as $orphan) {
                $orphan->delete(); // Soft delete generates tombstone
            }

            DB::commit();

            Log::info('ImportGoogleSheetRowsAction: completed in-place sync', [
                'table_id' => $table->id,
                'imported_count' => $importedCount,
                'soft_deleted_count' => $unusedAssignments->count(),
            ]);

            return $importedCount;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ImportGoogleSheetRowsAction: error during row insertion', [
                'table_id' => $table->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
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
