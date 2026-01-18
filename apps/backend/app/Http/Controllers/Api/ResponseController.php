<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResponseController extends Controller {
    /**
     * Get responses for the current user's assignments (Sync Pull)
     */
    public function index(Request $request): JsonResponse {
        $user = $request->user();

        // Log request params for debugging
        \Illuminate\Support\Facades\Log::info('Fetching Responses', [
            'user_id' => $user->id,
            'params' => $request->all()
        ]);

        $query = Response::query();

        // If NOT Super Admin, restrict to own assignments
        if (!$user->isSuperAdmin()) {
            $query->whereHas('assignment', function ($q) use ($user) {
                $q->where('enumerator_id', $user->id)
                    ->orWhere('supervisor_id', $user->id);
            });
        }

        // Filter by Form ID (app_schema_id or form_id)
        $formId = $request->input('app_schema_id') ?? $request->input('form_id');
        if ($formId) {
            $query->whereHas('assignment.formVersion', function ($q) use ($formId) {
                $q->where('form_id', $formId);
            });
        }

        $responses = $query->get();

        \Illuminate\Support\Facades\Log::info('Responses Fetched', ['count' => $responses->count()]);

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
                $fileName = time() . '_' . \Illuminate\Support\Str::random(10) . '.' . $extension;
                $path = "responses/{$assignmentId}/{$userId}/{$fileName}";

                // Store to Disk (Public)
                \Illuminate\Support\Facades\Storage::disk('public')->put($path, $imageData);

                // Return the URL (or relative path if preferred)
                // Storing full URL for easier client consumption for now, or relative path which is cleaner
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
            'responses.*.app_schema_id' => 'nullable', // Needed for creation
            'responses.*.data' => 'required|array',
            'responses.*.created_at' => 'nullable|date',
            'responses.*.updated_at' => 'nullable|date',
            'responses.*.device_id' => 'nullable|string',
        ]);

        $user = $request->user();
        $results = [];

        \Illuminate\Support\Facades\Log::info('Sync Push Started', [
            'user_id' => $user->id,
            'count' => count($validated['responses'])
        ]);

        // Added Log as requested
        \Illuminate\Support\Facades\Log::info('Sync Push Payload JSON', ['payload' => $validated['responses']]);

        DB::transaction(function () use ($validated, $user, &$results) {
            foreach ($validated['responses'] as $respData) {
                $assignmentInput = $respData['assignment_id'];

                \Illuminate\Support\Facades\Log::debug('Processing Item', ['local_id' => $respData['local_id'], 'assignment_input' => $assignmentInput]);

                $assignment = null;

                // 1. Try to find assignment
                if (is_numeric($assignmentInput)) {
                    $assignment = Assignment::find($assignmentInput);
                } elseif (\Illuminate\Support\Str::isUuid($assignmentInput)) {
                    $assignment = Assignment::where('external_id', $assignmentInput)->first();
                }

                // 2. Create if not found and is UUID (Self-Assignment)
                $newAssignmentId = null;
                if (!$assignment && \Illuminate\Support\Str::isUuid($assignmentInput) && !empty($respData['app_schema_id'])) {
                    // Get latest version for this schema
                    // Note: We assume the user is using the latest published version or we find one
                    $form = \App\Models\Form::with('app')->find($respData['app_schema_id']);

                    if ($form && $form->latestPublishedVersion) {
                        // Determine Supervisor: Try to find from AppMembership, else self
                        $supervisorId = $user->id; // Default fallback
                        $membership = $user->getMembershipForApp($form->app_id);
                        if ($membership && $membership->supervisor_id) {
                            $supervisorId = $membership->supervisor_id;
                        }

                        // Create Ad-hoc Assignment
                        $assignment = Assignment::create([
                            'form_version_id' => $form->latestPublishedVersion->id,
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
                        \Illuminate\Support\Facades\Log::info('Created Ad-Hoc Assignment', ['id' => $assignment->id]);
                    }
                }

                if (!$assignment) {
                    \Illuminate\Support\Facades\Log::warning('Assignment Not Found', ['input' => $assignmentInput]);
                    $results[] = [
                        'local_id' => $respData['local_id'],
                        'status' => 'error',
                        'message' => 'Assignment not found and could not be created'
                    ];
                    continue;
                }

                // Check permissions (User must be enumerator or supervisor)
                if (
                    $assignment->enumerator_id !== $user->id &&
                    $assignment->supervisor_id !== $user->id &&
                    !$user->isSuperAdmin()
                ) {
                    \Illuminate\Support\Facades\Log::warning('Access Denied', ['user_id' => $user->id, 'assignment_id' => $assignment->id]);
                    $results[] = [
                        'local_id' => $respData['local_id'],
                        'status' => 'error',
                        'message' => 'Access denied'
                    ];
                    continue;
                }

                // Process Base64 Images -> Disk
                \Illuminate\Support\Facades\Log::debug('Processing Base64 Images', ['item_keys' => array_keys($respData['data'])]);

                $cleanData = $this->handleBase64Images(
                    $respData['data'],
                    (string)$assignment->id,
                    (string)$user->id
                );

                // Compare keys to see if images were transformed
                $originalKeys = array_keys($respData['data']);
                $cleanKeys = array_keys($cleanData);
                // Simple check: if values changed from long string to short URL

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
                        \Illuminate\Support\Facades\Log::info('Response Updated', [
                            'server_id' => $response->id,
                            'local_id' => $respData['local_id'],
                            'data_keys' => array_keys($cleanData)
                        ]);
                    } else {
                        // Client data is older or same, skip update but confirm sync
                        $response = $existing;
                        \Illuminate\Support\Facades\Log::info('Response Update Skipped (Older)', [
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
                    \Illuminate\Support\Facades\Log::info('Response Created', [
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

        // Added Log as requested
        \Illuminate\Support\Facades\Log::info('Sync Push Response JSON', ['results' => $results]);

        return response()->json([
            'success' => true,
            'data' => $results,
            'message' => 'Sync processed',
        ]);
    }
}
