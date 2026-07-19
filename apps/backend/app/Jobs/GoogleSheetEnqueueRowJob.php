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
        $fields = $response->assignment?->tableVersion?->fields ?? $table->publishedVersion?->fields ?? $table->currentVersion?->fields ?? [];

        // In Cerdas, responses are always root level (nested forms are stored inside the JSON 'data' column).
        // This job handles enqueuing both the root row and all its nested/repeatable rows.

        foreach ($tabs as $tab) {
            $tabName = $tab['sheet_name'];
            $tabType = $tab['type'];
            $fieldKey = $tab['field_key'] ?? null;

            if ($this->operation === 'delete') {
                PendingSheetRow::create([
                    'spreadsheet_id' => $sheetConfig['spreadsheet_id'],
                    'sheet_name' => $tabName,
                    'tab_type' => $tabType,
                    'app_id' => $table->app_id,
                    'table_id' => $table->id,
                    'response_id' => $response->id, // If nested, this will delete by parent_response_id
                    'operation' => 'delete',
                    'row_data' => null,
                ]);

                continue;
            }

            // Upsert operation
            if ($tabType === 'root') {
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
            } else {
                // Nested tab upsert:
                // 1. First enqueue a delete operation for this parent response id on the nested tab to clear old values
                PendingSheetRow::create([
                    'spreadsheet_id' => $sheetConfig['spreadsheet_id'],
                    'sheet_name' => $tabName,
                    'tab_type' => 'nested',
                    'app_id' => $table->app_id,
                    'table_id' => $table->id,
                    'response_id' => $response->id, // deletes by parent_response_id
                    'operation' => 'delete',
                    'row_data' => null,
                ]);

                // 2. Extract nested repeatable array from parent data
                $nestedItems = $response->data[$fieldKey] ?? [];
                if (! is_array($nestedItems)) {
                    continue;
                }

                foreach ($nestedItems as $i => $item) {
                    if (! is_array($item)) {
                        continue;
                    }

                    $childId = $response->id.'_'.$fieldKey.'_'.$i;

                    $metadata = [
                        'child_response_id' => $childId,
                        'parent_response_id' => $response->id,
                        'submitted_at' => $response->created_at?->toISOString() ?? '',
                        'synced_at' => now()->toISOString(),
                    ];

                    $rowData = $mapper->buildRowValues(
                        responseData: $item,
                        fields: $fields,
                        isRoot: false,
                        metadata: $metadata,
                        nestedFieldKey: $fieldKey
                    );

                    PendingSheetRow::create([
                        'spreadsheet_id' => $sheetConfig['spreadsheet_id'],
                        'sheet_name' => $tabName,
                        'tab_type' => 'nested',
                        'app_id' => $table->app_id,
                        'table_id' => $table->id,
                        'response_id' => $childId,
                        'operation' => 'upsert',
                        'row_data' => $rowData,
                    ]);
                }
            }
        }

        Log::debug('GoogleSheetEnqueueRowJob: enqueued', [
            'response_id' => $this->responseId,
            'operation' => $this->operation,
            'tabs' => count($tabs),
        ]);
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
