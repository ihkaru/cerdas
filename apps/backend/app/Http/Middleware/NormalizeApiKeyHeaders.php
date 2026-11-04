<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class NormalizeApiKeyHeaders
{
    /**
     * Normalize X-Api-Key and X-Super-Admin-Key into Bearer tokens for standard Sanctum guards,
     * and auto-resolve SuperAdmin if master key is matched.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-Api-Key') ?: $request->header('X-Super-Admin-Key') ?: $request->query('api_key');

        if ($apiKey) {
            $superadminKey = config('agent.superadmin_api_key') ?: env('SUPERADMIN_API_KEY');

            // 1. If matching superadmin master key, bind SuperAdmin user directly
            if (! empty($superadminKey) && hash_equals((string) $superadminKey, (string) $apiKey)) {
                $superAdmin = User::where('is_super_admin', true)->first() ?: User::first();
                if ($superAdmin) {
                    $request->setUserResolver(fn () => $superAdmin);
                    Auth::setUser($superAdmin);
                }
            }

            // 2. Normalize to standard Authorization: Bearer <key> for Sanctum
            if (! $request->header('Authorization')) {
                $request->headers->set('Authorization', 'Bearer '.$apiKey);
            }
        }

        return $next($request);
    }
}
