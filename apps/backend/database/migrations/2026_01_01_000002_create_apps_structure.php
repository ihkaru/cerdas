<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('apps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignUuid('created_by')->constrained('users')->onDelete('cascade');

            // Configuration
            $table->boolean('is_active')->default(true);
            $table->enum('mode', ['simple', 'complex'])->default('simple');
            $table->json('navigation')->nullable(); // Menu structure

            $table->timestamps();
            $table->softDeletes();

            $table->index('slug');
        });

        // Pivot: Global Orgs participating in Apps
        Schema::create('app_organizations', function (Blueprint $table) {
            $table->id(); // Pivot ID can be integer
            $table->foreignUuid('app_id')->constrained('apps')->cascadeOnDelete();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['app_id', 'organization_id']);
        });

        // Memberships: Users in Apps (with Roles)
        Schema::create('app_memberships', function (Blueprint $table) {
            $table->id(); // Pivot ID can be integer
            $table->foreignUuid('app_id')->constrained('apps')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();

            // Optional Org binding (for complex mode)
            $table->foreignUuid('organization_id')->nullable()->constrained('organizations')->nullOnDelete();

            // Hierarchy
            $table->string('role')->default('enumerator'); // app_admin, supervisor, enumerator
            $table->foreignUuid('supervisor_id')->nullable()->constrained('users')->nullOnDelete();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['app_id', 'user_id']);
            $table->index(['app_id', 'role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('app_memberships');
        Schema::dropIfExists('app_organizations');
        Schema::dropIfExists('apps');
    }
};
