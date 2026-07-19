<?php

namespace App\Jobs;

use App\Models\App;
use App\Models\GoogleOAuthToken;
use App\Models\PendingSheetRow;
use App\Services\GoogleSheetsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * GoogleSheetBatchFlushJob
 *
 * Scheduler job that runs every 30 seconds.
 * Groups all pending_sheet_rows by (spreadsheet_id, sheet_name)
 * and executes ONE batchUpdate API call per spreadsheet tab.
 *
 * This is the core of the micro-batching strategy:
 * - Scales safely: 1 API call per spreadsheet per 30s window, not 1 per response
 * - Respects Google's 60 req/min/user rate limit even with many active apps
 * - Circuit breaker: max 50 spreadsheets per flush to prevent worker saturation
 *
 * Dispatched by: Laravel Scheduler (everyThirtySeconds)
 */
class GoogleSheetBatchFlushJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1; // Don't retry the scheduler job itself — next run handles leftovers

    public int $timeout = 120;

    private const MAX_SPREADSHEETS_PER_FLUSH = 50;

    public function __construct()
    {
        $this->onQueue('sheets-batch');
    }

    public function handle(GoogleSheetsService $sheetsService): void
    {
        // Load pending rows, grouped by spreadsheet + tab, oldest first
        $groups = PendingSheetRow::query()
            ->orderBy('created_at')
            ->get()
            ->groupBy(fn (PendingSheetRow $row) => $row->spreadsheet_id.'|||'.$row->sheet_name);

        if ($groups->isEmpty()) {
            return;
        }

        $processedCount = 0;
        $spreadsheetCount = 0;

        foreach ($groups as $groupKey => $rows) {
            if ($spreadsheetCount >= self::MAX_SPREADSHEETS_PER_FLUSH) {
                Log::info('GoogleSheetBatchFlushJob: circuit breaker hit, deferring remaining groups', [
                    'remaining_groups' => $groups->count() - $spreadsheetCount,
                ]);
                break;
            }

            [$spreadsheetId, $tabName] = explode('|||', $groupKey, 2);

            /** @var Collection<PendingSheetRow> $rows */
            $firstRow = $rows->first();
            $appId = $firstRow->app_id;

            /** @var App|null $app */
            $app = App::find($appId);
            if (! $app) {
                // App was deleted — clean up pending rows
                PendingSheetRow::whereIn('id', $rows->pluck('id'))->delete();

                continue;
            }

            // Check token
            $token = GoogleOAuthToken::where('app_id', $appId)->first();
            if (! $token) {
                Log::warning('GoogleSheetBatchFlushJob: no token for app, skipping', ['app_id' => $appId]);

                continue;
            }

            try {
                // Refresh token proactively
                if ($token->needsRefresh()) {
                    $sheetsService->refreshToken($token);
                    $token->refresh();
                }

                // Build row updates array
                $rowUpdates = $rows->map(fn (PendingSheetRow $row) => [
                    'response_id' => $row->response_id,
                    'operation' => $row->operation,
                    'row_data' => $row->row_data,
                ])->all();

                // Execute batch flush — 1 API call per (spreadsheet, tab)
                $sheetsService->batchFlushRows($app, $spreadsheetId, $tabName, $rowUpdates);

                // Clean up processed rows
                PendingSheetRow::whereIn('id', $rows->pluck('id'))->delete();

                $processedCount += count($rows);
                $spreadsheetCount += 1;

                Log::debug('GoogleSheetBatchFlushJob: flushed tab', [
                    'spreadsheet_id' => $spreadsheetId,
                    'tab' => $tabName,
                    'rows' => count($rows),
                ]);
            } catch (\Google\Service\Exception $e) {
                $statusCode = $e->getCode();

                if ($statusCode === 404) {
                    // Spreadsheet deleted — disable sync for this table
                    Log::error('GoogleSheetBatchFlushJob: spreadsheet not found (404), disabling sync', [
                        'spreadsheet_id' => $spreadsheetId,
                        'app_id' => $appId,
                    ]);
                    $this->disableSyncForSpreadsheet($spreadsheetId);
                    PendingSheetRow::whereIn('id', $rows->pluck('id'))->delete();
                } elseif ($statusCode === 401 || $statusCode === 403) {
                    // Token revoked or insufficient permissions
                    Log::error('GoogleSheetBatchFlushJob: auth error, disabling sync', [
                        'spreadsheet_id' => $spreadsheetId,
                        'app_id' => $appId,
                        'status' => $statusCode,
                    ]);
                    $this->disableSyncForApp($appId);
                } else {
                    Log::error('GoogleSheetBatchFlushJob: Sheets API error', [
                        'spreadsheet_id' => $spreadsheetId,
                        'app_id' => $appId,
                        'status' => $statusCode,
                        'error' => $e->getMessage(),
                    ]);
                }
            } catch (\Throwable $e) {
                Log::error('GoogleSheetBatchFlushJob: unexpected error', [
                    'spreadsheet_id' => $spreadsheetId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($processedCount > 0) {
            Log::info('GoogleSheetBatchFlushJob: completed', [
                'rows_processed' => $processedCount,
                'spreadsheets_processed' => $spreadsheetCount,
            ]);
        }
    }

    /**
     * Disable Sheet sync for all Tables linked to this spreadsheet.
     */
    private function disableSyncForSpreadsheet(string $spreadsheetId): void
    {
        \App\Models\Table::where('source_type', 'google_sheets')
            ->whereJsonContains('source_config->google_sheet->spreadsheet_id', $spreadsheetId)
            ->get()
            ->each(function (\App\Models\Table $table) {
                $config = $table->source_config ?? [];
                if (isset($config['google_sheet'])) {
                    $config['google_sheet']['sync_enabled'] = false;
                    $table->update(['source_config' => $config]);
                }
            });
    }

    /**
     * Disable Sheet sync for all Tables in an App (e.g., on token revoke).
     */
    private function disableSyncForApp(string $appId): void
    {
        \App\Models\Table::where('app_id', $appId)
            ->where('source_type', 'google_sheets')
            ->get()
            ->each(function (\App\Models\Table $table) {
                $config = $table->source_config ?? [];
                if (isset($config['google_sheet'])) {
                    $config['google_sheet']['sync_enabled'] = false;
                    $table->update(['source_config' => $config]);
                }
            });
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('GoogleSheetBatchFlushJob: job failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
