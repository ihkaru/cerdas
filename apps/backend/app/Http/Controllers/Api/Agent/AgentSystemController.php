<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Models\PendingSheetRow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AgentSystemController extends Controller
{
    /**
     * Get system telemetry, queue sizes, database health, and server environment.
     *
     * GET /api/agent/v1/system/health
     */
    public function health(Request $request): JsonResponse
    {
        // 1. Check Database
        $dbStatus = 'healthy';
        $dbError = null;
        $dbLatencyMs = null;

        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $dbLatencyMs = round((microtime(true) - $start) * 1000, 2);
        } catch (\Throwable $e) {
            $dbStatus = 'error';
            $dbError = $e->getMessage();
        }

        // 2. Queue & Sync Metrics
        $pendingSheetRowsCount = PendingSheetRow::count();
        $failedJobsCount = 0;
        $queuedJobsCount = 0;

        if (Schema::hasTable('failed_jobs')) {
            $failedJobsCount = DB::table('failed_jobs')->count();
        }

        if (Schema::hasTable('jobs')) {
            $queuedJobsCount = DB::table('jobs')->count();
        }

        // 3. Storage check
        $storageWritable = is_writable(storage_path());

        return response()->json([
            'success' => true,
            'status' => ($dbStatus === 'healthy' && $failedJobsCount === 0) ? 'healthy' : 'attention_required',
            'timestamp' => now()->toIso8601String(),
            'telemetry' => [
                'database' => [
                    'status' => $dbStatus,
                    'latency_ms' => $dbLatencyMs,
                    'connection' => config('database.default'),
                    'error' => $dbError,
                ],
                'queues' => [
                    'pending_sheet_rows' => $pendingSheetRowsCount,
                    'queued_jobs' => $queuedJobsCount,
                    'failed_jobs' => $failedJobsCount,
                    'driver' => config('queue.default'),
                ],
                'storage' => [
                    'storage_path_writable' => $storageWritable,
                ],
                'environment' => [
                    'app_env' => config('app.env'),
                    'app_debug' => config('app.debug'),
                    'php_version' => PHP_VERSION,
                    'laravel_version' => app()->version(),
                    'timezone' => config('app.timezone'),
                ],
            ],
        ]);
    }

    /**
     * Inspect recent failed queue jobs.
     *
     * GET /api/agent/v1/system/failed-jobs
     */
    public function failedJobs(Request $request): JsonResponse
    {
        if (! Schema::hasTable('failed_jobs')) {
            return response()->json([
                'success' => true,
                'total' => 0,
                'data' => [],
            ]);
        }

        $limit = min((int) $request->input('limit', 20), 100);
        $failed = DB::table('failed_jobs')
            ->orderByDesc('failed_at')
            ->limit($limit)
            ->get()
            ->map(function ($job) {
                return [
                    'id' => $job->id,
                    'uuid' => $job->uuid ?? null,
                    'connection' => $job->connection,
                    'queue' => $job->queue,
                    'failed_at' => $job->failed_at,
                    'exception_preview' => substr($job->exception, 0, 500),
                    'payload_name' => json_decode($job->payload, true)['displayName'] ?? 'Unknown',
                ];
            });

        return response()->json([
            'success' => true,
            'total' => DB::table('failed_jobs')->count(),
            'retrieved' => $failed->count(),
            'data' => $failed,
        ]);
    }

    /**
     * Retry a failed queue job by ID or retry all.
     *
     * POST /api/agent/v1/system/failed-jobs/retry
     */
    public function retryFailedJob(Request $request): JsonResponse
    {
        $id = $request->input('id', 'all');

        if ($id === 'all') {
            Artisan::call('queue:retry', ['id' => ['all']]);
        } else {
            Artisan::call('queue:retry', ['id' => [(string) $id]]);
        }

        $output = Artisan::output();

        Log::info('[AGENT_ACTION] Queue retry triggered by Agent', [
            'target_id' => $id,
            'output' => $output,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Queue retry executed',
            'output' => trim($output),
        ]);
    }
}
