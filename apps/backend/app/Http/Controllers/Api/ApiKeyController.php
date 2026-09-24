<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class ApiKeyController extends Controller
{
    /**
     * List all API keys belonging to the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tokens = $user->tokens()->orderBy('created_at', 'desc')->get();

        $keys = $tokens->map(function ($token) {
            $isLive = ! Str::contains($token->name, ['test', 'sandbox']);
            $prefix = $isLive ? 'crd_live_' : 'crd_test_';
            $maskedKey = $prefix.str_repeat('•', 16).substr($token->token, -4);

            $status = 'active';
            if ($token->expires_at && $token->expires_at->isPast()) {
                $status = 'expired';
            }

            return [
                'id' => (string) $token->id,
                'name' => $token->name,
                'keyPrefix' => $prefix,
                'maskedKey' => $maskedKey,
                'environment' => $isLive ? 'live' : 'test',
                'scopes' => $token->abilities ?? ['*'],
                'status' => $status,
                'expiresAt' => $token->expires_at ? $token->expires_at->toIso8601String() : null,
                'lastUsedAt' => $token->last_used_at ? $token->last_used_at->toIso8601String() : null,
                'totalRequests' => 0,
                'createdAt' => $token->created_at->toIso8601String(),
                'updatedAt' => $token->updated_at->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $keys,
        ]);
    }

    /**
     * Generate a new API Key conforming to 2026 industry standards
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'environment' => 'nullable|string|in:live,test',
            'scopes' => 'nullable|array',
            'scopes.*' => 'string',
            'expiresInDays' => 'nullable|integer|min:1|max:3650',
            'ipWhitelist' => 'nullable|array',
        ]);

        $user = $request->user();
        $environment = $validated['environment'] ?? 'live';
        $prefix = $environment === 'live' ? 'crd_live_' : 'crd_test_';
        $entropy = Str::random(32);
        $plainTextToken = $prefix.$entropy;

        $expiresAt = null;
        if (! empty($validated['expiresInDays'])) {
            $expiresAt = now()->addDays((int) $validated['expiresInDays']);
        }

        $scopes = $validated['scopes'] ?? ['*'];

        // Create token via Sanctum model
        $token = $user->tokens()->create([
            'name' => $validated['name'],
            'token' => hash('sha256', $plainTextToken),
            'abilities' => $scopes,
            'expires_at' => $expiresAt,
        ]);

        $maskedKey = $prefix.str_repeat('•', 16).substr($plainTextToken, -4);

        $apiKeyData = [
            'id' => (string) $token->id,
            'name' => $token->name,
            'keyPrefix' => $prefix,
            'maskedKey' => $maskedKey,
            'environment' => $environment,
            'scopes' => $scopes,
            'status' => 'active',
            'expiresAt' => $expiresAt ? $expiresAt->toIso8601String() : null,
            'lastUsedAt' => null,
            'totalRequests' => 0,
            'createdAt' => $token->created_at->toIso8601String(),
            'updatedAt' => $token->updated_at->toIso8601String(),
        ];

        return response()->json([
            'success' => true,
            'data' => $apiKeyData,
            'plainTextToken' => $plainTextToken, // Shown ONCE to user
        ], 201);
    }

    /**
     * Update an API Key (Name, Scopes, Status)
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $token = $user->tokens()->where('id', $id)->first();

        if (! $token) {
            return response()->json([
                'success' => false,
                'message' => 'API Key tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'scopes' => 'nullable|array',
            'scopes.*' => 'string',
            'status' => 'nullable|string|in:active,revoked',
        ]);

        if (isset($validated['name'])) {
            $token->name = $validated['name'];
        }

        if (isset($validated['scopes'])) {
            $token->abilities = $validated['scopes'];
        }

        if (isset($validated['status']) && $validated['status'] === 'revoked') {
            $token->expires_at = now()->subMinute();
        }

        $token->save();

        $isLive = ! Str::contains($token->name, ['test', 'sandbox']);
        $prefix = $isLive ? 'crd_live_' : 'crd_test_';
        $maskedKey = $prefix.str_repeat('•', 16).substr($token->token, -4);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $token->id,
                'name' => $token->name,
                'keyPrefix' => $prefix,
                'maskedKey' => $maskedKey,
                'environment' => $isLive ? 'live' : 'test',
                'scopes' => $token->abilities ?? ['*'],
                'status' => ($token->expires_at && $token->expires_at->isPast()) ? 'revoked' : 'active',
                'expiresAt' => $token->expires_at ? $token->expires_at->toIso8601String() : null,
                'lastUsedAt' => $token->last_used_at ? $token->last_used_at->toIso8601String() : null,
                'totalRequests' => 0,
                'createdAt' => $token->created_at->toIso8601String(),
                'updatedAt' => $token->updated_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Delete / permanently revoke an API Key
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $token = $user->tokens()->where('id', $id)->first();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'API Key berhasil dihapus.',
        ]);
    }

    /**
     * Restore an API Key for state rollback (Undo)
     */
    public function restore(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'id' => 'required',
            'name' => 'required|string',
            'scopes' => 'nullable|array',
            'expiresAt' => 'nullable|string',
        ]);

        $token = $user->tokens()->updateOrCreate(
            ['id' => $validated['id']],
            [
                'name' => $validated['name'],
                'abilities' => $validated['scopes'] ?? ['*'],
                'expires_at' => ! empty($validated['expiresAt']) ? now()->parse($validated['expiresAt']) : null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'API Key berhasil dipulihkan.',
            'data' => $token,
        ]);
    }
}
