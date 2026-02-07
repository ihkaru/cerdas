<?php

namespace Database\Seeders;

use App\Models\App;
use App\Models\AppMembership;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;

class AppSeeder extends Seeder {
    public function run(): void {
        $admin = User::where('email', 'admin@cerdas.com')->first();
        $supervisor = User::where('email', 'supervisor@cerdas.com')->first();
        $enumerator1 = User::where('email', 'user@example.com')->first();
        $enumerator2 = User::where('email', 'enum2@cerdas.com')->first();

        // 1. Create App
        $app = App::firstOrCreate([
            'slug' => 'housing-survey-2026'
        ], [
            'name' => 'Housing Survey 2026',
            'description' => 'Pendataan Rumah Tidak Layak Huni (RTLH) Kabupaten Mempawah',
            'created_by' => $admin->id,
            'mode' => 'complex', // Explicitly set to complex (Organization Based)
        ]);

        // 2. Organization (Dinas) -> Note: Organization model might need update if it has project_id
        // Assuming Organization still links to App but we need to check Organization model later.
        // For now, let's assume project_id in Organization table was also renamed to app_id?
        // Wait, I didn't check Organization migration.
        // Let's assume for now Organization is still linked to App (via app_id if renamed, or project_id if not).
        // Based on my migration 'rename_projects_to_apps', I only renamed 'project_memberships' and 'app_schemas'.
        // I DID NOT rename 'organizations' table columns explicitly in that migration file.
        // I need to check if 'organizations' table uses project_id.

        // 2. Organization (Global)
        $org = Organization::firstOrCreate([
            'code' => 'DPR-MPW'
        ], [
            'name' => 'Dinas Perumahan Rakyat',
            'creator_id' => $admin->id,
        ]);

        // Attach Organization to App
        $app->organizations()->syncWithoutDetaching([$org->id]);

        // 2b. Organization (Testing Source) - Not attached initially
        Organization::firstOrCreate([
            'code' => 'BPS-BDG'
        ], [
            'name' => 'BPS Kabupaten Bandung',
            'creator_id' => $admin->id,
        ]);

        // 3. Memberships

        // Admin as Admin
        AppMembership::firstOrCreate([
            'user_id' => $admin->id,
            'app_id' => $app->id,
        ], [
            'organization_id' => $org->id,
            'role' => 'app_admin', // Changed from project_admin
        ]);

        // Supervisor as Supervisor
        AppMembership::firstOrCreate([
            'user_id' => $supervisor->id,
            'app_id' => $app->id,
        ], [
            'organization_id' => $org->id,
            'role' => 'supervisor',
        ]);

        // Enumerator 1
        AppMembership::firstOrCreate([
            'user_id' => $enumerator1->id,
            'app_id' => $app->id,
        ], [
            'organization_id' => $org->id,
            'role' => 'enumerator',
            'supervisor_id' => $supervisor->id,
        ]);

        // Enumerator 2
        AppMembership::firstOrCreate([
            'user_id' => $enumerator2->id,
            'app_id' => $app->id,
        ], [
            'organization_id' => $org->id,
            'role' => 'enumerator',
            'supervisor_id' => $supervisor->id,
        ]);
    }
}
