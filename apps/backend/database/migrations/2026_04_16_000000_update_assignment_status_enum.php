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
        // Expand the status enum for assignments
        // Current: ['assigned', 'in_progress', 'completed', 'synced']
        // New: ['assigned', 'in_progress', 'completed', 'submitted', 'rejected', 'synced']
        
        DB::statement("ALTER TABLE assignments MODIFY COLUMN status ENUM('assigned', 'in_progress', 'completed', 'submitted', 'rejected', 'synced') DEFAULT 'assigned' NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: Reverting might fail if there are records with the new statuses
        DB::statement("ALTER TABLE assignments MODIFY COLUMN status ENUM('assigned', 'in_progress', 'completed', 'synced') DEFAULT 'assigned' NOT NULL");
    }
};
