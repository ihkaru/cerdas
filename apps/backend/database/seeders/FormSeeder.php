<?php

namespace Database\Seeders;

use App\Models\App;
use App\Models\Assignment;
use App\Models\Form;
use App\Models\FormVersion;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;

class FormSeeder extends Seeder {
    public function run(): void {
        $app = App::where('slug', 'housing-survey-2026')->first();
        // Assuming Organization is linked to App via project_id (legacy column name in Org table) or app_id
        // For query safety, I will assume Organization uses the same ID or I will fetch it differently.
        // Actually, Organization in AppSeeder was created using $app->id. 
        // Let's assume Organization table still has 'project_id' column for now as I didn't migrate it.
        $org = Organization::where('project_id', $app->id)->first();

        $enumerator1 = User::where('email', 'user@example.com')->first();
        $enumerator2 = User::where('email', 'enum2@cerdas.com')->first();
        $supervisor = User::where('email', 'supervisor@cerdas.com')->first();

        // 1. Define Form (RTLH Form)
        $form = Form::firstOrCreate([
            'app_id' => $app->id,
            'slug' => 'rtlh-form',
        ], [
            'name' => 'RTLH Form',
            'current_version' => 1,
            'settings' => ['icon' => 'house', 'color' => 'blue'],
            'published_at' => now(),
        ]);

        // 2. Define Version 1 (Detailed Fields)
        $version = FormVersion::firstOrCreate([
            'form_id' => $form->id,
            'version' => 1,
        ], [
            'schema' => [
                'fields' => [
                    [
                        'name' => 'section_info',
                        'type' => 'separator',
                        'label' => 'Informasi Dasar'
                    ],
                    [
                        'name' => 'nik',
                        'type' => 'text',
                        'label' => 'NIK Kepala Keluarga',
                        'required' => true,
                        // 'validation_js' => 'value.length === 16 || "NIK harus 16 digit"'
                    ],
                    [
                        'name' => 'name',
                        'type' => 'text',
                        'label' => 'Nama Kepala Keluarga',
                        'required' => true
                    ],
                    [
                        'name' => 'address',
                        'type' => 'text',
                        'label' => 'Alamat Lengkap',
                        'required' => true
                    ],
                    [
                        'name' => 'section_kondisi',
                        'type' => 'separator',
                        'label' => 'Kondisi Rumah'
                    ],
                    [
                        'name' => 'building_area',
                        'type' => 'number',
                        'label' => 'Luas Bangunan (m2)',
                        'required' => true
                    ],
                    [
                        'name' => 'floor_type',
                        'type' => 'select',
                        'label' => 'Jenis Lantai',
                        'options' => ['Keramik', 'Semen', 'Tanah', 'Kayu'],
                        'required' => true
                    ],
                    [
                        'name' => 'wall_type',
                        'type' => 'select',
                        'label' => 'Jenis Dinding',
                        'options' => ['Tembok', 'Kayu', 'Bambu'],
                        'required' => true
                    ],
                    [
                        'name' => 'roof_type',
                        'type' => 'select',
                        'label' => 'Jenis Atap',
                        'options' => ['Genteng', 'Seng', 'Asbes', 'Daun'],
                        'required' => true
                    ],
                    [
                        'name' => 'photo_front',
                        'type' => 'image',
                        'label' => 'Foto Depan Rumah',
                        'required' => true
                    ],
                    [
                        'name' => 'gps_location',
                        'type' => 'gps',
                        'label' => 'Lokasi GPS',
                        'required' => true
                    ]
                ]
            ],
            'published_at' => now(),
        ]);

        // 3. Create Assignments (Dummy Data)
        $assignments = [
            ['Bapak Budi', 'Jl. Mawar No. 1', $enumerator1],
            ['Ibu Ani', 'Jl. Melati No. 5', $enumerator1],
            ['Bapak Cecep', 'Jl. Kamboja No. 12', $enumerator1],
            ['Ibu Dini', 'Jl. Anggrek No. 3', $enumerator2],
            ['Bapak Eko', 'Jl. Kenanga No. 8', $enumerator2],
        ];

        foreach ($assignments as $index => $data) {
            Assignment::firstOrCreate([
                'external_id' => 'PRE-00' . ($index + 1),
                'form_version_id' => $version->id, // Renamed from app_schema_version_id
            ], [
                'organization_id' => $org->id,
                'supervisor_id' => $supervisor->id,
                'enumerator_id' => $data[2]->id,
                'status' => 'assigned',
                'prelist_data' => [
                    'name' => $data[0],
                    'address' => $data[1],
                    'nik' => '610' . rand(1000000000000, 9999999999999)
                ],
            ]);
        }
    }
}
