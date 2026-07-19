<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Staging table for micro-batch Google Sheets sync.
     * Instead of calling Sheets API per response (which hits rate limits),
     * we INSERT pending rows here and flush them in batches every 30 seconds.
     *
     * This approach scales safely: 1 batchUpdate API call per spreadsheet per flush.
     */
    public function up(): void
    {
        Schema::create('pending_sheet_rows', function (Blueprint $table) {
            $table->id(); // BIGINT AUTO_INCREMENT — high write throughput

            // Identifies which spreadsheet + tab to write to
            $table->string('spreadsheet_id', 255);
            $table->string('sheet_name', 255);
            $table->enum('tab_type', ['root', 'nested'])->default('root');

            // For loading the correct GoogleOAuthToken during flush
            $table->uuid('app_id');
            $table->uuid('table_id');

            // The response this row represents
            $table->uuid('response_id');

            // 'upsert' = insert new row or update existing
            // 'delete' = remove row from sheet
            $table->enum('operation', ['upsert', 'delete']);

            // Pre-built row data (null for delete operations)
            // Avoids reloading the response during batch flush
            $table->json('row_data')->nullable();

            // Only created_at — no updated_at (rows are consumed & deleted, not updated)
            $table->timestamp('created_at')->useCurrent();

            // Indexes for BatchFlushJob query performance
            $table->index(['spreadsheet_id', 'sheet_name', 'created_at'], 'idx_pending_sheet_rows_flush');
            $table->index('app_id', 'idx_pending_sheet_rows_app');
            $table->index('response_id', 'idx_pending_sheet_rows_response');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pending_sheet_rows');
    }
};
