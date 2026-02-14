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
        Schema::table('organizations', function (Blueprint $table) {
            $table->foreignUuid('creator_id')->nullable()->after('id')->index();

            // Drop unique index on code
            $table->dropUnique(['code']);

            // Add index for filtering by creator (optional, already indexed by foreignUuid?)
            // foreignUuid usually adds index? No, foreignId() adds FK constraint. ->index() adds index.
            // I added ->index() above.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn('creator_id');
            $table->unique('code');
        });
    }
};
