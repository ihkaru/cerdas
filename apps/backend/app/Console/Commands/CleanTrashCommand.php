<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CleanTrashCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:clean-trash {--days=30 : The number of days to keep trashed items before permanent deletion}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete Data Sources (Tables) and their Assignments that have been in the trash for longer than the specified days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        $cutoffDate = now()->subDays($days);

        $this->info("Looking for Tables soft-deleted before {$cutoffDate->toDateString()}...");

        $trashedTables = \App\Models\Table::onlyTrashed()
            ->where('deleted_at', '<', $cutoffDate)
            ->get();

        if ($trashedTables->isEmpty()) {
            $this->info('No data sources to permanently delete.');

            return;
        }

        $count = $trashedTables->count();
        $this->warn("Found {$count} data sources. Proceeding with permanent deletion.");

        foreach ($trashedTables as $table) {
            // Force delete related records first based on table_id
            $deletedRecords = \App\Models\AppRecord::onlyTrashed()->where('table_id', $table->id)->forceDelete();
            $deletedAssignments = \App\Models\Assignment::onlyTrashed()->where('table_id', $table->id)->forceDelete();

            $table->forceDelete();
            $this->line("Permanently deleted Table ID: {$table->id} along with {$deletedAssignments} assignments.");
        }

        $this->info('Trash cleanup complete.');
    }
}
