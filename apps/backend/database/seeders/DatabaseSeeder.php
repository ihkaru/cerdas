<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder {
    public function run(): void {
        $this->call([
            UserSeeder::class,
            AppSeeder::class,
            TableSeeder::class,
            PerformanceTestSeeder::class,
            ComponentShowcaseSeeder::class,
        ]);
    }
}
