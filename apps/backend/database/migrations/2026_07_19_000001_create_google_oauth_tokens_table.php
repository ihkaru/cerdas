<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Stores Google OAuth tokens at the App level (Opsi B: App-Level Token Owner).
     * One token per App. The user who first connects Google Sheet becomes the token owner.
     * access_token and refresh_token are stored encrypted via Laravel Crypt.
     */
    public function up(): void
    {
        Schema::create('google_oauth_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // One token per App (UNIQUE constraint enforces App-Level Token pattern)
            $table->foreignUuid('app_id')
                ->unique()
                ->constrained('apps')
                ->cascadeOnDelete();

            // The user who connected Google Account (token owner)
            $table->foreignUuid('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Encrypted OAuth tokens (Laravel Crypt::encryptString)
            $table->text('access_token');
            $table->text('refresh_token');

            // Space-separated list of granted scopes
            $table->text('scopes');

            // Token expiry timestamp (used to trigger auto-refresh)
            $table->timestamp('expires_at');

            $table->timestamps();

            $table->index('expires_at'); // For efficient TokenRefreshJob queries
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_oauth_tokens');
    }
};
