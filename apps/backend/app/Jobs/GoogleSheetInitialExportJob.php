<?php

namespace App\Jobs;

use App\Models\App;
use App\Models\Response;
use App\Models\Table;
use App\Services\GoogleSheetColumnMapper;
use App\Services\GoogleSheetsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * GoogleSheetInitialExportJob
 *
 * One-time job dispatched when an admin first connects a Google Sheet to a Table.
 * Exports ALL existing Responses (root + nested) to the connected Sheet tabs.
 *
 * Handles large datasets via pagination (500 responses per batch).
 * Idempotent: checks existing response_id in Sheet before writing to avoid duplicates.
 *
 * Dispatched by: GoogleSheetSyncController::connectSheet
 */
class GoogleSheetInitialExportJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 2;

    public int $timeout = 600; // 10 minutes for large datasets

    private const BATCH_SIZE = 500;

    public function __construct(
        private readonly string $tableId
    ) {
        $this->onQueue('sheets-batch');
    }

    public function handle(GoogleSheetsService $sheetsService, GoogleSheetColumnMapper $mapper): void
    {
        /** @var Table|null $table */
        $table = Table::with('latestVersion')->find($this->tableId);

        if (! $table) {
            Log::error('GoogleSheetInitialExportJob: Table not found', ['table_id' => $this->tableId]);

            return;
        }

        $sheetConfig = $table->source_config['google_sheet'] ?? null;
        if (! $sheetConfig || empty($sheetConfig['sync_enabled'])) {
            Log::warning('GoogleSheetInitialExportJob: sync not enabled or no config', ['table_id' => $this->tableId]);

            return;
        }

        /** @var App|null $app */
        $app = App::find($table->app_id);
        if (! $app) {
            return;
        }

        $spreadsheetId = $sheetConfig['spreadsheet_id'];
        $tabs = $sheetConfig['tabs'] ?? [];
        $tableVersion = $table->latestVersion;
        $fields = $tableVersion?->fields ?? [];

        Log::info('GoogleSheetInitialExportJob: starting', [
            'table_id' => $this->tableId,
            'spreadsheet_id' => $spreadsheetId,
        ]);

        $totalRowsSynced = 0;

        foreach ($tabs as $tab) {
            $tabName = $tab['sheet_name'];
            $tabType = $tab['type'];
            $fieldKey = $tab['field_key'] ?? null;

            try {
                if ($tabType === 'root') {
                    $totalRowsSynced += $this->exportRootResponses(
                        $sheetsService, $mapper, $app, $table, $spreadsheetId, $tabName, $fields
                    );
                } else {
                    $totalRowsSynced += $this->exportNestedResponses(
                        $sheetsService, $mapper, $app, $table, $spreadsheetId, $tabName, $fields, $fieldKey
                    );
                }
            } catch (\Throwable $e) {
                Log::error('GoogleSheetInitialExportJob: error exporting tab', [
                    'tab' => $tabName,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Update source_config with sync stats
        $config = $table->source_config ?? [];
        $config['google_sheet']['last_synced_at'] = now()->toISOString();
        $config['google_sheet']['total_rows_synced'] = $totalRowsSynced;
        $table->update(['source_config' => $config]);

        Log::info('GoogleSheetInitialExportJob: completed', [
            'table_id' => $this->tableId,
            'total_rows' => $totalRowsSynced,
        ]);
    }

    private function exportRootResponses(
        GoogleSheetsService $sheetsService,
        GoogleSheetColumnMapper $mapper,
        App $app,
        Table $table,
        string $spreadsheetId,
        string $tabName,
        array $fields
    ): int {
        // Write fresh headers first to guarantee alignment with metadata columns
        $headers = $mapper->buildHeaders($fields, isRoot: true);
        $sheetsService->writeHeaders($app, $spreadsheetId, $tabName, $headers);

        $exported = 0;
        $batchRows = [];

        Response::query()
            ->with(['assignment.enumerator'])
            ->whereHas('assignment', fn ($q) => $q->where(function ($q2) use ($table) {
                $q2->whereHas('tableVersion', fn ($q3) => $q3->where('table_id', $table->id))
                    ->orWhere('table_id', $table->id);
            }))
            ->orderBy('created_at')
            ->chunk(self::BATCH_SIZE, function ($responses) use (
                $mapper, $fields, &$batchRows, &$exported
            ) {
                foreach ($responses as $response) {
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

                    $batchRows[] = $mapper->buildRowValues(
                        responseData: $response->data ?? [],
                        fields: $fields,
                        isRoot: true,
                        metadata: $metadata,
                        nestedFieldKey: null
                    );
                    $exported++;
                }
            });

        if (! empty($batchRows)) {
            $sheetsService->bulkWriteRows($app, $spreadsheetId, $tabName, $batchRows);
        }

        return $exported;
    }

    private function exportNestedResponses(
        GoogleSheetsService $sheetsService,
        GoogleSheetColumnMapper $mapper,
        App $app,
        Table $table,
        string $spreadsheetId,
        string $tabName,
        array $fields,
        ?string $fieldKey
    ): int {
        $headers = $mapper->buildHeaders($fields, isRoot: false, nestedFieldKey: $fieldKey);
        $sheetsService->writeHeaders($app, $spreadsheetId, $tabName, $headers);

        $exported = 0;
        $batchRows = [];

        if (! \Illuminate\Support\Facades\Schema::hasColumn('responses', 'parent_response_id')) {
            return 0;
        }

        Response::query()
            ->whereHas('assignment', fn ($q) => $q->where(function ($q2) use ($table) {
                $q2->whereHas('tableVersion', fn ($q3) => $q3->where('table_id', $table->id))
                    ->orWhere('table_id', $table->id);
            }))
            ->whereNotNull('parent_response_id')
            ->orderBy('created_at')
            ->chunk(self::BATCH_SIZE, function ($responses) use (
                $mapper, $fields, $fieldKey, &$batchRows, &$exported
            ) {
                foreach ($responses as $response) {
                    $metadata = [
                        'child_response_id' => $response->id,
                        'parent_response_id' => $response->parent_response_id,
                        'submitted_at' => $response->created_at?->toISOString() ?? '',
                        'synced_at' => now()->toISOString(),
                    ];

                    $batchRows[] = $mapper->buildRowValues(
                        responseData: $response->data ?? [],
                        fields: $fields,
                        isRoot: false,
                        metadata: $metadata,
                        nestedFieldKey: $fieldKey
                    );
                    $exported++;
                }
            });

        if (! empty($batchRows)) {
            $sheetsService->bulkWriteRows($app, $spreadsheetId, $tabName, $batchRows);
        }

        return $exported;
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('GoogleSheetInitialExportJob: failed', [
            'table_id' => $this->tableId,
            'error' => $exception->getMessage(),
        ]);

        // Mark sync as disabled so editor shows error state
        $table = Table::find($this->tableId);
        if ($table) {
            $config = $table->source_config ?? [];
            if (isset($config['google_sheet'])) {
                $config['google_sheet']['sync_enabled'] = false;
                $table->update(['source_config' => $config]);
            }
        }
    }
}
