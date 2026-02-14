<?php

namespace Database\Seeders;

use App\Models\App;
use App\Models\Organization;
use App\Models\Table;
use App\Models\TableVersion;
use App\Models\View;
use Illuminate\Database\Seeder;

class LayoutDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure we have a project
        $app = App::firstOrCreate(['slug' => 'demo-project'], ['name' => 'Demo Form', 'mode' => 'complex']);

        // Attach to default org if needed (for complex mode compatibility)
        $org = Organization::first();
        if ($org) {
            $app->organizations()->syncWithoutDetaching([$org->id]);
        }

        // Create a new Table with Layout
        $table = Table::firstOrCreate(
            ['slug' => 'deskel-cantik', 'app_id' => $app->id],
            [
                'name' => 'Deskel Cantik (AppSheet Parity)',
                'description' => 'Demo of Dynamic Layout Engine',
                'current_version' => 1,
                'settings' => ['icon' => 'star', 'color' => 'pink'],
                'published_at' => now(),
            ]
        );

        $fields = [
            [
                'name' => 'name', // Changed id to name for consistency
                'label' => 'Nama Kepala Keluarga',
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'address',
                'label' => 'Alamat',
                'type' => 'text',
            ],
            [
                'name' => 'location',
                'label' => 'Koordinat Rumah',
                'type' => 'gps',
            ],
            [
                'name' => 'photo',
                'label' => 'Foto Rumah',
                'type' => 'image',
            ],
        ];

        // Create Views
        View::firstOrCreate(
            ['app_id' => $app->id, 'name' => 'Peta Desa'],
            [
                'table_id' => $table->id,
                'type' => 'map',
                'config' => [
                    'mapbox_style' => 'satellite',
                    'lat' => 'location.lat',
                    'long' => 'location.long',
                    'label' => 'name',
                ],
            ]
        );

        $listView = View::firstOrCreate(
            ['app_id' => $app->id, 'name' => 'Daftar Keluarga'],
            [
                'table_id' => $table->id,
                'type' => 'deck',
                'config' => [
                    'deck' => [
                        'primaryHeaderField' => 'name',
                        'secondaryHeaderField' => 'address',
                        'imageField' => 'photo',
                    ],
                    'actions' => ['open', 'edit'],
                ],
            ]
        );

        // Update App Navigation
        $app->navigation = [
            [
                'id' => 'nav_home',
                'type' => 'view',
                'view_id' => $listView->id,
                'label' => 'Keluarga',
                'icon' => 'users',
            ],
        ];
        $app->save();

        TableVersion::updateOrCreate(
            [
                'table_id' => $table->id,
                'version' => 1,
            ],
            [
                'fields' => $fields,
                'layout' => [], // Layout migrated to Views
                'published_at' => now(),
            ]
        );

        $this->command->info('Layout Demo App Created!');
    }
}
