<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('field_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('field_id')->constrained()->onDelete('cascade');

            $table->string('value'); // stored value
            $table->string('label'); // display text
            $table->unsignedInteger('order')->default(0);
            $table->boolean('is_active')->default(true);

            // Conditional show (for cascading dropdowns)
            $table->text('show_if_js')->nullable();

            $table->timestamps();

            $table->unique(['field_id', 'value']);
            $table->index(['field_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('field_options');
    }
};
