<?php

namespace App\Jobs;

use App\Actions\GoogleSheet\ReconcileGoogleSheetHeadersAction;
use App\Models\Table;
use App\Models\TableVersion;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * GoogleSheetReconcileHeadersJob
 *
 * Asynchronous job to reconcile Google Sheet Row 1 headers with the
 * Cerdas TableVersion field definitions upon publish or schema modification.
 */
class GoogleSheetReconcileHeadersJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(
        private readonly string $tableId,
        private readonly ?int $versionNumber = null
    ) {
        $this->onQueue('sheets-batch');
    }

    public function handle(ReconcileGoogleSheetHeadersAction $action): void
    {
        /** @var Table|null $table */
        $table = Table::with(['app', 'versions'])->find($this->tableId);

        if (! $table || $table->source_type !== 'google_sheets') {
            return;
        }

        $version = null;
        if ($this->versionNumber !== null) {
            $version = $table->versions()->where('version', $this->versionNumber)->first();
        }

        try {
            $result = $action->execute($table, $version);
            Log::info('GoogleSheetReconcileHeadersJob: executed successfully', [
                'table_id' => $this->tableId,
                'version' => $this->versionNumber,
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('GoogleSheetReconcileHeadersJob: failed', [
                'table_id' => $this->tableId,
                'version' => $this->versionNumber,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
