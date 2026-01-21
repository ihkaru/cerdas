<?php

use App\Http\Controllers\Api\AppController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FieldController;
use App\Http\Controllers\Api\FormController;
use App\Http\Controllers\Api\ResponseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group.
|
*/

// ========== Public Routes ==========

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIsoString(),
    ]);
});

// ========== Protected Routes ==========

Route::middleware('auth:sanctum')->group(function () {

    // ========================================================================
    // Common Routes (Shared by Editor & Client)
    // ========================================================================

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Current user shortcut
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Impersonation for Editor Preview (Super Admin Only)
    Route::post('/auth/impersonate', function (Request $request) {
        $user = $request->user();
        if (!$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate(['role' => 'required|in:admin,supervisor,enumerator']);

        $targetUser = null;
        switch ($request->role) {
            case 'admin':
                $targetUser = $user; // Self
                break;
            case 'supervisor':
                $targetUser = \App\Models\User::where('email', 'supervisor@cerdas.com')->first();
                break;
            case 'enumerator':
                $targetUser = \App\Models\User::where('email', 'user@example.com')->first();
                break;
        }

        if (!$targetUser) {
            return response()->json(['message' => 'Target user not found for this role'], 404);
        }

        // Create a temporary token for preview
        $token = $targetUser->createToken('preview-impersonation')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $targetUser
        ]);
    });

    // ========================================================================
    // Editor Routes (Web Dashboard)
    // ========================================================================

    // Dashboard Stats
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // App Management
    Route::prefix('apps')->group(function () {
        Route::get('/', [AppController::class, 'index']);
        Route::post('/', [AppController::class, 'store']);
        Route::get('/{app}', [AppController::class, 'show']);
        Route::put('/{app}', [AppController::class, 'update']);
        Route::get('/{app}/context', [AppController::class, 'context']); // User's role/org for this app
        // Route::delete('/{app}', [AppController::class, 'destroy']);
    });

    // Form Management (Ex-Schemas)
    Route::prefix('forms')->group(function () {
        Route::get('/', [FormController::class, 'index']); // Accepts ?app_id=X
        Route::post('/', [FormController::class, 'store']);
        Route::get('/{form}', [FormController::class, 'show']);
        Route::put('/{form}', [FormController::class, 'update']);
        Route::delete('/{form}', [FormController::class, 'destroy']);

        // Version management
        Route::get('/{form}/versions/{version}', [FormController::class, 'showVersion']);
        Route::post('/{form}/versions/{version}/publish', [FormController::class, 'publishVersion']);
        Route::post('/{form}/versions/draft', [FormController::class, 'createDraftVersion']);

        // Update Version Content (JSON Schema)
        Route::put('/{form}/versions/{version}', [FormController::class, 'updateVersion']);
    });

    // ========================================================================
    // Client Routes (Mobile PWA)
    // ========================================================================

    // Assignments (Tasks for Enumerators)
    Route::prefix('assignments')->group(function () {
        Route::get('/', [AssignmentController::class, 'index']);
        // Route::post('/import', [AssignmentController::class, 'import']); // Note: Import is technically an Editor feature? Moving to Common or Editor if needed later.
        Route::get('/{assignment}', [AssignmentController::class, 'show']);
    });

    // Responses (Sync)
    Route::get('/responses', [ResponseController::class, 'index']);
    Route::post('/responses/sync', [ResponseController::class, 'store']);

    // Additional: Assignment Import is likely an ADMIN/EDITOR feature, not Client.
    // Ideally should be under Editor routes, but path is /assignments/import.
    // Keeping it accessible generally for now.
    Route::post('/assignments/import', [AssignmentController::class, 'import']);
});
