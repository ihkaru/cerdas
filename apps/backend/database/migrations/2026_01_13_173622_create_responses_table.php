<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->onDelete('cascade');
            $table->foreignId('parent_response_id')->nullable()->constrained('responses')->onDelete('cascade');
            $table->json('data'); // Dynamic form data
            $table->uuid('local_id'); // Client-generated UUID for offline sync
            $table->string('device_id')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('local_id');
            $table->index(['assignment_id', 'synced_at']);
            $table->index(['parent_response_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('responses');
    }
};
