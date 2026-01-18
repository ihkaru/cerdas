<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        // 1. Apps Table
        if (Schema::hasTable('apps') && !Schema::hasColumn('apps', 'uuid')) {
            Schema::table('apps', function (Blueprint $table) {
                $table->uuid('uuid')->after('id')->nullable();
            });

            // Populate existing
            $apps = DB::table('apps')->get();
            foreach ($apps as $app) {
                DB::table('apps')->where('id', $app->id)->update(['uuid' => (string) Str::uuid()]);
            }

            // Make non-nullable and unique
            Schema::table('apps', function (Blueprint $table) {
                $table->uuid('uuid')->nullable(false)->change();
                $table->unique('uuid');
            });
        }

        // 2. Forms Table
        if (Schema::hasTable('forms') && !Schema::hasColumn('forms', 'uuid')) {
            Schema::table('forms', function (Blueprint $table) {
                $table->uuid('uuid')->after('id')->nullable();
            });

            // Populate existing
            $forms = DB::table('forms')->get();
            foreach ($forms as $form) {
                DB::table('forms')->where('id', $form->id)->update(['uuid' => (string) Str::uuid()]);
            }

            // Make non-nullable and unique
            Schema::table('forms', function (Blueprint $table) {
                $table->uuid('uuid')->nullable(false)->change();
                $table->unique('uuid');
            });
        }
    }

    public function down(): void {
        Schema::table('apps', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
        Schema::table('forms', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};
