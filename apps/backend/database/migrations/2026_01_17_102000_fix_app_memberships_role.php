<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        // Fix the role column to explicitly include app_admin
        DB::statement("ALTER TABLE app_memberships MODIFY COLUMN role ENUM('app_admin', 'org_admin', 'supervisor', 'enumerator') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        // Revert to original if known, but for now just keep it safe
        DB::statement("ALTER TABLE app_memberships MODIFY COLUMN role ENUM('admin', 'supervisor', 'enumerator') NOT NULL");
    }
};
