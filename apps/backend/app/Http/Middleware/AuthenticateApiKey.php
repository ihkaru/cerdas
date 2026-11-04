<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiKey
{
    /**
     * Handle an incoming request via unified API Key authentication.
     * Supports:
     * 1. Super Admin Master Key (X-Super-Admin-Key / SUPERADMIN_API_KEY)
     * 2. Scoped Personal Access Tokens (crd_live_... / crd_test_...)
     * 3. Seamless header extraction: X-Api-Key, X-Super-Admin-Key, Authorization: Bearer, or ?api_key=
     */
    public function handle(Request $request, Closure $next): Response
    {
        $providedKey = $this->extractKey($request);

        if (empty($providedKey)) {
            // Check if already authenticated via Sanctum session/guard
            $user = $request->user();
            if ($user) {
                $this->auditIfMutating($request, $user, 'session');

                return $next($request);
            }

            return response()->json([
                'success' => false,
                'error' => 'unauthenticated',
                'message' => 'Missing API Key. Provide via X-Api-Key, X-Super-Admin-Key, or Authorization: Bearer <key>.',
            ], 401);
        }

        $superadminKey = config('agent.superadmin_api_key') ?: env('SUPERADMIN_API_KEY');
        $actingUser = null;
        $authType = null;

        // 1. Check Super Admin Master Key
        if (! empty($superadminKey) && hash_equals((string) $superadminKey, (string) $providedKey)) {
            $actingUser = User::where('is_super_admin', true)->first() ?: User::first();
            $authType = 'superadmin_key';
        }

        // 2. Check Sanctum Personal Access Token (SHA-256 Hash)
        if (! $actingUser) {
            $hashed = hash('sha256', $providedKey);
            $tokenModel = PersonalAccessToken::where('token', $hashed)->first();

            if ($tokenModel) {
                if ($tokenModel->expires_at && $tokenModel->expires_at->isPast()) {
                    return response()->json([
                        'success' => false,
                        'error' => 'token_expired',
                        'message' => 'The provided API Key has expired.',
                    ], 401);
                }

                $tokenModel->forceFill(['last_used_at' => now()])->save();
                $actingUser = $tokenModel->tokenable;
                $authType = 'api_key';
            }
        }

        if (! $actingUser) {
            return response()->json([
                'success' => false,
                'error' => 'invalid_api_key',
                'message' => 'Unauthorized: Invalid or expired API Key.',
            ], 401);
        }

        // Bind user to request and Auth facade
        $request->setUserResolver(fn () => $actingUser);
        Auth::setUser($actingUser);

        // Record mutation audit log
        $this->auditIfMutating($request, $actingUser, $authType);

        return $next($request);
    }

    private function extractKey(Request $request): ?string
    {
        if ($k = $request->header('X-Api-Key')) {
            return trim($k);
        }
        if ($k = $request->header('X-Super-Admin-Key')) {
            return trim($k);
        }
        $authHeader = $request->header('Authorization');
        if ($authHeader && preg_match('/^Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return trim($matches[1]);
        }
        if ($k = $request->query('api_key')) {
            return trim($k);
        }

        return null;
    }

    private function auditIfMutating(Request $request, User $user, string $authType): void
    {
        $method = strtoupper($request->method());
        if (! in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return;
        }

        $action = $this->determineAction($method, $request->path());

        // 1. Structured log entry
        Log::info('[AUDIT_MUTATION]', [
            'action' => $action,
            'actor_id' => $user->id,
            'actor_email' => $user->email,
            'auth_type' => $authType,
            'method' => $method,
            'path' => $request->path(),
            'ip' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
        ]);

        // 2. Persist to AuditLog table if present
        try {
            if (Schema::hasTable('audit_logs')) {
                AuditLog::create([
                    'actor_type' => $authType,
                    'actor_id' => $user->id,
                    'actor_email' => $user->email,
                    'action' => $action,
                    'auditable_type' => $this->resolveAuditableType($request->path()),
                    'auditable_id' => $this->resolveAuditableId($request),
                    'ip_address' => $request->ip(),
                    'user_agent' => substr((string) $request->userAgent(), 0, 500),
                    'payload' => $this->sanitizePayload($request->except(['password', 'password_confirmation', 'token', 'key'])),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('[AUDIT_LOG_PERSIST_ERROR] '.$e->getMessage());
        }
    }

    private function determineAction(string $method, string $path): string
    {
        if (str_contains($path, 'import-json') || str_contains($path, 'prelist')) {
            return 'PRELIST_MUTATION';
        }
        if (str_contains($path, 'assignments')) {
            return match ($method) {
                'POST' => 'ASSIGNMENT_CREATE',
                'PUT', 'PATCH' => 'ASSIGNMENT_UPDATE',
                'DELETE' => 'ASSIGNMENT_DELETE',
                default => 'ASSIGNMENT_MUTATION',
            };
        }
        if (str_contains($path, 'apps')) {
            return match ($method) {
                'POST' => 'APP_CREATE',
                'PUT', 'PATCH' => 'APP_UPDATE',
                'DELETE' => 'APP_DELETE',
                default => 'APP_MUTATION',
            };
        }
        if (str_contains($path, 'tables')) {
            return match ($method) {
                'POST' => 'TABLE_CREATE',
                'PUT', 'PATCH' => 'TABLE_UPDATE',
                'DELETE' => 'TABLE_DELETE',
                default => 'TABLE_MUTATION',
            };
        }
        if (str_contains($path, 'approve')) {
            return 'RESPONSE_APPROVE';
        }
        if (str_contains($path, 'reject')) {
            return 'RESPONSE_REJECT';
        }
        if (str_contains($path, 'sync')) {
            return 'RESPONSE_SYNC';
        }

        return "{$method}_".$this->sanitizePathForAction($path);
    }

    private function sanitizePathForAction(string $path): string
    {
        $clean = preg_replace('/[0-9a-fA-F-]{36}/', '{id}', $path);
        $clean = preg_replace('/[^a-zA-Z0-9_{}]/', '_', $clean);

        return strtoupper(trim($clean, '_'));
    }

    private function resolveAuditableType(string $path): ?string
    {
        if (str_contains($path, 'assignments')) {
            return \App\Models\Assignment::class;
        }
        if (str_contains($path, 'apps')) {
            return \App\Models\App::class;
        }
        if (str_contains($path, 'tables')) {
            return \App\Models\Table::class;
        }
        if (str_contains($path, 'submissions') || str_contains($path, 'responses')) {
            return \App\Models\Response::class;
        }

        return null;
    }

    private function resolveAuditableId(Request $request): ?string
    {
        // Try route parameters or direct UUIDs in URL
        foreach ($request->route()?->parameters() ?? [] as $param) {
            if (is_string($param) && strlen($param) === 36) {
                return $param;
            }
            if (is_object($param) && isset($param->id)) {
                return (string) $param->id;
            }
        }

        return $request->input('id') ?: $request->input('assignment_id') ?: $request->input('app_id') ?: null;
    }

    private function sanitizePayload(array $payload): array
    {
        // Flatten / truncate large datasets to avoid DB bloat
        if (isset($payload['rows']) && is_array($payload['rows'])) {
            $count = count($payload['rows']);
            $payload['rows_count'] = $count;
            $payload['rows_sample'] = array_slice($payload['rows'], 0, 3);
            unset($payload['rows']);
        }

        return $payload;
    }
}
