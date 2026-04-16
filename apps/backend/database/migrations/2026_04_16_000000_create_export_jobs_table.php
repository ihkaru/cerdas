<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('export_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('table_id')->constrained('tables')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();

            // Status lifecycle: pending → processing → completed | failed
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');

            $table->integer('version')->default(1);
            $table->string('file_path')->nullable();   // Relative storage path
            $table->integer('total_rows')->nullable(); // Rows written (for UX)
            $table->text('error_message')->nullable(); // If failed

            // Auto-expiry: completed files are deleted after 1 hour
            $table->timestamp('expires_at')->nullable();

            $table->timestamps();

            // Compound index for polling queries
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('export_jobs');
    }
};
