<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\App;
use App\Models\Assignment;
use App\Models\Response;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ResponseController extends Controller
{
    /**
     * Get responses for the Editor Monitoring Dashboard
     */
    public function indexForEditor(Request $request, string $id): JsonResponse
    {
        $app = \App\Models\App::findOrFail($id);
        
        // Scalability Optimization: Use table_id directly with whereIn instead of nested whereHas
        $tableIds = Table::where('app_id', $id)->pluck('id');

        $query = Assignment::query()
            ->with(['enumerator', 'responses', 'tableVersion.table'])
            ->whereIn('table_id', $tableIds);

        // Filter by specific Table ID if requested
        $tableIdFilter = $request->input('table_id');
        if ($tableIdFilter) {
            $query->where('table_id', $tableIdFilter);
        }

        // Search Filter (Search in prelist_data and enumerator name)
        $search = $request->input('search');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('prelist_data', 'like', "%{$search}%")
                  ->orWhereHas('enumerator', function($uQ) use ($search) {
                      $uQ->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Status Filter
        $status = $request->input('status');
        if ($status && $status !== 'all') {
            switch ($status) {
                case 'pending': // Review queue
                    $query->whereIn('status', ['submitted', 'completed']);
                    break;
                case 'approved': // Synced
                    $query->where('status', 'synced');
                    break;
                case 'rejected': // Returned
                    $query->where('status', 'rejected');
                    break;
                case 'in_progress':
                    $query->where('status', 'in_progress');
                    break;
                case 'assigned':
                    $query->where('status', 'assigned');
                    break;
            }
        }

        $assignments = $query->latest('updated_at')->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }

    /**
     * Approve a response (Complex Mode)
     */
    public function approve(Request $request, Response $response): JsonResponse
    {
        $user = $request->user();
        $assignment = $response->assignment;

        // Validation: Only supervisors/admins
        if ($assignment->supervisor_id !== $user->id && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized to approve'], 403);
        }

        $assignment->update(['status' => 'synced']);

        // TODO: Trigger Google Sheets Sync Job here

        Log::info('Response Approved', ['response_id' => $response->id, 'approved_by' => $user->id]);

        return response()->json([
            'success' => true,
            'message' => 'Response approved successfully',
            'status' => 'synced'
        ]);
    }

    /**
     * Reject a response (Complex Mode)
     */
    public function reject(Request $request, Response $response): JsonResponse
    {
        $user = $request->user();
        $assignment = $response->assignment;

        if ($assignment->supervisor_id !== $user->id && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized to reject'], 403);
        }

        $request->validate(['reason' => 'nullable|string']);

        // Move status to rejected so we can explicitly filter for it
        $assignment->update([
            'status' => 'rejected',
            'rejection_note' => $request->reason
        ]);

        Log::info('Response Rejected', ['response_id' => $response->id, 'rejected_by' => $user->id]);

        return response()->json([
            'success' => true,
            'message' => 'Response rejected and returned to enumerator',
            'status' => 'in_progress'
        ]);
    }

    /**
     * Get responses for the current user's assignments (Sync Pull/PWA)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Log request params for debugging
        Log::info('Fetching Responses', [
            'user_id' => $user->id,
            'params' => $request->all(),
        ]);

        $updatedSince = $request->input('updated_since');
        $serverTime = now()->toIso8601String();

        $query = Response::query();

        // If NOT Super Admin, restrict to own assignments
        // If NOT Super Admin, restrict to own assignments OR Simple Mode Apps
        if (!$user->isSuperAdmin()) {
            $query->whereHas('assignment', function ($q) use ($user) {
                $q->where('enumerator_id', $user->id)
                    ->orWhere('supervisor_id', $user->id)
                    ->orWhereHas('tableVersion.table.app', function ($appQ) {
                        $appQ->where('mode', 'simple');
                    });
            });
        }

        // Filter by Table ID (renamed from form_id)
        $tableId = $request->input('table_id');
        if ($tableId) {
            $query->whereHas('assignment.tableVersion', function ($q) use ($tableId) {
                $q->where('table_id', $tableId);
            });
        }

        if ($updatedSince) {
            $query->where('updated_at', '>=', \Carbon\Carbon::parse($updatedSince));
        }

        $responses = $query->get();

        Log::info('Responses Fetched', ['count' => $responses->count()]);

        return response()->json([
            'success' => true,
            'server_time' => $serverTime,
            'data' => $responses,
        ]);
    }

    /**
     * Store new responses (Sync Push)
     */
    private function handleBase64Images(array $data, string $assignmentId, string $userId): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->handleBase64Images($value, $assignmentId, $userId);
            } elseif (is_string($value) && preg_match('/^data:image\/(\w+);base64,/', $value, $matches)) {
                // Detected Base64 Image
                $extension = $matches[1];
                $imageData = substr($value, strpos($value, ',') + 1);
                $imageData = base64_decode($imageData);

                if ($imageData === false) {
                    continue; // Skip invalid base64
                }

                // Generate Path: responses/{assignment_id}/{user_id}/{timestamp}_{random}.ext
                $fileName = time().'_'.Str::random(10).'.'.$extension;
                $path = "responses/{$assignmentId}/{$userId}/{$fileName}";

                // Store to Disk (Public)
                \Illuminate\Support\Facades\Storage::disk('public')->put($path, $imageData);

                // Return the URL
                $url = \Illuminate\Support\Facades\Storage::url($path);

                $data[$key] = $url;
            }
        }

        return $data;
    }

    /**
     * Store new responses (Sync Push)
     */
    public function store(Request $request): JsonResponse
    {
        // Increase memory limit for this request to handle parsing
        ini_set('memory_limit', '512M');

        $validated = $request->validate([
            'responses' => 'required|array',
            'responses.*.local_id' => 'required|uuid',
            'responses.*.assignment_id' => 'required', // String (UUID) or Integer
            'responses.*.table_id' => 'nullable', // Needed for creation (ad-hoc)
            'responses.*.data' => 'required|array',
            'responses.*.created_at' => 'nullable|date',
            'responses.*.updated_at' => 'nullable|date',
            'responses.*.device_id' => 'nullable|string',
            'responses.*.submitted_version' => 'nullable|integer', // Form version used by client
        ]);

        $user = $request->user();
        $results = [];

        Log::info('Sync Push Started', [
            'user_id' => $user->id,
            'count' => count($validated['responses']),
        ]);

        Log::info('Sync Push Payload JSON', ['payload' => $validated['responses']]);

        DB::transaction(function () use ($validated, $user, &$results) {
            foreach ($validated['responses'] as $respData) {
                $assignmentInput = $respData['assignment_id'];

                Log::debug('Processing Item', ['local_id' => $respData['local_id'], 'assignment_input' => $assignmentInput]);

                $assignment = null;

                // 1. Try to find assignment
                if (is_numeric($assignmentInput)) {
                    $assignment = Assignment::find($assignmentInput);
                } elseif (Str::isUuid($assignmentInput)) {
                    // First try to find by id (primary key)
                    $assignment = Assignment::find($assignmentInput);

                    // If not found, try by external_id (for ad-hoc assignments created earlier)
                    if (!$assignment) {
                        $assignment = Assignment::where('external_id', $assignmentInput)->first();
                    }
                }
                // 2. Create if not found and is UUID (Self-Assignment)
                $newAssignmentId = null;
                if (!$assignment && Str::isUuid($assignmentInput) && !empty($respData['table_id'])) {
                    // Get latest version for this table
                    $table = Table::with('app')->find($respData['table_id']);

                    if ($table && $table->latestPublishedVersion) {
                        // Determine Supervisor: Try to find from AppMembership, else self
                        $supervisorId = $user->id; // Default fallback
                        $membership = $user->getMembershipForApp($table->app_id);
                        if ($membership && $membership->supervisor_id) {
                            $supervisorId = $membership->supervisor_id;
                        }

                        // Create Ad-hoc Assignment
                        $assignment = Assignment::create([
                            'table_id' => $table->id,
                            'table_version_id' => $table->latestPublishedVersion->id,
                            'organization_id' => $membership->organization_id ?? $user->appMemberships->first()?->organization_id,
                            'supervisor_id' => $supervisorId,
                            'enumerator_id' => $user->id,
                            'external_id' => $assignmentInput,
                            'status' => 'in_progress',
                            'prelist_data' => ['name' => 'Self Assignment '.now()->format('H:i')],
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $newAssignmentId = $assignment->id;
                        Log::info('Created Ad-Hoc Assignment', ['id' => $assignment->id]);
                    }
                }

                if (!$assignment) {
                    Log::warning('Assignment Not Found', ['input' => $assignmentInput]);
                    $results[] = [
                        'local_id' => $respData['local_id'],
                        'status' => 'error',
                        'message' => 'Assignment not found and could not be created',
                    ];

                    continue;
                }

                // Check permissions (User must be enumerator or supervisor)
                // OR if assignment is unassigned (enumerator_id is null) - Simple Mode Auto-Claim
                $isOwner = $assignment->enumerator_id === $user->id;
                $isSupervisor = $assignment->supervisor_id === $user->id;
                $isUnassigned = is_null($assignment->enumerator_id);

                // NEW: Allow access if App Mode is Simple (Shared Access)
                $isSimpleShared = false;
                $assignment->loadMissing('tableVersion.table.app');
                $app = $assignment->tableVersion->table->app ?? null;
                if ($app && $app->mode === 'simple') {
                    $isSimpleShared = true;
                }

                if (!$isSimpleShared && !$isOwner && !$isSupervisor && !$user->isSuperAdmin() && !$isUnassigned) {
                    Log::warning('Access Denied', ['user_id' => $user->id, 'assignment_id' => $assignment->id]);
                    $results[] = [
                        'local_id' => $respData['local_id'],
                        'status' => 'error',
                        'message' => 'Access denied',
                    ];

                    continue;
                }

                // If unassigned, claim it for the user
                if ($isUnassigned) {
                    $assignment->update(['enumerator_id' => $user->id]);
                    Log::info('Assignment Auto-Claimed via Sync', ['id' => $assignment->id, 'user_id' => $user->id]);
                }

                // ===== VERSION ENFORCEMENT =====
                $submittedVersion = $respData['submitted_version'] ?? null;
                $table = $assignment->tableVersion?->table ?? $assignment->table;
                $versionPolicy = $table?->settings['version_policy'] ?? 'accept_all';
                $currentVersion = $table?->current_version ?? 1;
                $isVersionMismatch = $submittedVersion && $submittedVersion < $currentVersion;

                if ($isVersionMismatch && $versionPolicy === 'require_update') {
                    Log::warning('Version Rejected', [
                        'local_id' => $respData['local_id'],
                        'submitted_version' => $submittedVersion,
                        'required_version' => $currentVersion,
                    ]);
                    $results[] = [
                        'local_id' => $respData['local_id'],
                        'status' => 'version_rejected',
                        'message' => "Version v{$submittedVersion} rejected. Minimum required: v{$currentVersion}. Please sync the latest form.",
                        'required_version' => $currentVersion,
                    ];

                    continue;
                }

                // ===== STRICT SCHEMA VALIDATION =====
                // When version_policy is 'strict', validate data against schema's required fields
                if ($versionPolicy === 'strict' && $submittedVersion) {
                    $schemaVersion = \App\Models\TableVersion::where('table_id', $table->id)
                        ->where('version', $submittedVersion)
                        ->published()
                        ->first();

                    if ($schemaVersion) {
                        $fields = $schemaVersion->getFields();
                        $requiredFields = collect($fields)
                            ->filter(fn ($f) => !empty($f['required']) || !empty($f['validation_rules']))
                            ->pluck('name')
                            ->filter()
                            ->toArray();

                        $missingFields = [];
                        foreach ($requiredFields as $fieldName) {
                            if (!isset($respData['data'][$fieldName]) || $respData['data'][$fieldName] === '' || $respData['data'][$fieldName] === null) {
                                $missingFields[] = $fieldName;
                            }
                        }

                        if (!empty($missingFields)) {
                            Log::warning('Strict Validation Failed', [
                                'local_id' => $respData['local_id'],
                                'missing_fields' => $missingFields,
                            ]);
                            $results[] = [
                                'local_id' => $respData['local_id'],
                                'status' => 'validation_failed',
                                'message' => 'Required fields are missing or empty.',
                                'missing_fields' => $missingFields,
                            ];

                            continue;
                        }
                    }
                }

                // Process Base64 Images -> Disk
                Log::debug('Processing Base64 Images', ['item_keys' => array_keys($respData['data'])]);

                $cleanData = $this->handleBase64Images(
                    $respData['data'],
                    (string) $assignment->id,
                    (string) $user->id
                );

                // Check if response already exists (idempotency by local_id)
                $existing = Response::where('local_id', $respData['local_id'])->first();

                if ($existing) {
                    // Check if update is needed (client timestamp is newer)
                    $clientTime = \Carbon\Carbon::parse($respData['updated_at'] ?? now());
                    $serverTime = $existing->updated_at;

                    if ($clientTime->greaterThan($serverTime)) {
                        $existing->update([
                            'data' => $cleanData,
                            'synced_at' => now(),
                            'updated_at' => $respData['updated_at'] ?? now(),
                        ]);
                        $response = $existing;
                        Log::info('Response Updated', [
                            'server_id' => $response->id,
                            'local_id' => $respData['local_id'],
                            'data_keys' => array_keys($cleanData),
                        ]);
                    } else {
                        // Client data is older or same, skip update but confirm sync
                        $response = $existing;
                        Log::info('Response Update Skipped (Older)', [
                            'server_id' => $response->id,
                            'client_time' => $clientTime,
                            'server_time' => $serverTime,
                        ]);
                    }
                } else {
                    $responsePayload = [
                        'assignment_id' => $assignment->id,
                        'local_id' => $respData['local_id'],
                        'data' => $cleanData,
                        'device_id' => $respData['device_id'] ?? null,
                        'synced_at' => now(),
                        'created_at' => $respData['created_at'] ?? now(),
                        'updated_at' => $respData['updated_at'] ?? now(),
                    ];

                    // Store submitted version for audit trail
                    if (isset($respData['submitted_version'])) {
                        $responsePayload['submitted_version'] = $respData['submitted_version'];
                    }

                    $response = Response::create($responsePayload);
                    Log::info('Response Created', [
                        'server_id' => $response->id,
                        'local_id' => $respData['local_id'],
                        'data_keys' => array_keys($cleanData),
                    ]);

                    if ($assignment->status === 'assigned') {
                        $assignment->update(['status' => 'in_progress']);
                    }
                }

                $resItem = [
                    'local_id' => $respData['local_id'],
                    'server_id' => $response->id,
                    'status' => 'success',
                    'synced_at' => $response->synced_at,
                ];

                // Flag version mismatch for 'warn' policy (data accepted but flagged)
                if ($isVersionMismatch && $versionPolicy === 'warn') {
                    $resItem['version_warning'] = "Submitted with v{$submittedVersion}, latest is v{$currentVersion}. Please update your form.";
                }

                if ($newAssignmentId) {
                    $resItem['new_assignment_id'] = $newAssignmentId; // Tell client to map
                }

                $results[] = $resItem;
            }
        });

        Log::info('Sync Push Response JSON', ['results' => $results]);

        return response()->json([
            'success' => true,
            'data' => $results,
            'message' => 'Sync processed',
        ]);
    }
}
