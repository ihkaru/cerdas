<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('app_invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('app_id');
            $table->string('email');
            $table->string('role');
            $table->string('token')->unique();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('app_id')->references('id')->on('apps')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('app_invitations');
    }
};
