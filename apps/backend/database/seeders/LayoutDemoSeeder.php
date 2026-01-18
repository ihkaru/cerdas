<?php

namespace Database\Seeders;

use App\Models\Form;
use App\Models\FormVersion;
use App\Models\App;
use Illuminate\Database\Seeder;

class LayoutDemoSeeder extends Seeder {
    /**
     * Run the database seeds.
     */
    public function run(): void {
        // Ensure we have a project
        $app = App::first() ?? App::create(['name' => 'Demo Form', 'slug' => 'demo-project']);

        // Create a new Form with Layout
        $form = Form::firstOrCreate(
            ['slug' => 'deskel-cantik', 'app_id' => $app->id],
            [
                'name' => 'Deskel Cantik (AppSheet Parity)',
                'description' => 'Demo of Dynamic Layout Engine',
            ]
        );

        $fields = [
            [
                'id' => 'name',
                'label' => 'Nama Kepala Keluarga',
                'type' => 'text',
                'order' => 1,
                'config' => ['required' => true],
            ],
            [
                'id' => 'address',
                'label' => 'Alamat',
                'type' => 'text',
                'order' => 2,
                'config' => [],
            ],
            [
                'id' => 'location',
                'label' => 'Koordinat Rumah',
                'type' => 'gps',
                'order' => 3,
                'config' => [],
            ],
            [
                'id' => 'photo',
                'label' => 'Foto Rumah',
                'type' => 'image',
                'order' => 4,
                'config' => []
            ]
        ];

        // The View/Layout Configuration
        $layout = [
            'app_name' => 'Deskel Cantik',
            'navigation' => [
                'primary' => ['view_map', 'view_deck'],
                'menu' => []
            ],
            'views' => [
                'view_map' => [
                    'type' => 'map',
                    'title' => 'Peta Desa',
                    'source' => 'assignments', // In real app, might be responses
                    'options' => [
                        'gps_column' => 'location',
                        'pin_color' => 'red',
                        'popup_title' => 'name',
                        'popup_subtitle' => 'address'
                    ]
                ],
                'view_deck' => [
                    'type' => 'deck',
                    'title' => 'Daftar Keluarga',
                    'source' => 'assignments',
                    'options' => [
                        'title_column' => 'name',
                        'subtitle_column' => 'address',
                        'image_column' => 'photo',
                        'action' => 'view_detail'
                    ]
                ],
                'view_detail' => [
                    'type' => 'detail',
                    'title' => 'Detail Keluarga',
                    'source' => 'assignments',
                    'options' => [
                        'columns' => ['name', 'address', 'location', 'photo'],
                        'actions' => ['edit']
                    ]
                ]
            ]
        ];

        FormVersion::updateOrCreate(
            [
                'form_id' => $form->id,
                'version' => 1,
            ],
            [
                'schema' => ['fields' => $fields],
                'layout' => $layout,
                'published_at' => now(),
            ]
        );

        $form->update(['current_version' => 1]);

        $this->command->info('Layout Demo Form Created!');
    }
}
