<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Google\Client as GoogleClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'id_token' => 'required|string',
            'client_type' => 'nullable|string|in:web,android,ios', // Optional for logging/logic
        ]);

        $idToken = $request->input('id_token');

        try {
            $client = new GoogleClient(['client_id' => config('services.google.client_id')]);

            // FIX: Disable SSL verification on local environment to prevent cURL error 60
            if (app()->isLocal()) {
                $client->setHttpClient(new \GuzzleHttp\Client([
                    'verify' => false,
                ]));
            }

            // For Android, we might have multiple client IDs (Web & Android).
            // The library allows passing an array of audience.
            // But verifyIdToken usually checks against the configured client_id.
            // If the token comes from Android, the audience might be the Web Client ID (if using web sign-in)
            // or the Android Client ID.

            // We'll let the library verify the signature and expiration first.
            // We can manually check audience if needed.

            $payload = $client->verifyIdToken($idToken);

            if (! $payload) {
                // If verifyIdToken returns false, it failed.
                // Sometimes it throws exception, sometimes false.
                return response()->json(['message' => 'Invalid Google Token'], 401);
            }

            // payload contains 'sub', 'email', 'name', 'picture', etc.
            $googleId = $payload['sub'];
            $email = $payload['email'];
            $name = $payload['name'];
            $avatar = $payload['picture'] ?? null;

            if (empty($email)) {
                return response()->json(['message' => 'Google Token must contain email'], 400);
            }

            // Find or Create User
            $user = User::withTrashed()->where('email', $email)->first();

            if ($user) {
                if ($user->trashed()) {
                    return response()->json(['message' => 'Account is disabled'], 403);
                }
                // Update Google ID if not set
                // You might need to add 'google_id' column to users table if you want to link specifically
                // For now, we trust email authentication
            } else {
                // Create new user
                // Password is random, they can set it later via "Forgot Password" if they want
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => bcrypt(Str::random(16)),
                    'email_verified_at' => now(), // Trusted from Google
                ]);

                // Assign default role/organization logic here if needed
            }

            // Process Pending Invitations (Auto-Accept)
            $user->acceptPendingInvitations();

            // Create Sanctum Token
            $token = $user->createToken('google-login-'.($request->client_type ?? 'web'))->plainTextToken;

            return response()->json([
                'success' => true,
                'token' => $token,
                'user' => $user,
            ]);
        } catch (\Exception $e) {
            Log::error('Google Login Check Failed', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'backend_client_id' => substr(config('services.google.client_id'), 0, 10).'...',
            ]);

            return response()->json(['message' => 'Authentication failed', 'error' => $e->getMessage()], 401);
        }
    }
}
