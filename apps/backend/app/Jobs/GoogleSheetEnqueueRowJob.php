<?php

namespace App\Jobs;

use App\Models\PendingSheetRow;
use App\Models\Response;
use App\Services\GoogleSheetColumnMapper;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * GoogleSheetEnqueueRowJob
 *
 * Super-lightweight job: builds row data from a Response and
 * INSERTs it into the pending_sheet_rows staging table.
 *
 * NO Google API calls are made here — this job is purely a DB write.
 * The actual Sheets API call happens in GoogleSheetBatchFlushJob (every 30s).
 *
 * Dispatched by: ResponseController::store (upsert) + Response::deleting observer (delete)
 */
class GoogleSheetEnqueueRowJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public function __construct(
        private readonly string $responseId,
        private readonly string $operation // 'upsert' | 'delete'
    ) {
        $this->onQueue('sheets-enqueue');
    }

    public function handle(GoogleSheetColumnMapper $mapper): void
    {
        /** @var Response|null $response */
        $response = Response::withTrashed()->with([
            'assignment.tableVersion.table',
            'assignment.table',
            'assignment.enumerator',
        ])->find($this->responseId);

        if (! $response) {
            // Response may have been hard-deleted — nothing to do
            return;
        }

        $table = null;
        if (is_object($response->assignment?->tableVersion) && is_object($response->assignment->tableVersion->table)) {
            $table = $response->assignment->tableVersion->table;
        } elseif (is_object($response->assignment?->table)) {
            $table = $response->assignment->table;
        } elseif (! empty($response->assignment?->table_id)) {
            $table = Table::find($response->assignment->table_id);
        }

        if (! $table || ! is_object($table) || ($table->source_type ?? null) !== 'google_sheets') {
            return;
        }

        $sheetConfig = $table->source_config['google_sheet'] ?? null;
        if (! $sheetConfig || empty($sheetConfig['sync_enabled'])) {
            return;
        }

        $tabs = $sheetConfig['tabs'] ?? [];
        if (empty($tabs) && ! empty($sheetConfig['sheet_name'])) {
            $tabs = [
                [
                    'sheet_name' => $sheetConfig['sheet_name'],
                    'type' => 'root',
                    'field_key' => null,
                ],
            ];
        }

        $syncMode = $sheetConfig['sync_mode'] ?? (
            (! empty($sheetConfig['inbound_sync_enabled']) || ! empty($sheetConfig['columns'])) ? 'direct_columns' : 'mirror'
        );
        $sheetHeaders = $sheetConfig['columns'] ?? [];

        $fields = $response->assignment?->tableVersion?->fields ?? $table->publishedVersion?->fields ?? $table->currentVersion?->fields ?? [];

        // Build maps for root and nested tabs
        $nestedTabsMap = [];
        $rootTab = null;

        foreach ($tabs as $tab) {
            if ($tab['type'] === 'root') {
                $rootTab = $tab;
            } else {
                $nestedTabsMap[$tab['field_key']] = $tab;
            }
        }

        // 1. Process Root Tab
        if ($rootTab) {
            $tabName = $rootTab['sheet_name'];

            if ($this->operation === 'delete') {
                PendingSheetRow::create([
                    'spreadsheet_id' => $sheetConfig['spreadsheet_id'],
                    'sheet_name' => $tabName,
                    'tab_type' => 'root',
                    'app_id' => $table->app_id,
                    'table_id' => $table->id,
                    'response_id' => $response->id,
                    'operation' => 'delete',
                    'row_data' => null,
                ]);
            } else {
                if ($syncMode === 'direct_columns') {
                    $rowDataValues = $mapper->buildDirectRowValues(
                        responseData: $response->data ?? [],
                        fields: $fields,
                        sheetHeaders: $sheetHeaders
                    );

                    $prelist = is_array($response->assignment?->prelist_data)
                        ? $response->assignment->prelist_data
                        : (json_decode($response->assignment?->prelist_data ?? '{}', true) ?: []);
                    $sourceRowIndex = $prelist['_source_row_index'] ?? null;

                    $pendingPayload = $sourceRowIndex
                        ? ['__target_row' => (int) $sourceRowIndex, '__values' => $rowDataValues]
                        : $rowDataValues;

                    PendingSheetRow::create([
                        'spreadsheet_id' => $sheetConfig['spreadsheet_id'],
                        'sheet_name' => $tabName,
                        'tab_type' => 'root',
                        'app_id' => $table->app_id,
                        'table_id' => $table->id,
                        'response_id' => $response->id,
                        'operation' => 'upsert',
                        'row_data' => $pendingPayload,
                    ]);
                } else {
                    $rawStatus = $response->assignment?->status ?? 'submitted';
                    $statusLabel = match ($rawStatus) {
                        'submitted' => 'Submitted',
                        'in_progress' => 'In Progress',
                        'verified', 'approved' => 'Approved',
                        'rejected' => 'Rejected',
                        default => ucfirst(str_replace('_', ' ', $rawStatus)),
                    };

                    $metadata = [
                        'response_id' => $response->id,
                        'status' => $statusLabel,
                        'enumerator' => $response->assignment?->enumerator?->name ?? 'Unassigned',
                        'submitted_at' => $response->created_at?->toISOString() ?? '',
                        'status_updated_at' => $response->assignment?->updated_at?->toISOString() ?? $response->updated_at?->toISOString() ?? '',
                        'status_history' => $mapper->formatStatusHistory($response->assignment?->status_history),
                        'synced_at' => now()->toISOString(),
                        'assignment' => $response->assignment?->id ?? '',
                    ];

                    $rowData = $mapper->buildRowValues(
                        responseData: $response->data ?? [],
                        fields: $fields,
                        isRoot: true,
                        metadata: $metadata,
                        nestedFieldKey: null
                    );

                    PendingSheetRow::create([
                        'spreadsheet_id' => $sheetConfig['spreadsheet_id'],
                        'sheet_name' => $tabName,
                        'tab_type' => 'root',
                        'app_id' => $table->app_id,
                        'table_id' => $table->id,
                        'response_id' => $response->id,
                        'operation' => 'upsert',
                        'row_data' => $rowData,
                    ]);
                }
            }
        }

        // 2. Process Nested Tabs (Pre-clear parent records by enqueuing delete operations for nested tables)
        foreach ($nestedTabsMap as $fieldKey => $tab) {
            PendingSheetRow::create([
                'spreadsheet_id' => $sheetConfig['spreadsheet_id'],
                'sheet_name' => $tab['sheet_name'],
                'tab_type' => 'nested',
                'app_id' => $table->app_id,
                'table_id' => $table->id,
                'response_id' => $response->id, // If nested, this deletes all rows matching parent_response_id
                'operation' => 'delete',
                'row_data' => null,
            ]);
        }

        // 3. For Upsert, recursively extract and enqueue all nested child items
        if ($this->operation === 'upsert' && ! empty($nestedTabsMap)) {
            $this->enqueueNestedItems(
                data: $response->data ?? [],
                fields: $fields,
                parentId: $response->id,
                rootResponseId: $response->id,
                submittedAt: $response->created_at?->toISOString() ?? '',
                nestedTabsMap: $nestedTabsMap,
                mapper: $mapper,
                spreadsheetId: $sheetConfig['spreadsheet_id'],
                table: $table,
                prefixKey: ''
            );
        }

        Log::debug('GoogleSheetEnqueueRowJob: enqueued', [
            'response_id' => $this->responseId,
            'operation' => $this->operation,
            'tabs' => count($tabs),
        ]);
    }

    /**
     * Recursively traverse schema fields and data to extract and enqueue nested items.
     */
    private function enqueueNestedItems(
        array $data,
        array $fields,
        string $parentId,
        string $rootResponseId,
        string $submittedAt,
        array $nestedTabsMap,
        GoogleSheetColumnMapper $mapper,
        string $spreadsheetId,
        $table,
        string $prefixKey = ''
    ): void {
        foreach ($fields as $field) {
            if (! $mapper->isRepeatableField($field)) {
                continue;
            }

            $key = $field['name'] ?? $field['key'] ?? null;
            if (! $key) {
                continue;
            }

            $fullKey = $prefixKey ? "{$prefixKey}.{$key}" : $key;
            $items = $data[$key] ?? [];

            if (! is_array($items)) {
                continue;
            }

            $tab = $nestedTabsMap[$fullKey] ?? null;
            $subFields = $field['fields'] ?? $field['sub_fields'] ?? [];

            foreach ($items as $i => $item) {
                if (! is_array($item)) {
                    continue;
                }

                $childId = \Ramsey\Uuid\Uuid::uuid5(\Ramsey\Uuid\Uuid::NAMESPACE_DNS, $parentId.'_'.$key.'_'.$i)->toString();

                if ($tab) {
                    $metadata = [
                        'child_response_id' => $childId,
                        'parent_response_id' => $parentId,
                        'submitted_at' => $submittedAt,
                        'synced_at' => now()->toISOString(),
                    ];

                    $rootFields = $table->latestVersion?->fields ?? $table->currentVersion?->fields ?? $fields;

                    $rowData = $mapper->buildRowValues(
                        responseData: $item,
                        fields: $rootFields,
                        isRoot: false,
                        metadata: $metadata,
                        nestedFieldKey: $fullKey
                    );

                    PendingSheetRow::create([
                        'spreadsheet_id' => $spreadsheetId,
                        'sheet_name' => $tab['sheet_name'],
                        'tab_type' => 'nested',
                        'app_id' => $table->app_id,
                        'table_id' => $table->id,
                        'response_id' => $childId,
                        'operation' => 'upsert',
                        'row_data' => $rowData,
                    ]);
                }

                // Recursively search sub-fields for deeply nested repeatable items
                if (! empty($subFields)) {
                    $this->enqueueNestedItems(
                        data: $item,
                        fields: $subFields,
                        parentId: $childId,
                        rootResponseId: $rootResponseId,
                        submittedAt: $submittedAt,
                        nestedTabsMap: $nestedTabsMap,
                        mapper: $mapper,
                        spreadsheetId: $spreadsheetId,
                        table: $table,
                        prefixKey: $fullKey
                    );
                }
            }
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('GoogleSheetEnqueueRowJob: failed', [
            'response_id' => $this->responseId,
            'operation' => $this->operation,
            'error' => $exception->getMessage(),
        ]);
    }
}
