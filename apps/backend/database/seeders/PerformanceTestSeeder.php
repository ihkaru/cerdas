<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Organization;
use App\Models\App;
use App\Models\Form;
use App\Models\FormVersion;
use App\Models\AppMembership;
use Faker\Factory as Faker;
use Illuminate\Support\Str;

class PerformanceTestSeeder extends Seeder {
    public function run(): void {
        $faker = Faker::create('id_ID');
        $faker->seed(1234); // CONSTANT SEED for deterministic data

        $this->command->info('Starting Performance Test Seeder (CSV Mode)...');

        // 1. Ensure Users
        $admin = User::firstOrCreate(['email' => 'admin@cerdas.com'], ['name' => 'Admin', 'password' => bcrypt('password'), 'is_super_admin' => true]);
        $supervisor = User::firstOrCreate(['email' => 'supervisor@cerdas.com'], ['name' => 'Budi Supervisor', 'password' => bcrypt('password')]);
        $enumerator = User::firstOrCreate(['email' => 'user@example.com'], ['name' => 'Test User', 'password' => bcrypt('password')]);

        // 2. Setup Hierarchy
        $app = App::firstOrCreate(
            ['slug' => 'perf-project'],
            [
                'name' => 'Performance Stress Test App',
                'description' => 'Tested with 10k assignments',
                'created_by' => $admin->id
            ]
        );

        $org = Organization::firstOrCreate(
            ['project_id' => $app->id, 'code' => 'PERF01'], // project_id here is ambiguous, assuming assumed valid due to lack of Org migration
            ['name' => 'Performance Org Sector A']
        );

        // 3. ESSENTIAL: App Membership (This was missing!)
        $this->command->info('Ensuring App Memberships...');
        AppMembership::firstOrCreate(
            ['app_id' => $app->id, 'user_id' => $supervisor->id],
            ['organization_id' => $org->id, 'role' => 'supervisor']
        );

        AppMembership::firstOrCreate(
            ['app_id' => $app->id, 'user_id' => $enumerator->id],
            ['organization_id' => $org->id, 'role' => 'enumerator', 'supervisor_id' => $supervisor->id]
        );

        // 4. Setup Heavy Schema (Form)
        $schemaFields = [];
        $sections = [];

        for ($s = 1; $s <= 5; $s++) {
            $sections[] = [
                'id' => "section_$s",
                'title' => "Section $s",
                'children' => []
            ];
            for ($i = 1; $i <= 20; $i++) {
                $idx = ($s - 1) * 20 + $i;
                $type = match ($idx % 5) {
                    0 => 'text',
                    1 => 'number',
                    2 => 'select',
                    3 => 'gps',
                    4 => 'image'
                };
                $field = ['name' => "q_{$idx}_{$type}", 'label' => "Q{$idx}", 'type' => $type];
                if ($type === 'select') $field['options'] = [['value' => 'A', 'label' => 'A'], ['value' => 'B', 'label' => 'B']];
                $schemaFields[] = $field;
            }
        }

        $form = Form::firstOrCreate(
            ['app_id' => $app->id, 'slug' => 'perf-schema-100'],
            ['name' => 'Performance Form 100', 'current_version' => 1]
        );

        $version = FormVersion::updateOrCreate(
            ['form_id' => $form->id, 'version' => 1],
            ['schema' => ['fields' => $schemaFields], 'layout' => ['sections' => $sections], 'published_at' => now()]
        );

        // 5. CSV Generation/Loading
        $csvPath = database_path('seeders/data/performance_assignments_uuid.csv');
        $this->ensureCsvExists($csvPath, $faker);

        $this->command->info("Loading assignments from CSV: $csvPath");

        // Clear old
        DB::table('assignments')->where('form_version_id', $version->id)->delete();

        // Read CSV and Insert
        $handle = fopen($csvPath, 'r');
        $header = fgetcsv($handle); // skip header

        $batch = [];
        $now = now();
        $count = 0;

        while (($row = fgetcsv($handle)) !== false) {
            // CSV columns: external_id, status, name, address, notes
            $batch[] = [
                'form_version_id' => $version->id,
                'organization_id' => $org->id,
                'supervisor_id' => $supervisor->id,
                'enumerator_id' => $enumerator->id,
                'external_id' => $row[0],
                'status' => $row[1],
                'prelist_data' => json_encode([
                    'name' => $row[2], // Standard property for frontend display
                    'name_head' => $row[2], // Legacy/Specific property
                    'address' => $row[3],
                    'notes' => $row[4] ?? ''
                ]),
                'created_at' => $now,
                'updated_at' => $now
            ];

            if (count($batch) >= 500) {
                DB::table('assignments')->insert($batch);
                $batch = [];
                $this->command->getOutput()->write('.');
            }
            $count++;
        }

        if (!empty($batch)) {
            DB::table('assignments')->insert($batch);
        }

        fclose($handle);
        $this->command->info("\nImported $count assignments from CSV.");
    }

    private function ensureCsvExists($path, $faker) {
        if (file_exists($path)) return;

        $this->command->info('Generating static CSV file...');
        if (!is_dir(dirname($path))) mkdir(dirname($path), 0755, true);

        $handle = fopen($path, 'w');
        fputcsv($handle, ['uuid', 'status', 'name', 'address', 'notes']);

        for ($i = 1; $i <= 10000; $i++) {
            fputcsv($handle, [
                $faker->uuid, // Generate UUID
                'assigned',
                $faker->name,
                $faker->address,
                'Stress Test UUID Data'
            ]);
        }
        fclose($handle);
    }
}
