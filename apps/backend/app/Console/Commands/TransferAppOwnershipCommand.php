<?php

namespace App\Console\Commands;

use App\Models\App;
use App\Models\AppMembership;
use App\Models\User;
use Illuminate\Console\Command;

class TransferAppOwnershipCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cerdas:transfer-ownership
                            {app : App ID or Slug}
                            {user : Target User Email or User UUID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Transfer ownership (created_by) of a survey/app to a specific user';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $appIdentifier = $this->argument('app');
        $userIdentifier = $this->argument('user');

        $app = App::withTrashed()
            ->where('id', $appIdentifier)
            ->orWhere('slug', $appIdentifier)
            ->first();

        if (! $app) {
            $this->error("App '{$appIdentifier}' not found.");

            return Command::FAILURE;
        }

        $targetUser = User::where('id', $userIdentifier)
            ->orWhere('email', $userIdentifier)
            ->first();

        if (! $targetUser) {
            $this->error("Target user '{$userIdentifier}' not found.");

            return Command::FAILURE;
        }

        $previousCreator = $app->creator?->email ?? 'none';
        $app->created_by = $targetUser->id;
        $app->save();

        // Grant app_admin role in app_memberships
        AppMembership::updateOrCreate(
            ['app_id' => $app->id, 'user_id' => $targetUser->id],
            ['role' => 'app_admin', 'is_active' => true]
        );

        $this->info("Ownership of App '{$app->name}' ({$app->id}) transferred from [{$previousCreator}] to [{$targetUser->email}]!");

        return Command::SUCCESS;
    }
}
