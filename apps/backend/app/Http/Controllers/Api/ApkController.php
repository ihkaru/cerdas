<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;

class ApkController extends Controller
{
    /**
     * Get the latest APK metadata info (Public)
     */
    public function getLatestApkInfo(): JsonResponse
    {
        $setting = SystemSetting::where('key', 'latest_apk')->first();

        $data = $setting ? $setting->value : [
            'version' => '0.2.28',
            'url' => 'https://github.com/ihkaru/cerdas/releases/latest',
            'changelog' => [
                'Fitur Pusat Unduhan APK langsung di Dashboard',
                'Auto-sinkronisasi versi APK terbaru dari GitHub Releases',
                'Endpoint API publik untuk redirect download APK dan metadata info',
            ],
            'force_update' => false,
        ];

        // Trigger on-demand sync in background if cache is missing or last updated > 1 hour ago
        if (! $setting || $setting->updated_at->addHour()->isPast()) {
            try {
                Artisan::queue('apk:sync-version');
            } catch (\Throwable $e) {
                // Ignore queue issues, fallback works fine
            }
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Redirect to the latest APK download URL (Public)
     */
    public function downloadLatestApk()
    {
        $setting = SystemSetting::where('key', 'latest_apk')->first();
        $url = $setting && isset($setting->value['url'])
            ? $setting->value['url']
            : 'https://github.com/ihkaru/cerdas/releases/latest';

        return redirect()->away($url);
    }
}
