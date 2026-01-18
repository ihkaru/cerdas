<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('app_schema_version_id')->constrained()->onDelete('cascade');
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('supervisor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('enumerator_id')->constrained('users')->onDelete('cascade');
            $table->string('external_id')->nullable(); // e.g., building ID, household ID
            $table->enum('status', ['assigned', 'in_progress', 'completed', 'synced'])->default('assigned');
            $table->json('prelist_data')->nullable(); // Prefilled data from Excel/CSV
            $table->timestamps();
            $table->softDeletes();

            $table->index(['app_schema_version_id', 'status']);
            $table->index(['enumerator_id', 'status']);
            $table->index(['organization_id']);
            $table->index(['external_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('assignments');
    }
};
