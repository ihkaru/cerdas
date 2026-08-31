<?php

namespace App\Jobs;

use App\Actions\GoogleSheet\ImportGoogleSheetRowsAction;
use App\Models\Table;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

/**
 * SyncSingleTableSheetJob
 *
 * Granular, distributed worker job responsible for pulling data
 * from a single Google Sheet tab into a Cerdas Table.
 *
 * Scalability & Resilience Features:
 * - Rate Limiter: Max 50 requests/minute per App OAuth token (avoids Google 429 Quota Exceeded).
 * - Echo-Loop Guard: Skips execution if Cerdas flushed outbound writes in the last 60 seconds.
 * - Auto-Release: Re-queues with delay if token rate limit is reached.
 */
class SyncSingleTableSheetJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public readonly string $tableId
    ) {
        $this->onQueue('sheets-batch');
    }

    public function handle(ImportGoogleSheetRowsAction $importAction): void
    {
        /** @var Table|null $table */
        $table = Table::whereNull('deleted_at')
            ->with(['app', 'versions'])
            ->find($this->tableId);

        if (! $table || $table->source_type !== 'google_sheets') {
            return;
        }

        $sourceConfig = $table->source_config['google_sheet'] ?? null;
        if (! $sourceConfig || empty($sourceConfig['sync_enabled']) || empty($sourceConfig['inbound_sync_enabled']) || empty($sourceConfig['spreadsheet_id'])) {
            return;
        }

        // 1. Echo-Loop Guard: Skip if outbound flush occurred within the last 60s
        if (! empty($sourceConfig['last_flushed_at'])) {
            $flushedTime = strtotime($sourceConfig['last_flushed_at']);
            if ($flushedTime && (time() - $flushedTime) < 60) {
                Log::debug("SyncSingleTableSheetJob: skipped table [{$table->name}] due to recent outbound flush");
                return;
            }
        }

        $app = $table->app;
        if (! $app) {
            return;
        }

        $spreadsheetId = $sourceConfig['spreadsheet_id'];
        $sheetName = $sourceConfig['sheet_name'] ?? $table->name;
        $version = $table->getWorkingVersion();
        $fields = $version?->fields ?? [];

        // 2. Token-Bucket Rate Limiter (Max 50 req/min per App to respect Google quota)
        $rateLimitKey = 'google_sheets_api:' . $app->id;
        $importedCount = null;

        $executed = RateLimiter::attempt(
            $rateLimitKey,
            $maxAttempts = 50,
            function () use ($importAction, $app, $table, $spreadsheetId, $sheetName, $fields, &$importedCount) {
                $importedCount = $importAction->execute(
                    $app,
                    $table,
                    $spreadsheetId,
                    $sheetName,
                    $fields
                );
            },
            $decaySeconds = 60
        );

        if (! $executed) {
            $secondsRemaining = RateLimiter::availableIn($rateLimitKey);
            Log::warning("SyncSingleTableSheetJob: rate limit hit for app [{$app->id}], releasing for {$secondsRemaining}s");
            $this->release(max($secondsRemaining, 10));
            return;
        }

        // 3. Record Sync Metadata
        $fullConfig = $table->source_config ?? [];
        $fullConfig['google_sheet']['last_inbound_synced_at'] = now()->toISOString();
        $fullConfig['google_sheet']['inbound_rows_count'] = $importedCount ?? 0;
        $table->update(['source_config' => $fullConfig]);

        Log::info("SyncSingleTableSheetJob: successfully synced table [{$table->name}] ({$importedCount} rows)");
    }
}
