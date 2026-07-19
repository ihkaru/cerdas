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

        // Determine which tab(s) this response belongs to
        $parentResponseId = $response->getAttribute('parent_response_id');
        $isNested = ! empty($parentResponseId);
        $tabType = $isNested ? 'nested' : 'root';

        // Determine which nested field key this response belongs to (for nested tabs)
        // Note: this is determined by matching the parent response's repeatable field
        // For now, we identify nested field key from the tab config (first nested tab)
        // In future: could store field_key on Response directly
        $targetTabs = array_filter($tabs, fn ($tab) => $tab['type'] === $tabType);

        if (empty($targetTabs)) {
            Log::debug('GoogleSheetEnqueueRowJob: no matching tab for response', [
                'response_id' => $this->responseId,
                'tab_type' => $tabType,
            ]);

            return;
        }

        foreach ($targetTabs as $tab) {
            $rowData = null;

            if ($this->operation === 'upsert') {
                $rawStatus = $response->assignment?->status ?? 'submitted';
                $statusLabel = match ($rawStatus) {
                    'submitted' => 'Submitted',
                    'in_progress' => 'In Progress',
                    'verified', 'approved' => 'Approved',
                    'rejected' => 'Rejected',
                    default => ucfirst(str_replace('_', ' ', $rawStatus)),
                };

                // Build metadata for system columns
                $metadata = [
                    'response_id' => $response->id,
                    'status' => $statusLabel,
                    'enumerator' => $response->assignment?->enumerator?->name ?? 'Unassigned',
                    'submitted_at' => $response->created_at?->toISOString() ?? '',
                    'status_updated_at' => $response->assignment?->updated_at?->toISOString() ?? $response->updated_at?->toISOString() ?? '',
                    'status_history' => $mapper->formatStatusHistory($response->assignment?->status_history),
                    'synced_at' => now()->toISOString(),
                    'assignment' => $response->assignment?->id ?? '',
                    'child_response_id' => $response->id,
                    'parent_response_id' => $parentResponseId ?? '',
                ];

                $rowData = $mapper->buildRowValues(
                    responseData: $response->data ?? [],
                    fields: $fields,
                    isRoot: ! $isNested,
                    metadata: $metadata,
                    nestedFieldKey: $tab['field_key'] ?? null
                );
            }

            PendingSheetRow::create([
                'spreadsheet_id' => $sheetConfig['spreadsheet_id'],
                'sheet_name' => $tab['sheet_name'],
                'tab_type' => $tab['type'],
                'app_id' => $table->app_id,
                'table_id' => $table->id,
                'response_id' => $response->id,
                'operation' => $this->operation,
                'row_data' => $rowData,
            ]);
        }

        Log::debug('GoogleSheetEnqueueRowJob: enqueued', [
            'response_id' => $this->responseId,
            'operation' => $this->operation,
            'tabs' => count($targetTabs),
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
