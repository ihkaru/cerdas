<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:clean-trash --days=30')->daily();

// 2026 Best Practice: Auto-cleanup expired export files every hour
Schedule::call(function () {
    $count = \App\Models\ExportJob::cleanupExpired();
    logger()->info("Export cleanup: {$count} files removed.");
})->hourly();

// Google Sheet Sync — micro-batch flush (runs every 30 seconds)
Schedule::job(new \App\Jobs\GoogleSheetBatchFlushJob)->everyThirtySeconds();

// Google Sheet Sync — proactive token refresh (runs hourly)
Schedule::job(new \App\Jobs\GoogleSheetTokenRefreshJob)->hourly();

// Google Sheet Sync — automatic background inbound sync (runs every 10 minutes)
Schedule::job(new \App\Jobs\GoogleSheetInboundSyncJob)->everyTenMinutes();
