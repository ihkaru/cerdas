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
        // Allow assignments to be unassigned (null supervisor/enumerator)
        // and belong to apps without organizations (null organization_id)
        Schema::table('assignments', function (Blueprint $table) {
            $table->foreignUuid('supervisor_id')->nullable()->change();
            $table->foreignUuid('enumerator_id')->nullable()->change();
            $table->foreignUuid('organization_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to nullable=false is risky if we have nulls.
        // We generally don't revert constraints that loosen rules unless necessary.
        // But for completeness:
        Schema::table('assignments', function (Blueprint $table) {
            // We cannot easily revert if there are nulls.
            // Leaving emptiness here or just attempting change.
            // $table->foreignUuid('supervisor_id')->nullable(false)->change();
        });
    }
};
