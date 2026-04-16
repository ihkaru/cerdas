<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | PRODUCTION (Coolify): Set the CORS_ALLOWED_ORIGINS env var to:
    |   https://app.dvlpid.my.id,https://editor.dvlpid.my.id,capacitor://localhost
    |
    | IMPORTANT: Only Laravel should handle CORS headers. Ensure Traefik/Coolify
    | does NOT add its own CORS headers, or browsers will see duplicates and
    | reject the request.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'broadcasting/auth',
    ],
    'allowed_methods' => ['*'],

    'allowed_origins' => (function () {
        // 1. Safety Defaults (Always allowed in production)
        $safetyDefaults = [
            'https://app.dvlpid.my.id',
            'https://editor.dvlpid.my.id',
            'capacitor://localhost',
        ];

        // 2. Local/ENV Origins
        $envOrigins = array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', '')));

        // 3. Built-in Local Defaults (if ENV is empty)
        $localDefaults = [
            'http://localhost',
            'https://localhost',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8100',
            'http://localhost:9981',
            'http://localhost:9982',
            'http://10.0.2.2:9981',
        ];

        $all = array_merge(
            $safetyDefaults,
            $envOrigins,
            empty(array_filter($envOrigins)) ? $localDefaults : []
        );

        return array_values(array_unique(array_filter($all)));
    })(),
    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    'supports_credentials' => true,

];
