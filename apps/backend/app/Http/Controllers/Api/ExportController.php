<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessAsyncExport;
use App\Models\ExportJob;
use App\Models\Response;
use App\Models\Table;
use App\Models\TableVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * ExportController — Schema-Aware Response Export via Native Browser Stream
 */
class ExportController extends Controller
{
    /**
     * Step 1: Request an async export (Queue-based). Avoids timeouts for 300k+ rows.
     */
    public function requestAsync(Request $request, Table $table): JsonResponse
    {
        $requestedVersion = $request->input('version');
        if (!$requestedVersion || $requestedVersion === 'current') {
            $requestedVersion = $table->current_version;
        }

        // Basic verification if version exists
        if (!TableVersion::where('table_id', $table->id)->where('version', $requestedVersion)->exists()) {
            return response()->json([
                'success' => false,
                'message' => "Schema version {$requestedVersion} not found for this table.",
            ], 404);
        }

        $job = ExportJob::create([
            'table_id' => $table->id,
            'user_id' => $request->user()->id,
            'version' => $requestedVersion,
            'status' => 'pending'
        ]);

        // Dispatch the queue
        ProcessAsyncExport::dispatch($job);

        return response()->json([
            'success' => true,
            'job_id' => $job->id,
            'status' => 'pending',
            'message' => 'Export job has been queued.'
        ]);
    }

    /**
     * Step 2: Poll status of export job.
     */
    public function checkStatus(Request $request, Table $table, ExportJob $job): JsonResponse
    {
        // Simple authorization check
        if ($job->user_id !== $request->user()->id && !$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'job_id' => $job->id,
            'status' => $job->status,
            'total_rows' => $job->total_rows,
            'error_message' => $job->error_message
        ]);
    }

    /**
     * Step 3: Download the physical file once completed.
     */
    public function downloadAsync(Request $request, Table $table, ExportJob $job): StreamedResponse|BinaryFileResponse|JsonResponse 
    {
        // Auth check
        if ($job->user_id !== $request->user()->id && !$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($job->status !== 'completed' || !$job->file_path || !Storage::exists($job->file_path)) {
            return response()->json(['message' => 'File not ready or expired.'], 404);
        }

        $fileName = "Export_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $table->name) . ".csv";
        $filePath = Storage::path($job->file_path);
        $fileSize = Storage::size($job->file_path);

        return response()->download($filePath, $fileName, [
            "Content-Type" => "text/csv; charset=UTF-8",
            "Content-Length" => $fileSize,
            "Content-Disposition" => "attachment; filename=\"$fileName\"",
            "Access-Control-Expose-Headers" => "Content-Disposition, Content-Length",
        ]);
    }

    /**
     * Step 3.1 (2026 Best Practice): Generate a signed URL for direct browser download.
     */
    public function getDownloadUrl(Request $request, Table $table, ExportJob $job): JsonResponse
    {
        // Auth check
        if ($job->user_id !== $request->user()->id && !$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($job->status !== 'completed' || !$job->file_path || !Storage::exists($job->file_path)) {
            return response()->json(['message' => 'File not ready or expired.'], 404);
        }

        // 2026 Best Practice: Relative Signed URL
        // By setting absolute to false, we sign only the path and query string.
        // This is host-agnostic and solves all localhost vs 127.0.0.1 mismatch issues.
        $url = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'table.export.download.raw',
            now()->addMinutes(5),
            ['table' => $table->id, 'job' => $job->id],
            false // Absolute: false
        );

        return response()->json([
            'success' => true,
            'download_url' => $url
        ]);
    }

    /**
     * Step 3.2 (2026 Best Practice): Stream the raw file using a verified signature.
     * Accessible without Bearer token (HSTS/Secure-context compatible).
     */
    public function downloadRaw(Request $request, Table $table, ExportJob $job): BinaryFileResponse|JsonResponse
    {
        // 2026 Security Standard: Manual Relative Signature Validation
        // We use relative validation (false) to be immune to host/protocol mismatches.
        if (! $request->hasValidSignature(false)) {
            abort(403, 'Tanda tangan digital tidak valid atau kedaluwarsa.');
        }
        
        if ($job->status !== 'completed' || !$job->file_path || !Storage::exists($job->file_path)) {
            return response()->json(['message' => 'File not ready or expired.'], 404);
        }

        $fileName = "Export_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $table->name) . ".csv";
        $filePath = Storage::path($job->file_path);
        
        return response()->download($filePath, $fileName, [
            "Content-Type" => "text/csv; charset=UTF-8",
        ]);
    }
}
