<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleOptionsGracefully
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Fix for PHP-CGI Windows empty echo crash on 204 responses
        if ($request->isMethod('OPTIONS') && $response->getStatusCode() === 204) {
            $response->sendHeaders();

            if (\function_exists('fastcgi_finish_request')) {
                fastcgi_finish_request();
            } else {
                while (ob_get_level() > 0) {
                    ob_end_flush();
                }
                flush();
            }

            exit; // Bypass Symfony send() that echoes an empty string and drops FastCGI connection
        }

        return $response;
    }
}
