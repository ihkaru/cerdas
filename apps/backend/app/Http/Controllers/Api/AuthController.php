<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller {
    /**
     * Register a new user
     */
    public function register(Request $request): JsonResponse {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Process Organization Invitations
        $invitations = \App\Models\OrganizationInvitation::where('email', $user->email)->get();
        foreach ($invitations as $invitation) {
            $invitation->organization->members()->syncWithoutDetaching([
                $user->id => ['role' => $invitation->role]
            ]);

            // Notify User
            $user->notify(new \App\Notifications\OrganizationInviteNotification(
                $invitation->organization->name,
                $invitation->creator->name ?? 'System'
            ));

            $invitation->delete();
        }

        // Process App Invitations (New: Auto-Accept)
        $appInvitations = \App\Models\AppInvitation::where('email', $user->email)->get();
        foreach ($appInvitations as $invite) {
            // Check if already member (safety)
            $existing = \App\Models\AppMembership::where('app_id', $invite->app_id)
                ->where('user_id', $user->id)
                ->exists();

            if (!$existing) {
                \App\Models\AppMembership::create([
                    'app_id' => $invite->app_id,
                    'user_id' => $user->id,
                    'role' => $invite->role,
                    'is_active' => true,
                ]);
            }

            $invite->delete();
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
            'message' => 'Registration successful',
        ], 201);
    }

    /**
     * Login with email and password
     */
    public function login(Request $request): JsonResponse {
        \Illuminate\Support\Facades\Log::info('Login attempt', ['email' => $request->input('email'), 'ip' => $request->ip()]);

        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            \Illuminate\Support\Facades\Log::warning('Login failed: invalid credentials', ['email' => $validated['email']]);
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        \Illuminate\Support\Facades\Log::info('Login successful', ['user_id' => $user->id]);

        // Revoke previous tokens if you want single-device login
        // $user->tokens()->delete();

        // Process Pending Invitations (Auto-Accept)
        $user->acceptPendingInvitations();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
            'message' => 'Login successful',
        ]);
    }

    /**
     * Logout (revoke current token)
     */
    public function logout(Request $request): JsonResponse {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request): JsonResponse {
        \Illuminate\Support\Facades\Log::info('AuthController::me hit', ['user_id' => $request->user()->id]);
        $user = $request->user();

        // Load app memberships if needed, but 'projectMemberships' does not exist.
        // For now, let's just return the user and their super admin status.
        // $user->load('appMemberships.app');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'is_super_admin' => $user->isSuperAdmin(),
                // 'memberships' => $user->appMemberships, // Uncomment if needed
            ],
        ]);
    }
}
