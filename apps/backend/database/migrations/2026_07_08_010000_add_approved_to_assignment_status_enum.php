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
        // Add 'approved' status to the assignments status enum
        DB::statement("ALTER TABLE assignments MODIFY COLUMN status ENUM('assigned', 'in_progress', 'completed', 'submitted', 'rejected', 'synced', 'approved') DEFAULT 'assigned' NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Fallback (approved changes back to synced, though not strictly required for rollbacks in dev)
        DB::statement("ALTER TABLE assignments MODIFY COLUMN status ENUM('assigned', 'in_progress', 'completed', 'submitted', 'rejected', 'synced') DEFAULT 'assigned' NOT NULL");
    }
};
