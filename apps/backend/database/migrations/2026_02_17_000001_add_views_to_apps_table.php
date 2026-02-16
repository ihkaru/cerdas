<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds a 'view_configs' JSON column to the 'apps' table to store view configurations
     * alongside navigation. Named 'view_configs' (not 'views') to avoid Eloquent collision
     * with the existing views() HasMany relationship. This ensures both navigation and view
     * configs are co-located and loaded atomically, preventing timing-related "View not found" errors.
     */
    public function up(): void
    {
        // Rename if 'views' column exists (from previous migration run), otherwise create new
        if (Schema::hasColumn('apps', 'views')) {
            Schema::table('apps', function (Blueprint $table) {
                $table->renameColumn('views', 'view_configs');
            });
        } elseif (! Schema::hasColumn('apps', 'view_configs')) {
            Schema::table('apps', function (Blueprint $table) {
                $table->json('view_configs')->nullable()->after('navigation');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->dropColumn('view_configs');
        });
    }
};
