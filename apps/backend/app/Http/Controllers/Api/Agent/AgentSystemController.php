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

    /**
     * Inspect immutable audit logs with filtering by action, actor, and date.
     *
     * GET /api/agent/v1/audit/logs
     */
    public function auditLogs(Request $request): JsonResponse
    {
        if (! Schema::hasTable('audit_logs')) {
            return response()->json([
                'success' => true,
                'total' => 0,
                'data' => [],
            ]);
        }

        $query = \App\Models\AuditLog::query()->orderByDesc('created_at');

        if ($action = $request->input('action')) {
            $query->where('action', 'like', "%{$action}%");
        }
        if ($actorEmail = $request->input('actor_email')) {
            $query->where('actor_email', 'like', "%{$actorEmail}%");
        }
        if ($dateFrom = $request->input('date_from')) {
            $query->where('created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->where('created_at', '<=', $dateTo);
        }

        $limit = min((int) $request->input('limit', 50), 200);
        $logs = $query->paginate($limit);

        return response()->json([
            'success' => true,
            'total' => $logs->total(),
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
            ],
        ]);
    }

    /**
     * Expose the canonical Cerdas Orchestrator Agent Skill directives (Single Source of Truth).
     *
     * GET /api/agent/v1/skill
     * GET /skill.md
     */
    public function skill(Request $request): \Illuminate\Http\Response|JsonResponse
    {
        $candidatePaths = [
            base_path('resources/skills/cerdas-orchestrator/SKILL.md'),
            base_path('.agents/skills/cerdas-orchestrator/SKILL.md'),
            base_path('.agent/skills/cerdas-orchestrator/SKILL.md'),
            dirname(base_path()).'/.agents/skills/cerdas-orchestrator/SKILL.md',
            dirname(base_path()).'/.agent/skills/cerdas-orchestrator/SKILL.md',
        ];

        $skillPath = null;
        foreach ($candidatePaths as $path) {
            if (file_exists($path) && is_readable($path)) {
                $skillPath = $path;
                break;
            }
        }

        if (! $skillPath) {
            return response()->json([
                'success' => false,
                'message' => 'Skill documentation file not found on server.',
            ], 404);
        }

        $rawContent = file_get_contents($skillPath);

        // Check if raw markdown format requested
        $format = $request->query('format');
        $accept = $request->header('Accept', '');

        if ($format === 'raw' || $format === 'markdown' || str_contains($accept, 'text/markdown') || $request->is('*.md')) {
            return response($rawContent, 200, [
                'Content-Type' => 'text/markdown; charset=UTF-8',
                'X-Skill-Name' => 'cerdas-orchestrator',
                'X-Skill-Source' => 'Single Source of Truth (SKILL.md)',
            ]);
        }

        // Parse frontmatter
        $frontmatter = [];
        $body = $rawContent;
        if (str_starts_with(trim($rawContent), '---')) {
            $parts = explode('---', $rawContent, 3);
            if (count($parts) >= 3) {
                $lines = explode("\n", trim($parts[1]));
                foreach ($lines as $line) {
                    if (str_contains($line, ':')) {
                        [$k, $v] = explode(':', $line, 2);
                        $frontmatter[trim($k)] = trim($v);
                    }
                }
                $body = trim($parts[2]);
            }
        }

        return response()->json([
            'success' => true,
            'name' => $frontmatter['name'] ?? 'cerdas-orchestrator',
            'version' => $frontmatter['version'] ?? '1.0.0',
            'description' => $frontmatter['description'] ?? 'Cerdas Autonomous Orchestration Engine',
            'display_title' => 'Cerdas GSBPM Survey & Field Data Orchestrator',
            'category' => 'survey-statistics',
            'body' => $body,
            'raw' => $rawContent,
            'source_path' => basename($skillPath),
        ]);
    }
}
