<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Super Admin Master API Key
    |--------------------------------------------------------------------------
    |
    | Master secret used by AI agents, automation CLI, or external diagnostics
    | to access the Agentic REST API with full root/superadmin authorization.
    | Set in .env as SUPERADMIN_API_KEY.
    |
    */
    'superadmin_api_key' => env('SUPERADMIN_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Agent Audit Log
    |--------------------------------------------------------------------------
    |
    | When enabled, all requests and mutating actions performed via the Agent
    | REST API are explicitly recorded in the application log.
    |
    */
    'audit_log' => env('AGENT_AUDIT_LOG', true),
];
