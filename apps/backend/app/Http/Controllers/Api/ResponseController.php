<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\Table;

class ResponseController extends Controller {
    /**
     * Get responses for the current user's assignments (Sync Pull)
     */
    public function index(Request $request): JsonResponse {
        $user = $request->user();

        // Log request params for debugging
        Log::info('Fetching Responses', [
            'user_id' => $user->id,
            'params' => $request->all()
        ]);

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

        $responses = $query->get();

        Log::info('Responses Fetched', ['count' => $responses->count()]);

        return response()->json([
            'success' => true,
            'data' => $responses,
        ]);
    }

    /**
     * Store new responses (Sync Push)
     */
    private function handleBase64Images(array $data, string $assignmentId, string $userId): array {
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
                $fileName = time() . '_' . Str::random(10) . '.' . $extension;
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
    public function store(Request $request): JsonResponse {
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
        ]);

        $user = $request->user();
        $results = [];

        Log::info('Sync Push Started', [
            'user_id' => $user->id,
            'count' => count($validated['responses'])
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
                            'prelist_data' => ['name' => 'Self Assignment ' . now()->format('H:i')],
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
                        'message' => 'Assignment not found and could not be created'
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
                        'message' => 'Access denied'
                    ];
                    continue;
                }

                // If unassigned, claim it for the user
                if ($isUnassigned) {
                    $assignment->update(['enumerator_id' => $user->id]);
                    Log::info('Assignment Auto-Claimed via Sync', ['id' => $assignment->id, 'user_id' => $user->id]);
                }

                // Process Base64 Images -> Disk
                Log::debug('Processing Base64 Images', ['item_keys' => array_keys($respData['data'])]);

                $cleanData = $this->handleBase64Images(
                    $respData['data'],
                    (string)$assignment->id,
                    (string)$user->id
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
                            'data_keys' => array_keys($cleanData)
                        ]);
                    } else {
                        // Client data is older or same, skip update but confirm sync
                        $response = $existing;
                        Log::info('Response Update Skipped (Older)', [
                            'server_id' => $response->id,
                            'client_time' => $clientTime,
                            'server_time' => $serverTime
                        ]);
                    }
                } else {
                    $response = Response::create([
                        'assignment_id' => $assignment->id,
                        'local_id' => $respData['local_id'],
                        'data' => $cleanData,
                        'device_id' => $respData['device_id'] ?? null,
                        'synced_at' => now(),
                        'created_at' => $respData['created_at'] ?? now(),
                        'updated_at' => $respData['updated_at'] ?? now(),
                    ]);
                    Log::info('Response Created', [
                        'server_id' => $response->id,
                        'local_id' => $respData['local_id'],
                        'data_keys' => array_keys($cleanData)
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
