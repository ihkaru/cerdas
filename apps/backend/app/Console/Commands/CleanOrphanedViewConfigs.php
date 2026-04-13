<?php

namespace App\Console\Commands;

use App\Models\App;
use App\Models\Table;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanOrphanedViewConfigs extends Command
{
    protected $signature = 'app:clean-orphaned-views {--dry-run : Preview changes without saving}';

    protected $description = 'Remove view_configs and navigation items that reference deleted tables';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->warn('DRY RUN mode — no changes will be saved.');
        }

        $apps = App::all();
        $existingIds = Table::withTrashed(false)->pluck('id')->flip(); // fast O(1) lookup
        $totalFixed = 0;

        foreach ($apps as $app) {
            $viewConfigs = $app->view_configs ?? [];
            $navigation = $app->navigation ?? [];
            $orphanedViews = [];

            if (!is_array($viewConfigs)) {
                continue;
            }

            // 1. Detect orphaned view_configs
            foreach ($viewConfigs as $viewId => $config) {
                $tableId = $config['table_id'] ?? $config['form_id'] ?? null;
                if ($tableId && !isset($existingIds[$tableId])) {
                    $orphanedViews[] = $viewId;
                    unset($viewConfigs[$viewId]);
                    $this->line("  [App: {$app->name}] Removing orphaned view '{$viewId}' → table '{$tableId}'");
                }
            }

            if (empty($orphanedViews)) {
                continue;
            }

            // 2. Remove matching navigation items
            if (is_array($navigation)) {
                $navigation = array_values(array_filter($navigation, function ($item) use ($orphanedViews) {
                    return !in_array($item['view_id'] ?? null, $orphanedViews);
                }));
            }

            $totalFixed++;

            if (!$isDryRun) {
                $app->update([
                    'view_configs' => empty($viewConfigs) ? new \stdClass : $viewConfigs,
                    'navigation' => $navigation,
                ]);
                Log::info("Cleaned orphaned views from App {$app->id}", ['views' => $orphanedViews]);
            }
        }

        $this->info($isDryRun
            ? "DRY RUN complete. {$totalFixed} app(s) would be fixed."
            : "Done. {$totalFixed} app(s) cleaned.");

        return Command::SUCCESS;
    }
}
