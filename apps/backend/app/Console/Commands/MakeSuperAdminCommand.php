<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MakeSuperAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cerdas:superadmin
                            {email : Email of the user to promote or create}
                            {--name= : Name of the user (if creating new)}
                            {--password= : Password of the user (if creating new)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Promote an existing user or create a new SuperAdmin user in Cerdas';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = strtolower(trim($this->argument('email')));
        $user = User::where('email', $email)->first();

        if ($user) {
            $user->is_super_admin = true;
            if ($password = $this->option('password')) {
                $user->password = Hash::make($password);
            }
            $user->save();

            $this->info("User '{$user->name}' ({$email}) has been successfully promoted to SuperAdmin!");

            return Command::SUCCESS;
        }

        $name = $this->option('name') ?: 'Super Admin';
        $password = $this->option('password') ?: Str::random(16);

        $user = User::create([
            'id' => (string) Str::uuid(),
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'email_verified_at' => now(),
            'is_super_admin' => true,
        ]);

        $this->info("Created new SuperAdmin user: {$email}");
        if (! $this->option('password')) {
            $this->warn("Generated random password: {$password}");
        }

        return Command::SUCCESS;
    }
}
