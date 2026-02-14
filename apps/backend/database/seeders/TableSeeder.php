<?php

namespace Database\Seeders;

use App\Models\App;
use App\Models\Assignment;
use App\Models\Organization;
use App\Models\Table;
use App\Models\TableVersion;
use App\Models\User;
use Illuminate\Database\Seeder;

class TableSeeder extends Seeder
{
    public function run(): void
    {
        $app = App::where('slug', 'housing-survey-2026')->first();
        // Fetch Organization via pivot (multi-org)
        $org = $app->organizations()->first();

        if (! $org) {
            // Fallback if not attached yet
            $org = Organization::where('code', 'DPR-MPW')->first();
        }

        $enumerator1 = User::where('email', 'user@example.com')->first();
        $enumerator2 = User::where('email', 'enum2@cerdas.com')->first();
        $supervisor = User::where('email', 'supervisor@cerdas.com')->first();

        // 1. Define Table (RTLH Table)
        $table = Table::firstOrCreate([
            'app_id' => $app->id,
            'slug' => 'rtlh-form', // Keeping slug same or changing? Let's keep it but maybe name is 'rtlh-table'? slug is internal key.
            // Let's keep slug as is to avoid breaking anything relying on this slug
            // (though ideally 'rtlh-table' would be cleaner, but let's assume 'rtlh-form' is the identifier)
        ], [
            'name' => 'RTLH Data',
            'current_version' => 1,
            'settings' => ['icon' => 'house', 'color' => 'blue'],
            'published_at' => now(),
        ]);

        // 2. Define Version 1 (Detailed Fields)
        // Note: 'fields' column replaces 'schema' and stores array of fields directly
        $version = TableVersion::firstOrCreate([
            'table_id' => $table->id,
            'version' => 1,
        ], [
            'fields' => [
                [
                    'name' => 'section_info',
                    'type' => 'separator',
                    'label' => 'Informasi Dasar',
                ],
                [
                    'name' => 'nik',
                    'type' => 'text',
                    'label' => 'NIK Kepala Keluarga',
                    'required' => true,
                ],
                [
                    'name' => 'name',
                    'type' => 'text',
                    'label' => 'Nama Kepala Keluarga',
                    'required' => true,
                ],
                [
                    'name' => 'address',
                    'type' => 'text',
                    'label' => 'Alamat Lengkap',
                    'required' => true,
                ],
                [
                    'name' => 'section_kondisi',
                    'type' => 'separator',
                    'label' => 'Kondisi Rumah',
                ],
                [
                    'name' => 'building_area',
                    'type' => 'number',
                    'label' => 'Luas Bangunan (m2)',
                    'required' => true,
                ],
                [
                    'name' => 'floor_type',
                    'type' => 'select',
                    'label' => 'Jenis Lantai',
                    'options' => ['Keramik', 'Semen', 'Tanah', 'Kayu'],
                    'required' => true,
                ],
                [
                    'name' => 'wall_type',
                    'type' => 'select',
                    'label' => 'Jenis Dinding',
                    'options' => ['Tembok', 'Kayu', 'Bambu'],
                    'required' => true,
                ],
                [
                    'name' => 'roof_type',
                    'type' => 'select',
                    'label' => 'Jenis Atap',
                    'options' => ['Genteng', 'Seng', 'Asbes', 'Daun'],
                    'required' => true,
                ],
                [
                    'name' => 'photo_front',
                    'type' => 'image',
                    'label' => 'Foto Depan Rumah',
                    'required' => true,
                ],
                [
                    'name' => 'gps_location',
                    'type' => 'gps',
                    'label' => 'Lokasi GPS',
                    'required' => true,
                ],
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
                'external_id' => 'PRE-00'.($index + 1),
                'table_version_id' => $version->id,
            ], [
                'table_id' => $table->id,
                'organization_id' => $org->id,
                'supervisor_id' => $supervisor->id,
                'enumerator_id' => $data[2]->id,
                'status' => 'assigned',
                'prelist_data' => [
                    'name' => $data[0],
                    'address' => $data[1],
                    'nik' => '610'.rand(1000000000000, 9999999999999),
                ],
            ]);
        }
    }
}
