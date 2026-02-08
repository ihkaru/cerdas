<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\App;
use App\Models\AppMembership;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AppController extends Controller {
    /**
     * List all apps user has access to
     */
    public function index(Request $request): JsonResponse {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            $apps = App::withCount(['tables', 'memberships'])->get();
        } else {
            $apps = $user->apps()->withCount(['tables', 'memberships'])->get();
        }

        return response()->json([
            'success' => true,
            'data' => $apps,
        ]);
    }

    /**
     * Create a new app
     */
    public function store(Request $request): JsonResponse {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'mode' => 'nullable|string|in:simple,complex',
        ]);

        $user = $request->user();

        // Generate slug
        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;

        while (App::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        $app = App::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'mode' => $validated['mode'] ?? 'simple',
            'created_by' => $user->id,
        ]);

        // Add user as Admin of the app
        AppMembership::create([
            'app_id' => $app->id,
            'user_id' => $user->id,
            'role' => 'app_admin',
            'is_active' => true,
        ]);

        // Create demo users for this app
        $demoCredentials = $this->createDemoUsers($app);

        return response()->json([
            'success' => true,
            'data' => $app,
            'demo_credentials' => $demoCredentials,
            'message' => 'App created successfully',
        ], 201);
    }

    /**
     * Create demo users (Enumerator & Supervisor) for a specific app
     */
    private function createDemoUsers(App $app): array {
        $password = 'password';
        $credentials = [];

        // 1. Create App Enumerator
        $enumEmail = "enum.{$app->slug}@demo.cerdas.com";
        $enumerator = User::firstOrCreate(
            ['email' => $enumEmail],
            [
                'name' => "Enumerator {$app->name}",
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]
        );

        AppMembership::create([
            'app_id' => $app->id,
            'user_id' => $enumerator->id,
            'role' => 'enumerator',
            'is_active' => true,
        ]);

        $credentials[] = [
            'role' => 'Enumerator',
            'email' => $enumEmail,
            'password' => $password
        ];

        // 2. Create App Supervisor
        $spvEmail = "spv.{$app->slug}@demo.cerdas.com";
        $supervisor = User::firstOrCreate(
            ['email' => $spvEmail],
            [
                'name' => "Supervisor {$app->name}",
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]
        );

        AppMembership::create([
            'app_id' => $app->id,
            'user_id' => $supervisor->id,
            'role' => 'supervisor',
            'is_active' => true,
        ]);

        $credentials[] = [
            'role' => 'Supervisor',
            'email' => $spvEmail,
            'password' => $password
        ];

        return $credentials;
    }

    /**
     * Get specific app details (with stats/tables if needed)
     */
    public function show(Request $request, App $app): JsonResponse {
        $user = $request->user();

        if (!$user->hasAppAccess($app->id)) {
            return response()->json(['success' => false, 'message' => 'Access denied'], 403);
        }

        // Updated relation: forms -> tables
        $app->load(['tables.latestPublishedVersion', 'memberships.user', 'views', 'organizations', 'invitations']);

        return response()->json([
            'success' => true,
            'data' => $app,
        ]);
    }

    /**
     * Update app
     */
    public function update(Request $request, App $app): JsonResponse {
        $user = $request->user();

        // Check if user is app_admin logic? 
        // For now just check access. Ideally check role 'app_admin'.
        $membership = $user->getMembershipForApp($app->id);
        if (!$membership || $membership->role !== 'app_admin') {
            // Allow super admin?
            if (!$user->isSuperAdmin()) {
                return response()->json(['success' => false, 'message' => 'Access denied. Generic Admin role required.'], 403);
            }
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $app->update($validated);

        return response()->json([
            'success' => true,
            'data' => $app,
            'message' => 'App updated successfully',
        ]);
    }

    /**
     * Get user's context for this app (role, organization)
     */
    public function context(Request $request, App $app): JsonResponse {
        $user = $request->user();

        // Super admin always has access with app_admin role
        if ($user->isSuperAdmin()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'name' => $user->name,
                        'role' => 'app_admin',
                        'organizationId' => null,
                        'organizationName' => null,
                    ],
                    'app' => [
                        'id' => $app->id,
                        'uuid' => $app->id,
                        'mode' => $app->mode ?? 'simple',
                    ],
                ],
            ]);
        }

        // Get user's membership for this app
        $membership = $user->getMembershipForApp($app->id);

        if (!$membership || !$membership->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. You are not a member of this app.',
            ], 403);
        }

        // Get organization if applicable
        $organization = $membership->organization;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => $membership->role,
                    'organizationId' => $membership->organization_id,
                    'organizationName' => $organization?->name,
                ],
                'app' => [
                    'id' => $app->id,
                    'uuid' => $app->id,
                    'mode' => $app->mode ?? 'simple',
                ],
            ],
        ]);
    }

    /**
     * Get participating organizations for this app
     */
    public function organizations(Request $request, App $app): JsonResponse {
        // Access check?
        $app->load('organizations');
        return response()->json([
            'success' => true,
            'data' => $app->organizations,
        ]);
    }

    /**
     * Attach organization to app
     */
    public function attachOrganization(Request $request, App $app): JsonResponse {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
        ]);

        $app->organizations()->syncWithoutDetaching([$validated['organization_id']]);

        return response()->json([
            'success' => true,
            'message' => 'Organization attached',
            'data' => $app->load('organizations')->organizations,
        ]);
    }

    /**
     * Detach organization from app
     */
    public function detachOrganization(Request $request, App $app, $organizationId): JsonResponse {
        $app->organizations()->detach($organizationId);

        return response()->json([
            'success' => true,
            'message' => 'Organization detached',
            'data' => $app->load('organizations')->organizations,
        ]);
    }
    /**
     * Add member to app (Simple Mode)
     */
    public function addMember(Request $request, App $app): JsonResponse {
        $user = $request->user();

        // 1. Authorization: Only App Admin or Super Admin can add members
        if (!$user->isSuperAdmin()) {
            $membership = $user->getMembershipForApp($app->id);
            if (!$membership || $membership->role !== 'app_admin') {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:app_admin,editor,enumerator,supervisor,viewer',
        ]);

        // 2. Find User
        $targetUser = User::where('email', $validated['email'])->first();

        if (!$targetUser) {
            // Create Invitation for non-existing user
            // Check if already invited
            $existingInvite = \App\Models\AppInvitation::where('app_id', $app->id)
                ->where('email', $validated['email'])
                ->first();

            if ($existingInvite) {
                return response()->json(['success' => false, 'message' => 'User already invited.'], 409);
            }

            \App\Models\AppInvitation::create([
                'app_id' => $app->id,
                'email' => $validated['email'],
                'role' => $validated['role'],
                'created_by' => $user->id,
            ]);

            // TODO: Send Email

            return response()->json([
                'success' => true,
                'message' => 'Invitation sent to ' . $validated['email'],
                'data' => [
                    'members' => $app->load('memberships.user')->memberships->map(function ($m) {
                        return [
                            'id' => $m->id,
                            'user' => $m->user,
                            'role' => $m->role,
                        ];
                    }),
                    'invitations' => $app->load('invitations')->invitations
                ]
            ]);
        }

        // 3. Add/Update Membership
        // Check if already member
        $existing = AppMembership::where('app_id', $app->id)
            ->where('user_id', $targetUser->id)
            ->first();

        if ($existing) {
            $existing->update(['role' => $validated['role']]);
            $message = 'Member role updated successfully.';
        } else {
            AppMembership::create([
                'app_id' => $app->id,
                'user_id' => $targetUser->id,
                'role' => $validated['role'],
                'is_active' => true,
            ]);
            $message = 'Member added successfully.';
        }

        // 4. Return updated member list
        $app->load(['memberships.user', 'invitations']); // Refresh members & invitations

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'members' => $app->memberships->map(function ($m) {
                    return [
                        'id' => $m->id,
                        'user' => $m->user,
                        'role' => $m->role,
                    ];
                }),
                'invitations' => $app->invitations
            ]
        ]);
    }

    /**
     * Remove member from app
     */
    public function removeMember(Request $request, App $app, User $targetUser): JsonResponse {
        $user = $request->user();

        // 1. Authorization
        if (!$user->isSuperAdmin()) {
            $membership = $user->getMembershipForApp($app->id);
            if (!$membership || $membership->role !== 'app_admin') {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
        }

        // Prevent removing self if it leaves app without admin? (Optional safety)
        // For now allow it.

        AppMembership::where('app_id', $app->id)
            ->where('user_id', $targetUser->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Member removed successfully.',
            'data' => $app->load('memberships.user')->memberships, // Return updated list
        ]);
    }

    /**
     * Cancel invitation
     */
    public function cancelInvitation(Request $request, App $app, $invitationId): JsonResponse {
        $user = $request->user();

        // 1. Authorization
        if (!$user->isSuperAdmin()) {
            $membership = $user->getMembershipForApp($app->id);
            if (!$membership || $membership->role !== 'app_admin') {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
        }

        \App\Models\AppInvitation::where('app_id', $app->id)
            ->where('id', $invitationId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Invitation cancelled.',
            'data' => $app->load('invitations')->invitations,
        ]);
    }
}
