<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('code')->nullable(); // e.g., village code, district code
            $table->json('metadata')->nullable(); // additional org info
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['project_id', 'code']);
            $table->index(['project_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('organizations');
    }
};
