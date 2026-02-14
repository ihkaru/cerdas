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

    'allowed_origins' => array_map('trim', explode(',', env(
        'CORS_ALLOWED_ORIGINS',
        implode(',', [
            // Local development
            'http://localhost',
            'https://localhost',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:9981',
            'http://localhost:9982',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8100',
            'http://10.0.2.2:9981',
            // Capacitor (Android/iOS)
            'capacitor://localhost',
        ])
    ))),
    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
