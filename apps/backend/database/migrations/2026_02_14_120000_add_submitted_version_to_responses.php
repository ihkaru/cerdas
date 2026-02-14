<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add submitted_version to responses for version audit trail.
     * Tracks which form version was used when the response was created.
     */
    public function up(): void
    {
        Schema::table('responses', function (Blueprint $table) {
            $table->unsignedInteger('submitted_version')->nullable()->after('device_id');
        });
    }

    public function down(): void
    {
        Schema::table('responses', function (Blueprint $table) {
            $table->dropColumn('submitted_version');
        });
    }
};
