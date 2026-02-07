<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        // 1. Assignments (Tasks)
        Schema::create('assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Links
            $table->foreignUuid('table_id')->constrained('tables')->cascadeOnDelete();
            $table->foreignUuid('table_version_id')->constrained('table_versions')->cascadeOnDelete();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();

            // People
            $table->foreignUuid('supervisor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('enumerator_id')->constrained('users')->cascadeOnDelete();

            // Sync & Status
            $table->uuid('external_id')->nullable()->index(); // For offline ID generation or imported ID
            $table->enum('status', ['assigned', 'in_progress', 'completed', 'synced'])->default('assigned');

            // Data
            $table->json('prelist_data')->nullable(); // Read-only pre-filled data

            $table->timestamps();
            $table->softDeletes(); // CRITICAL for offline sync

            $table->index(['table_id', 'status']);
            $table->index(['enumerator_id', 'status']);
        });

        // 2. Responses (Data Collection)
        Schema::create('responses', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('assignment_id')->constrained('assignments')->cascadeOnDelete();

            // Snapshot of version used
            $table->foreignUuid('table_version_id')->constrained('table_versions');

            // The actual data
            $table->json('data');
            $table->json('metadata')->nullable(); // GPS, timestamps, device info

            // Sync info
            $table->timestamp('synced_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('responses');
        Schema::dropIfExists('assignments');
    }
};
