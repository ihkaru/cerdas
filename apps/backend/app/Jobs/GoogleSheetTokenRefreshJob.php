<?php

namespace App\Jobs;

use App\Models\GoogleOAuthToken;
use App\Services\GoogleSheetsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * GoogleSheetTokenRefreshJob
 *
 * Scheduler job that runs hourly.
 * Proactively refreshes Google OAuth tokens that are about to expire.
 * If refresh fails (token revoked by user), disables Sheet sync for affected App.
 *
 * Dispatched by: Laravel Scheduler (hourly)
 */
class GoogleSheetTokenRefreshJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;

    public int $timeout = 60;

    public function __construct()
    {
        $this->onQueue('sheets-batch');
    }

    public function handle(GoogleSheetsService $sheetsService): void
    {
        // Find tokens expiring in the next 30 minutes
        $tokens = GoogleOAuthToken::where('expires_at', '<', now()->addMinutes(30))
            ->get();

        if ($tokens->isEmpty()) {
            return;
        }

        Log::info('GoogleSheetTokenRefreshJob: refreshing tokens', ['count' => $tokens->count()]);

        foreach ($tokens as $token) {
            try {
                $sheetsService->refreshToken($token);

                Log::debug('GoogleSheetTokenRefreshJob: refreshed', ['app_id' => $token->app_id]);
            } catch (\Throwable $e) {
                Log::error('GoogleSheetTokenRefreshJob: refresh failed — disabling sync', [
                    'app_id' => $token->app_id,
                    'error' => $e->getMessage(),
                ]);

                // Token likely revoked by user — disable all Sheet syncs for this App
                \App\Models\Table::where('app_id', $token->app_id)
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
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('GoogleSheetTokenRefreshJob: job failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
