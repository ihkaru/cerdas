<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Rename 'projects' table to 'apps' for terminology consistency.
     * An "App" is the container for multiple Forms.
     */
    public function up(): void {
        // Rename foreign key column in project_memberships
        Schema::table('project_memberships', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
        });

        // Rename the main table
        Schema::rename('projects', 'apps');

        Schema::rename('project_memberships', 'app_memberships');

        Schema::table('app_memberships', function (Blueprint $table) {
            $table->renameColumn('project_id', 'app_id');
        });

        Schema::table('app_memberships', function (Blueprint $table) {
            $table->foreign('app_id')->references('id')->on('apps')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        // Revert app_memberships
        Schema::table('app_memberships', function (Blueprint $table) {
            $table->dropForeign(['app_id']);
        });

        Schema::table('app_memberships', function (Blueprint $table) {
            $table->renameColumn('app_id', 'project_id');
        });

        Schema::rename('app_memberships', 'project_memberships');

        Schema::table('project_memberships', function (Blueprint $table) {
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        // Rename apps back to projects
        Schema::rename('apps', 'projects');
    }
};
