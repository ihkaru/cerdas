<?php

namespace App\Jobs;

use App\Models\Table;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * GoogleSheetInboundSyncJob
 *
 * Periodic scheduler dispatcher (every 10 minutes).
 * Uses chunkById to fan-out individual SyncSingleTableSheetJobs across worker containers.
 *
 * Memory footprint: Constant O(1) (< 10 MB) even with 1,000,000 tables.
 */
class GoogleSheetInboundSyncJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;

    public int $timeout = 180;

    public function __construct()
    {
        $this->onQueue('sheets-batch');
    }

    public function handle(): void
    {
        $dispatchedCount = 0;

        Table::where('source_type', 'google_sheets')
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->chunkById(250, function ($tables) use (&$dispatchedCount) {
                foreach ($tables as $table) {
                    $sourceConfig = $table->source_config['google_sheet'] ?? null;
                    if (! $sourceConfig || empty($sourceConfig['sync_enabled']) || empty($sourceConfig['inbound_sync_enabled']) || empty($sourceConfig['spreadsheet_id'])) {
                        continue;
                    }

                    // Fan-out individual sync job to queue
                    SyncSingleTableSheetJob::dispatch($table->id);
                    $dispatchedCount++;
                }
            });

        Log::info("GoogleSheetInboundSyncJob: dispatched {$dispatchedCount} single sheet sync jobs.");
    }
}
