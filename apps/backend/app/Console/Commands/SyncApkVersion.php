<?php

namespace App\Console\Commands;

use App\Models\SystemSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SyncApkVersion extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'apk:sync-version';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch the latest APK version, download URL, and changelog from GitHub Releases and store it in system_settings';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fetching latest release from GitHub (ihkaru/cerdas)...');

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Cerdas-Backend-API',
            ])->timeout(10)->get('https://api.github.com/repos/ihkaru/cerdas/releases/latest');

            if ($response->failed()) {
                $this->error('Failed to fetch release from GitHub API. Status code: '.$response->status());

                return 1;
            }

            $data = $response->json();
            $tagName = $data['tag_name'] ?? null;
            if (! $tagName) {
                $this->error('No tag_name found in GitHub API response.');

                return 1;
            }

            if (preg_match('/(?:v|cerdas-v)?([0-9]+\.[0-9]+\.[0-9]+)/i', $tagName, $matches)) {
                $version = $matches[1];
            } else {
                $version = ltrim($tagName, 'v');
            }

            // Find APK asset
            $apkUrl = null;
            $assets = $data['assets'] ?? [];
            foreach ($assets as $asset) {
                if (isset($asset['name']) && str_ends_with(strtolower($asset['name']), '.apk')) {
                    $apkUrl = $asset['browser_download_url'] ?? null;
                    break;
                }
            }

            // Fallback if no specific APK asset is found (e.g. redirect to latest release page)
            if (! $apkUrl) {
                $apkUrl = $data['html_url'] ?? 'https://github.com/ihkaru/cerdas/releases/latest';
            }

            // Parse body/changelog
            $body = $data['body'] ?? '';
            $changelog = [];
            if (! empty($body)) {
                $lines = explode("\n", $body);
                foreach ($lines as $line) {
                    $trimmed = trim($line);
                    // Match markdown lists: - or *
                    if (str_starts_with($trimmed, '-') || str_starts_with($trimmed, '*')) {
                        $item = trim(substr($trimmed, 1));
                        if (! empty($item)) {
                            $changelog[] = $item;
                        }
                    }
                }
            }

            // Fallback changelog if empty
            if (empty($changelog)) {
                $changelog = ['Rilis versi terbaru '.$tagName];
            }

            // Store in database
            SystemSetting::updateOrCreate(
                ['key' => 'latest_apk'],
                [
                    'value' => [
                        'version' => $version,
                        'url' => $apkUrl,
                        'changelog' => $changelog,
                        'force_update' => false,
                    ],
                ]
            );

            $this->info("Successfully synced APK version: v{$version}");
            $this->line("Download URL: {$apkUrl}");

            return 0;

        } catch (\Throwable $e) {
            $this->error('An error occurred while syncing APK version: '.$e->getMessage());

            return 1;
        }
    }
}
