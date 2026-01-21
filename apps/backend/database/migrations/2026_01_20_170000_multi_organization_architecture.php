<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Major Schema Update: Multi-Organization Architecture
 * 
 * This migration implements the new data model based on ERD discussion:
 * 
 * Key Changes:
 * 1. Apps now have 'mode' (simple|complex) - determines membership level
 * 2. Organizations become GLOBAL entities (not tied to single App)
 * 3. New pivot table: app_organizations (which orgs participate in which apps)
 * 4. app_memberships gets organization_id (nullable for simple mode)
 * 5. assignments binds to form_id (not form_version_id) for easier version updates
 * 
 * ERD Summary:
 * - Organization M:N App (via app_organizations)
 * - User M:N Organization per App (via app_memberships with org_id)
 * - Assignment -> Form (follows active FormVersion automatically)
 */
return new class extends Migration {
    public function up(): void {
        // =====================================================
        // 1. Add 'mode' column to apps table
        // =====================================================
        if (!Schema::hasColumn('apps', 'mode')) {
            Schema::table('apps', function (Blueprint $table) {
                $table->enum('mode', ['simple', 'complex'])->default('simple')->after('is_active');
            });
        }

        // =====================================================
        // 2. Make organizations GLOBAL
        // =====================================================

        // Drop FK explicitly with raw SQL to handle potential missing keys safely (if renamed)
        // Ignoring error if key doesn't exist (MySQL specific safety)
        try {
            Schema::table('organizations', function (Blueprint $table) {
                $table->known_fk_name = 'organizations_project_id_foreign';
                // We use dropForeign with explicit name
                $table->dropForeign('organizations_project_id_foreign');
            });
        } catch (\Exception $e) {
            // Fallback: maybe it's already dropped or differently named.
            // Try dropping by array convention just in case
            try {
                Schema::table('organizations', function (Blueprint $table) {
                    $table->dropForeign(['project_id']);
                });
            } catch (\Exception $e2) {
                // Ignore constraint error if it really doesn't exist
            }
        }

        // B. Drop Unique
        try {
            Schema::table('organizations', function (Blueprint $table) {
                $table->dropUnique(['project_id', 'code']);
            });
        } catch (\Exception $e) {
        }

        // C. Drop Index
        try {
            Schema::table('organizations', function (Blueprint $table) {
                $table->dropIndex(['project_id', 'name']);
            });
        } catch (\Exception $e) {
        }

        // D. Rename Column
        if (Schema::hasColumn('organizations', 'project_id')) {
            Schema::table('organizations', function (Blueprint $table) {
                $table->renameColumn('project_id', 'legacy_app_id');
            });
        }

        // E. Adjust Columns
        Schema::table('organizations', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_app_id')->nullable()->change();
        });

        // F. Add Unique (Separate call to handle dirty state)
        try {
            Schema::table('organizations', function (Blueprint $table) {
                $table->unique('code');
            });
        } catch (\Exception $e) {
        }

        // =====================================================
        // 3. Create app_organizations pivot table
        // =====================================================
        if (!Schema::hasTable('app_organizations')) {
            Schema::create('app_organizations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('app_id')->constrained('apps')->cascadeOnDelete();
                $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
                $table->json('settings')->nullable();
                $table->timestamps();

                $table->unique(['app_id', 'organization_id']);
            });

            // Migrate data
            DB::statement("
                INSERT INTO app_organizations (app_id, organization_id, created_at, updated_at)
                SELECT legacy_app_id, id, NOW(), NOW()
                FROM organizations
                WHERE legacy_app_id IS NOT NULL
            ");
        }

        // =====================================================
        // 4. Add organization_id to app_memberships
        // =====================================================
        if (!Schema::hasColumn('app_memberships', 'organization_id')) {
            Schema::table('app_memberships', function (Blueprint $table) {
                $table->foreignId('organization_id')->nullable()->after('app_id')
                    ->constrained('organizations')->nullOnDelete();
            });
        }

        // =====================================================
        // 5. Add form_id to assignments
        // =====================================================
        if (!Schema::hasColumn('assignments', 'form_id')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->foreignId('form_id')->nullable()->after('id')
                    ->constrained('forms')->cascadeOnDelete();
            });

            // Migrate/Populate
            DB::statement("
                UPDATE assignments a
                JOIN form_versions fv ON a.form_version_id = fv.id
                SET a.form_id = fv.form_id
            ");

            // Make NOT NULL and Add Index
            Schema::table('assignments', function (Blueprint $table) {
                $table->unsignedBigInteger('form_id')->nullable(false)->change();
                $table->index(['form_id', 'status']);
            });
        }
    }

    public function down(): void {
        // Revert assignments
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropIndex(['form_id', 'status']);
            $table->dropForeign(['form_id']);
            $table->dropColumn('form_id');
        });

        // Revert app_memberships
        Schema::table('app_memberships', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropColumn('organization_id');
        });

        // Drop app_organizations
        Schema::dropIfExists('app_organizations');

        // Revert organizations
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropUnique(['code']);
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->renameColumn('legacy_app_id', 'project_id');
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->foreign('project_id')->references('id')->on('apps')->cascadeOnDelete();
            $table->unique(['project_id', 'code']);
            $table->index(['project_id', 'name']);
        });

        // Revert apps
        Schema::table('apps', function (Blueprint $table) {
            $table->dropColumn('mode');
        });
    }
};
