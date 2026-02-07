<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        // 1. Tables (Data Source)
        Schema::create('tables', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('app_id')->constrained('apps')->cascadeOnDelete();

            $table->string('name');
            $table->string('slug'); // Slug per app
            $table->text('description')->nullable();

            // Versioning
            $table->unsignedInteger('current_version')->default(1);

            // Config
            $table->json('settings')->nullable(); // UI icon, color
            $table->string('source_type')->default('internal');
            $table->json('source_config')->nullable();

            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['app_id', 'slug']);
        });

        // 2. Table Versions (Schema History)
        Schema::create('table_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('table_id')->constrained('tables')->cascadeOnDelete();

            $table->unsignedInteger('version');
            $table->json('fields'); // The schema definition
            $table->json('layout')->nullable(); // Legacy layout, moved to views

            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['table_id', 'version']);
        });

        // 3. Views (Presentation)
        Schema::create('views', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('app_id')->constrained('apps')->cascadeOnDelete();
            $table->foreignUuid('table_id')->nullable()->constrained('tables')->nullOnDelete();

            $table->string('name');
            $table->enum('type', ['deck', 'table', 'map', 'detail', 'calendar', 'chart']);
            $table->text('description')->nullable();

            $table->json('config'); // Filter, Sort, Group, Columns

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('views');
        Schema::dropIfExists('table_versions');
        Schema::dropIfExists('tables');
    }
};
