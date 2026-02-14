<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('app_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('app_id')->constrained('apps')->cascadeOnDelete();
            $table->foreignUuid('table_id')->constrained('tables')->cascadeOnDelete();

            // The actual data
            $table->json('data');

            // Metadata
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index('table_id');
            // We might want to index keys inside JSON in the future, but for now standard index is enough
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_records');
    }
};
