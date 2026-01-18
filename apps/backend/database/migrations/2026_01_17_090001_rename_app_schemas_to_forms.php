<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Rename 'app_schemas' table to 'forms' for user-friendly terminology.
     * A "Form" is what users create and edit within an App.
     */
    public function up(): void {
        // 1. Drop FKs in child tables first to unlock parent tables

        // Drop FK in assignments (referencing app_schema_versions)
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropForeign(['app_schema_version_id']);
        });

        // Drop FK in app_schema_versions (referencing app_schemas)
        Schema::table('app_schema_versions', function (Blueprint $table) {
            $table->dropForeign(['app_schema_id']);
        });

        // Drop FK in app_schemas (referencing projects/apps)
        Schema::table('app_schemas', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
        });

        // 2. Rename columns and tables

        // AppSchemas -> Forms
        Schema::table('app_schemas', function (Blueprint $table) {
            $table->renameColumn('project_id', 'app_id');
        });

        Schema::rename('app_schemas', 'forms');

        Schema::table('forms', function (Blueprint $table) {
            $table->foreign('app_id')->references('id')->on('apps')->onDelete('cascade');
        });

        // AppSchemaVersions -> FormVersions
        Schema::table('app_schema_versions', function (Blueprint $table) {
            $table->renameColumn('app_schema_id', 'form_id');
        });

        Schema::rename('app_schema_versions', 'form_versions');

        Schema::table('form_versions', function (Blueprint $table) {
            $table->foreign('form_id')->references('id')->on('forms')->onDelete('cascade');
        });

        // Update assignments table

        Schema::table('assignments', function (Blueprint $table) {
            $table->renameColumn('app_schema_version_id', 'form_version_id');
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->foreign('form_version_id')->references('id')->on('form_versions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        // Revert assignments
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropForeign(['form_version_id']);
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->renameColumn('form_version_id', 'app_schema_version_id');
        });

        // Revert form_versions
        Schema::table('form_versions', function (Blueprint $table) {
            $table->dropForeign(['form_id']);
        });

        Schema::table('form_versions', function (Blueprint $table) {
            $table->renameColumn('form_id', 'app_schema_id');
        });

        Schema::rename('form_versions', 'app_schema_versions');

        Schema::table('app_schema_versions', function (Blueprint $table) {
            $table->foreign('app_schema_id')->references('id')->on('app_schemas')->onDelete('cascade');
        });

        // Revert forms
        Schema::table('forms', function (Blueprint $table) {
            $table->dropForeign(['app_id']);
        });

        Schema::rename('forms', 'app_schemas');

        Schema::table('app_schemas', function (Blueprint $table) {
            $table->renameColumn('app_id', 'project_id');
        });

        Schema::table('app_schemas', function (Blueprint $table) {
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->foreign('app_schema_version_id')->references('id')->on('app_schema_versions')->onDelete('cascade');
        });
    }
};
