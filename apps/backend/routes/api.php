<?php

use App\Http\Controllers\Api\AppController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\ResponseController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\AppSchemaController;
use App\Http\Controllers\Api\GoogleAuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
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
|
*/

// Broadcasting Auth Route (manual implementation for API-only setup)
Route::post('/broadcasting/auth', function (Request $request) {
    // Return 401 for unauthenticated requests 
    if (!$request->user()) {
        return response()->json(['error' => 'Unauthenticated'], 401);
    }

    try {
        return Broadcast::auth($request);
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::error('Broadcast Auth Failed', [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json(['error' => 'Internal Server Error', 'message' => $e->getMessage()], 500);
    }
})->middleware('auth:sanctum');

// ========== Public Routes ==========

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/google', [GoogleAuthController::class, 'login']);
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

        // App Schema Operations (Full JSON export/import)
        Route::get('/{app}/schema', [AppSchemaController::class, 'getSchema']);
        Route::put('/{app}/schema', [AppSchemaController::class, 'updateSchema']);
        Route::get('/{app}/schema/export', [AppSchemaController::class, 'exportSchema']);

        // App Organization Management
        Route::get('/{app}/organizations', [AppController::class, 'organizations']);
        Route::post('/{app}/organizations', [AppController::class, 'attachOrganization']);
        Route::delete('/{app}/organizations/{organization}', [AppController::class, 'detachOrganization']);
    });

    // Import App from Schema (standalone route)
    Route::post('/apps/import', [AppSchemaController::class, 'importSchema']);

    // Organization Lookup
    // Organizations (Global/User-Owned)
    Route::prefix('organizations')->group(function () {
        Route::get('/', [OrganizationController::class, 'index']);
        Route::post('/', [OrganizationController::class, 'store']);

        Route::prefix('{organization}')->group(function () {
            Route::put('/', [OrganizationController::class, 'update']);
            Route::delete('/', [OrganizationController::class, 'destroy']);

            // Members Management
            Route::get('/members', [OrganizationController::class, 'members']);
            Route::post('/members', [OrganizationController::class, 'addMember']);
            Route::delete('/members/{user}', [OrganizationController::class, 'removeMember']);

            // Invitations
            Route::delete('/invitations/{invitation}', [OrganizationController::class, 'cancelInvitation']);
        });
    });

    // Notifications
    Route::get('/notifications', [App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [App\Http\Controllers\Api\NotificationController::class, 'markAllRead']);

    // Table Management (Ex-Forms)
    Route::prefix('tables')->group(function () {
        Route::get('/', [TableController::class, 'index']); // Accepts ?app_id=X
        Route::post('/', [TableController::class, 'store']);
        Route::get('/{table}', [TableController::class, 'show']);
        Route::put('/{table}', [TableController::class, 'update']);
        Route::delete('/{table}', [TableController::class, 'destroy']);

        // Version management
        Route::get('/{table}/versions', [TableController::class, 'listVersions']); // Version history
        Route::get('/{table}/versions/{version}', [TableController::class, 'showVersion']);
        Route::post('/{table}/versions/{version}/publish', [TableController::class, 'publishVersion']);
        Route::post('/{table}/versions/draft', [TableController::class, 'createDraftVersion']);

        // Update Version Content (Fields & Layout)
        Route::put('/{table}/versions/{version}', [TableController::class, 'updateVersion']);
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

    // ========================================================================
    // Excel Data Import
    // ========================================================================
    Route::post('/excel/upload', [App\Http\Controllers\Api\ExcelImportController::class, 'upload']);
    Route::post('/excel/preview', [App\Http\Controllers\Api\ExcelImportController::class, 'preview']);
    Route::post('/excel/import', [App\Http\Controllers\Api\ExcelImportController::class, 'import']);
});
