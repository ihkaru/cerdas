<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller {
    /**
     * List user's organizations (and public ones).
     */
    public function index(Request $request): JsonResponse {
        $user = $request->user();
        $query = Organization::query();

        // Filter: Public (creator_id=null) OR Owned by me
        // We could also include "I am a member of" if needed, but for now focus on management.
        $query->where(function ($q) use ($user) {
            $q->whereNull('creator_id');
            if ($user) {
                $q->orWhere('creator_id', $user->id);
            }
        });

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $organizations = $query->limit(50)->get();

        return response()->json([
            'success' => true,
            'data' => $organizations,
        ]);
    }

    /**
     * Create a new organization.
     */
    public function store(Request $request): JsonResponse {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50', // Code is no longer globally unique, but we should check per user?
        ]);

        // Optional: Check if user already has an org with this code?
        // For now, let's allow duplicates or rely on frontend validation.

        $org = Organization::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'creator_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Organization created',
            'data' => $org,
        ]);
    }

    /**
     * Update an organization.
     */
    public function update(Request $request, Organization $organization): JsonResponse {
        // Authorization: Only creator or Super Admin can update
        if ($organization->creator_id !== $request->user()->id && !$request->user()->is_super_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:50',
        ]);

        $organization->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Organization updated',
            'data' => $organization,
        ]);
    }

    /**
     * Delete an organization.
     */
    public function destroy(Request $request, Organization $organization): JsonResponse {
        // Authorization
        if ($organization->creator_id !== $request->user()->id && !$request->user()->is_super_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $organization->delete();

        return response()->json([
            'success' => true,
            'message' => 'Organization deleted',
        ]);
    }

    /**
     * Get members of an organization.
     */
    public function members(Request $request, Organization $organization): JsonResponse {
        // Allow members or creator to view list
        $user = $request->user();
        $isMember = $organization->members()->where('user_id', $user->id)->exists();

        if (!$isMember && $organization->creator_id !== $user->id && !$user->is_super_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $organization->members,
            'invitations' => $organization->invitations,
        ]);
    }

    /**
     * Add member to organization.
     */
    public function addMember(Request $request, Organization $organization): JsonResponse {
        if ($organization->creator_id !== $request->user()->id && !$request->user()->is_super_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'nullable|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            $organization->members()->syncWithoutDetaching([
                $user->id => ['role' => $validated['role'] ?? 'member']
            ]);

            // Send Notification
            $user->notify(new \App\Notifications\OrganizationInviteNotification(
                $organization->name,
                $request->user()->name
            ));

            return response()->json(['success' => true, 'message' => 'Member added']);
        } else {
            // Create invitation
            // Check if already invited
            $existing = $organization->invitations()->where('email', $validated['email'])->first();
            if ($existing) {
                return response()->json(['success' => false, 'message' => 'User already invited'], 409);
            }

            $organization->invitations()->create([
                'email' => $validated['email'],
                'role' => $validated['role'] ?? 'member',
                'created_by' => $request->user()->id,
            ]);

            return response()->json(['success' => true, 'message' => 'Invitation sent']);
        }
    }

    /**
     * Remove member from organization.
     */
    public function removeMember(Request $request, Organization $organization, User $user): JsonResponse {
        if ($organization->creator_id !== $request->user()->id && !$request->user()->is_super_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $organization->members()->detach($user->id);

        return response()->json(['success' => true, 'message' => 'Member removed']);
    }

    /**
     * Cancel an invitation.
     */
    public function cancelInvitation(Request $request, Organization $organization, OrganizationInvitation $invitation): JsonResponse {
        if ($organization->creator_id !== $request->user()->id && !$request->user()->is_super_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($invitation->organization_id !== $organization->id) {
            return response()->json(['success' => false, 'message' => 'Invalid invitation'], 400);
        }

        $invitation->delete();

        return response()->json(['success' => true, 'message' => 'Invitation cancelled']);
    }
}
