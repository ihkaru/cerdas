<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        // 1. Create Views table to decouple presentation from data (forms)
        Schema::create('views', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Link to App (Container)
            $table->foreignId('app_id')->constrained('apps')->cascadeOnDelete();

            // Link to Form (Data Source) - Nullable because a view might be a dashboard aggregating multiple forms
            $table->foreignId('form_id')->nullable()->constrained('forms')->nullOnDelete();

            $table->string('name');
            $table->string('type')->default('deck'); // deck, table, map, details, form
            $table->text('description')->nullable();

            // The configuration (filtering, sorting, layout props)
            $table->json('config')->nullable();

            $table->timestamps();
        });

        // 2. Add Navigation structure to Apps table
        Schema::table('apps', function (Blueprint $table) {
            // Stores the menu structure: 
            // [{id: 'nav1', type: 'view', view_id: 'uuid', label: 'Home', icon: 'home'}]
            $table->json('navigation')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('apps', function (Blueprint $table) {
            $table->dropColumn('navigation');
        });

        Schema::dropIfExists('views');
    }
};
