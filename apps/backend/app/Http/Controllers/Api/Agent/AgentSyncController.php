<?php

namespace App\Http\Controllers\Api\Agent;

use App\Actions\GoogleSheet\ReconcileGoogleSheetHeadersAction;
use App\Http\Controllers\Controller;
use App\Jobs\GoogleSheetBatchFlushJob;
use App\Jobs\GoogleSheetEnqueueRowJob;
use App\Models\PendingSheetRow;
use App\Models\Response as SurveyResponse;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AgentSyncController extends Controller
{
    /**
     * Inspect Google Sheets staging queue (pending_sheet_rows).
     *
     * GET /api/agent/v1/sync/queue
     */
    public function queue(Request $request): JsonResponse
    {
        $query = PendingSheetRow::query();

        if ($request->filled('app_id')) {
            $query->where('app_id', $request->input('app_id'));
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->input('table_id'));
        }

        if ($request->filled('spreadsheet_id')) {
            $query->where('spreadsheet_id', $request->input('spreadsheet_id'));
        }

        if ($request->filled('operation')) {
            $query->where('operation', $request->input('operation'));
        }

        $totalPending = $query->count();
        $limit = min((int) $request->input('limit', 50), 200);
        $rows = $query->orderBy('id', 'asc')->limit($limit)->get();

        return response()->json([
            'success' => true,
            'total_pending' => $totalPending,
            'retrieved_count' => $rows->count(),
            'data' => $rows,
        ]);
    }

    /**
     * Force immediate flush of pending staging rows to Google Sheets.
     *
     * POST /api/agent/v1/sync/flush
     */
    public function flush(Request $request): JsonResponse
    {
        $pendingCountBefore = PendingSheetRow::count();

        // Dispatch batch flush job immediately
        dispatch(new GoogleSheetBatchFlushJob());

        Log::info('[AGENT_ACTION] Manual Google Sheet batch flush dispatched by Agent', [
            'pending_rows_before' => $pendingCountBefore,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'GoogleSheetBatchFlushJob dispatched successfully.',
            'pending_rows_before' => $pendingCountBefore,
        ]);
    }

    /**
     * Re-enqueue a specific submission to Google Sheets sync.
     *
     * POST /api/agent/v1/submissions/{response}/re-sync
     */
    public function reSyncSubmission(Request $request, string $responseId): JsonResponse
    {
        $response = SurveyResponse::findOrFail($responseId);

        // Enqueue upsert operation
        GoogleSheetEnqueueRowJob::dispatch($response->id, 'upsert');

        Log::info('[AGENT_ACTION] Re-enqueued submission to Google Sheet sync', [
            'response_id' => $response->id,
            'assignment_id' => $response->assignment_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Submission {$response->id} successfully re-enqueued for Google Sheets sync.",
        ]);
    }

    /**
     * Force header reconciliation on a connected Google Sheet table.
     *
     * POST /api/agent/v1/tables/{table}/reconcile-headers
     */
    public function reconcileHeaders(
        Request $request,
        string $tableId,
        ReconcileGoogleSheetHeadersAction $reconcileAction
    ): JsonResponse {
        $table = Table::findOrFail($tableId);

        if ($table->source_type !== 'google_sheets') {
            return response()->json([
                'success' => false,
                'message' => 'Table is not configured with source_type: google_sheets',
            ], 422);
        }

        $result = $reconcileAction->execute($table);

        Log::info('[AGENT_ACTION] Reconciled Google Sheet headers', [
            'table_id' => $table->id,
            'result' => $result,
        ]);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'root_headers' => $result['root_headers'],
            'nested_headers' => $result['nested_headers'],
        ]);
    }
}
