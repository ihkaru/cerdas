<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('app_schema_version_id')->constrained()->onDelete('cascade');
            $table->foreignId('parent_field_id')->nullable()->constrained('fields')->onDelete('cascade');

            // Field identity
            $table->string('name'); // machine name (snake_case)
            $table->string('label'); // display label
            $table->string('type'); // text, number, date, select, radio, checkbox, image, gps, signature, nested, lookup

            // Configuration
            $table->json('config')->nullable(); // type-specific config (maxLength, min, max, etc.)
            $table->json('default_value')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_readonly')->default(false);
            $table->boolean('is_hidden')->default(false);

            // JavaScript expressions (stored as text, executed on client)
            $table->text('validation_js')->nullable(); // Custom validation function
            $table->text('show_if_js')->nullable(); // Conditional visibility
            $table->text('editable_if_js')->nullable(); // Conditional editability
            $table->text('computed_js')->nullable(); // Auto-calculated value

            // Ordering and grouping
            $table->unsignedInteger('order')->default(0);
            $table->string('group')->nullable(); // For visual grouping/tabs

            // Help text
            $table->text('description')->nullable();
            $table->string('placeholder')->nullable();

            $table->timestamps();

            // Indexes
            $table->unique(['app_schema_version_id', 'name']);
            $table->index(['app_schema_version_id', 'order']);
            $table->index(['parent_field_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('fields');
    }
};
