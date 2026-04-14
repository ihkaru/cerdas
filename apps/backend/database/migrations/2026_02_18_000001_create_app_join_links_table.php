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
        Schema::create('app_join_links', function (Blueprint $blueprint) {
            $blueprint->uuid('id')->primary();
            $blueprint->uuid('app_id');
            $blueprint->string('token')->unique();
            $blueprint->string('role')->default('enumerator');
            $blueprint->boolean('is_active')->default(true);
            $blueprint->timestamp('expires_at')->nullable();
            $blueprint->uuid('created_by')->nullable();
            $blueprint->timestamps();

            $blueprint->foreign('app_id')->references('id')->on('apps')->onDelete('cascade');
            $blueprint->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_join_links');
    }
};
