<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Models\App;
use App\Models\AppMembership;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AgentMemberController extends Controller
{
    /**
     * List all joined members and surveyors for an application.
     *
     * GET /api/agent/v1/apps/{app}/members
     */
    public function index(Request $request, string $appId): JsonResponse
    {
        $app = App::where('id', $appId)->orWhere('slug', $appId)->firstOrFail();

        $members = $app->memberships()->with('user:id,name,email')->get()->map(function (AppMembership $m) {
            return [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'name' => $m->user?->name,
                'email' => $m->user?->email,
                'role' => $m->role,
                'is_active' => (bool) $m->is_active,
                'joined_at' => $m->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'total' => $members->count(),
            'data' => $members,
        ]);
    }

    /**
     * Add or update member/surveyor enrollment in an application.
     *
     * POST /api/agent/v1/apps/{app}/members
     */
    public function store(Request $request, string $appId): JsonResponse
    {
        $app = App::where('id', $appId)->orWhere('slug', $appId)->firstOrFail();

        $validated = $request->validate([
            'user_id' => 'required_without:email|nullable|string|exists:users,id',
            'email' => 'required_without:user_id|nullable|email',
            'role' => 'nullable|string|in:enumerator,supervisor,viewer,app_admin',
        ]);

        $user = null;
        if (! empty($validated['user_id'])) {
            $user = User::find($validated['user_id']);
        } elseif (! empty($validated['email'])) {
            $user = User::where('email', $validated['email'])->first();
        }

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found with the provided identifier.',
            ], 404);
        }

        $role = $validated['role'] ?? 'enumerator';

        $membership = AppMembership::updateOrCreate(
            ['app_id' => $app->id, 'user_id' => $user->id],
            ['role' => $role, 'is_active' => true]
        );

        Log::info('[AGENT_MUTATION] Member enrolled by Agent', [
            'app_id' => $app->id,
            'user_id' => $user->id,
            'role' => $role,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Member '{$user->email}' assigned role '{$role}' successfully.",
            'data' => [
                'id' => $membership->id,
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $membership->role,
                'is_active' => (bool) $membership->is_active,
            ],
        ], 201);
    }

    /**
     * Remove a member/surveyor from an application.
     *
     * DELETE /api/agent/v1/apps/{app}/members/{user}
     */
    public function destroy(Request $request, string $appId, string $userId): JsonResponse
    {
        $app = App::where('id', $appId)->orWhere('slug', $appId)->firstOrFail();

        $deleted = AppMembership::where('app_id', $app->id)
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->orWhereHas('user', fn ($uQ) => $uQ->where('email', $userId));
            })
            ->delete();

        if (! $deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Member not found in this app.',
            ], 404);
        }

        Log::info('[AGENT_MUTATION] Member removed by Agent', [
            'app_id' => $app->id,
            'target_user' => $userId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Member removed from app successfully.',
        ]);
    }
}
