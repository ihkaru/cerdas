<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateSuperAdminApiKey
{
    /**
     * Handle an incoming request authenticated via Super Admin Master API Key.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $configuredKey = config('agent.superadmin_api_key') ?: env('SUPERADMIN_API_KEY');

        if (empty($configuredKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Agentic REST API is disabled. SUPERADMIN_API_KEY is not configured on this server.',
            ], 401);
        }

        // 1. Extract API Key from header or query param
        $providedKey = $request->header('X-Super-Admin-Key');

        if (! $providedKey) {
            $authHeader = $request->header('Authorization');
            if ($authHeader && preg_match('/^Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $providedKey = trim($matches[1]);
            }
        }

        if (! $providedKey) {
            $providedKey = $request->query('api_key');
        }

        if (! $providedKey || ! hash_equals((string) $configuredKey, (string) $providedKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid or missing Super Admin API Key.',
            ], 401);
        }

        // 2. Resolve Super Admin User for context binding (events, observers, scopes)
        $superAdmin = User::where('is_super_admin', true)->first() ?: User::first();

        if ($superAdmin) {
            $request->setUserResolver(fn () => $superAdmin);
            Auth::setUser($superAdmin);
        }

        // 3. Log agent access for security audit trail
        if (config('agent.audit_log', true)) {
            Log::info('[AGENT_REQUEST]', [
                'ip' => $request->ip(),
                'method' => $request->method(),
                'path' => $request->path(),
                'acting_user' => $superAdmin?->email ?? 'none',
            ]);
        }

        return $next($request);
    }
}
