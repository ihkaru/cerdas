<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::table('responses', function (Blueprint $table) {
            // Make table_version_id nullable since sync doesn't always have version context
            $table->uuid('table_version_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('responses', function (Blueprint $table) {
            $table->uuid('table_version_id')->nullable(false)->change();
        });
    }
};
