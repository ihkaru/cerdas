<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('app_schema_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('app_schema_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('version');
            $table->json('schema'); // Field definitions, validations, expressions
            $table->text('changelog')->nullable();
            $table->timestamp('published_at')->nullable(); // null = draft
            $table->timestamps();

            // Version is unique per schema
            $table->unique(['app_schema_id', 'version']);
            $table->index(['app_schema_id', 'published_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('app_schema_versions');
    }
};
