<?php

/**
 * Sentry configuration for Cerdas Backend (Laravel 12 + Octane FrankenPHP).
 * Integrated with OpenObserve SRE Gateway (Zero-Config Self-Describing Telemetry).
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Sentry DSN
    |--------------------------------------------------------------------------
    |
    | Formatted as: https://<public_key>@sre.dvlpid.my.id/cerdas
    |
    */
    'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN')),

    /*
    |--------------------------------------------------------------------------
    | Self-Describing SRE Telemetry Tags (Tier 1 SSOT)
    |--------------------------------------------------------------------------
    |
    | Transmitted in every Sentry envelope so the OpenObserve SRE Gateway
    | can immediately perform zero-config incident triage and dispatch to Aina.
    |
    */
    'tags' => [
        'app_name' => env('APP_NAME_SLUG', 'cerdas-backend'),
        'repository' => env('GITHUB_REPOSITORY', 'https://github.com/ihkaru/cerdas'),
        'verification_command' => env('SRE_VERIFY_CMD', 'php artisan test'),
        'branch' => env('GIT_BRANCH', 'main'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Monitoring & Tracing
    |--------------------------------------------------------------------------
    */
    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.2),

    'send_default_pii' => false,
];
