<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->timestamps();
        });

        // Seed default/fallback latest APK details
        DB::table('system_settings')->insert([
            'key' => 'latest_apk',
            'value' => json_encode([
                'version' => '0.2.28',
                'url' => 'https://github.com/ihkaru/cerdas/releases/latest',
                'changelog' => [
                    'Fitur Pusat Unduhan APK langsung di Dashboard',
                    'Auto-sinkronisasi versi APK terbaru dari GitHub Releases',
                    'Endpoint API publik untuk redirect download APK dan metadata info',
                ],
                'force_update' => false,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
