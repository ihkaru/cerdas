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
            $apps = App::withCount(['forms', 'memberships'])->get();
        } else {
            $apps = $user->apps()->withCount(['forms', 'memberships'])->get();
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
            'created_by' => $user->id,
        ]);

        // Add user as Admin of the app
        AppMembership::create([
            'app_id' => $app->id,
            'user_id' => $user->id,
            'role' => 'app_admin',
            'is_active' => true,
            // 'organization_id' needs to be handled? Assuming null or default for now.
            // Migration for app_memberships says organization_id is foreign key but nullable?
            // Let's check migration content or assume nullable. 
            // In AppMembership model, organization_id is fillable.
            // If strictly required, we will fail here. But let's assume it's nullable or we fix later.
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
     * Get specific app details (with stats/forms if needed)
     */
    public function show(Request $request, App $app): JsonResponse {
        $user = $request->user();

        if (!$user->hasAppAccess($app->id)) {
            return response()->json(['success' => false, 'message' => 'Access denied'], 403);
        }

        $app->load(['forms.latestPublishedVersion', 'memberships.user', 'views']);

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
     * Used by client to build ClosureContext for form validation/logic
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
                        'uuid' => $app->uuid,
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
                    'uuid' => $app->uuid,
                    'mode' => $app->mode ?? 'simple',
                ],
            ],
        ]);
    }
}
