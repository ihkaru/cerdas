<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Super Admin
        User::firstOrCreate([
            'email' => 'admin@cerdas.com',
        ], [
            'name' => 'Super Admin',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'is_super_admin' => true,
        ]);

        // 2. Supervisor
        User::firstOrCreate([
            'email' => 'supervisor@cerdas.com',
        ], [
            'name' => 'Budi Supervisor',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // 3. Enumerator (The "Test User" used in tests)
        User::firstOrCreate([
            'email' => 'user@example.com',
        ], [
            'name' => 'Test User',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // 4. Another Enumerator
        User::firstOrCreate([
            'email' => 'enum2@cerdas.com',
        ], [
            'name' => 'Siti Enumerator',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
    }
}
