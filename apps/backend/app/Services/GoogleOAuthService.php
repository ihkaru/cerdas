<?php

namespace App\Services;

use App\Models\App;
use App\Models\GoogleOAuthToken;
use App\Models\User;
use Google\Client as GoogleClient;
use Illuminate\Support\Facades\Log;

/**
 * GoogleOAuthService
 *
 * Handles the Google OAuth2 flow specifically for Sheet Sync (offline access).
 * This is distinct from the login flow (GoogleAuthController) which only verifies id_token.
 * Here we need a full authorization_code flow to obtain a refresh_token for background sync.
 */
class GoogleOAuthService
{
    // Required Google API scopes for Sheet Sync
    private const SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
    ];

    /**
     * Build a configured Google Client instance.
     */
    private function buildClient(): GoogleClient
    {
        $clientId = config('services.google.client_id') ?: env('GOOGLE_CLIENT_ID');
        $clientSecret = config('services.google.client_secret') ?: env('GOOGLE_CLIENT_SECRET');
        $redirectUri = config('services.google.redirect_uri') ?: env('GOOGLE_REDIRECT_URI', 'http://localhost:9982/oauth-callback.html');

        if (empty($clientId)) {
            throw new \RuntimeException('GOOGLE_CLIENT_ID is not configured in backend .env.');
        }

        $client = new GoogleClient;
        $client->setClientId($clientId);
        if (! empty($clientSecret)) {
            $client->setClientSecret($clientSecret);
        }
        $client->setRedirectUri($redirectUri);
        $client->setAccessType('offline');          // Required to get refresh_token
        $client->setPrompt('consent');              // Force consent to always get refresh_token
        $client->setScopes(self::SCOPES);

        // Disable SSL verification on local environment (matches GoogleAuthController pattern)
        if (app()->isLocal()) {
            $client->setHttpClient(new \GuzzleHttp\Client(['verify' => false]));
        }

        return $client;
    }

    /**
     * Generate the Google OAuth authorization URL.
     * Includes a 'state' parameter to prevent CSRF and carry app_id context.
     *
     * @param  string  $appId  The App UUID to associate token with after OAuth
     * @return array { url: string, state: string }
     */
    public function getAuthUrl(string $appId): array
    {
        $client = $this->buildClient();

        // State = base64 encoded JSON with app_id + random nonce (CSRF protection)
        $state = base64_encode(json_encode([
            'app_id' => $appId,
            'nonce' => bin2hex(random_bytes(16)),
        ]));

        $client->setState($state);

        return [
            'url' => $client->createAuthUrl(),
            'state' => $state,
        ];
    }

    /**
     * Exchange the authorization code for tokens and persist to DB.
     *
     * @param  string  $code  Authorization code from Google callback
     * @param  string  $appId  App UUID to bind this token to
     * @param  string  $userId  User UUID who performed the OAuth (becomes token owner)
     *
     * @throws \RuntimeException If token exchange fails or no refresh_token returned
     */
    public function exchangeCodeAndStore(string $code, string $appId, string $userId): GoogleOAuthToken
    {
        $client = $this->buildClient();

        try {
            $tokenData = $client->fetchAccessTokenWithAuthCode($code);
        } catch (\Exception $e) {
            Log::error('GoogleOAuthService: failed to exchange authorization code', [
                'app_id' => $appId,
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException('Failed to exchange Google authorization code: '.$e->getMessage());
        }

        if (isset($tokenData['error'])) {
            throw new \RuntimeException('Google OAuth error: '.($tokenData['error_description'] ?? $tokenData['error']));
        }

        if (empty($tokenData['refresh_token'])) {
            // refresh_token is only returned on first consent or if prompt=consent is set.
            // If missing here, the consent flow wasn't triggered properly.
            throw new \RuntimeException(
                'No refresh_token returned. Ensure the user granted offline access. '.
                'This can happen if consent was previously granted — revoke access at myaccount.google.com and try again.'
            );
        }

        // Upsert: if App already has a token (e.g., reconnecting), replace it
        /** @var GoogleOAuthToken $token */
        $token = GoogleOAuthToken::updateOrCreate(
            ['app_id' => $appId],
            [
                'user_id' => $userId,
                'access_token' => $tokenData['access_token'],
                'refresh_token' => $tokenData['refresh_token'],
                'scopes' => implode(' ', self::SCOPES),
                'expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
            ]
        );

        Log::info('GoogleOAuthService: token stored', [
            'app_id' => $appId,
            'user_id' => $userId,
        ]);

        return $token;
    }

    /**
     * Check if an App has a valid (non-expired) Google OAuth token.
     */
    public function hasValidToken(string $appId): bool
    {
        $token = GoogleOAuthToken::where('app_id', $appId)->first();

        return $token !== null && ! $token->isExpired();
    }

    /**
     * Check if an App has any token (even if expired — refresh_token may still work).
     */
    public function hasToken(string $appId): bool
    {
        return GoogleOAuthToken::where('app_id', $appId)->exists();
    }
}
