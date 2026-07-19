<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        // Required for Sheet Sync OAuth2 authorization_code flow.
        // Not needed for Google Login (which only verifies id_token via client_id).
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        // Redirect URI must point to the editor's static oauth-callback.html page.
        // That page receives the auth code via URL params and postMessages it to the parent window.
        // GOOGLE_REDIRECT_URI must also be registered in GCP Console → OAuth 2.0 Client IDs.
        'redirect_uri' => env('GOOGLE_REDIRECT_URI'),
    ],

];
