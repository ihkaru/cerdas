<?php

use App\Http\Controllers\Api\AppController;
use App\Http\Controllers\Api\AppSchemaController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\ResponseController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ExcelImportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health Check (Standard for Docker compose healthcheck)
Route::get('/up', function () {
    return response()->json(['status' => 'ok']);
});

// Broadcasting Auth Route
Route::post('/broadcasting/auth', function (Request $request) {
    if (!$request->user()) {
        return response()->json(['error' => 'Unauthenticated'], 401);
    }
    try {
        return Broadcast::auth($request);
    } catch (\Throwable $e) {
        return response()->json(['error' => 'Internal Server Error'], 500);
    }
})->middleware('auth:sanctum');

// ========== Public Routes ==========
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/google', [GoogleAuthController::class, 'login']);
});

Route::get('/join/{token}', [AppController::class, 'resolveJoinToken']);
Route::post('/join', [AppController::class, 'joinWithToken'])->middleware('auth:sanctum');

// 2026 Best Practice: Secure Raw Download (Signature Required, Relative validation for Proxy-safety)
// Validation is performed inside the Controller method to support relative signatures correctly.
Route::get('/tables/{table}/export/download-raw/{job}', [ExportController::class, 'downloadRaw'])
    ->name('table.export.download.raw');

// ========== Protected Routes ==========
Route::middleware('auth:sanctum')->group(function () {

    // Common
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Apps Management
    Route::prefix('apps')->group(function () {
        Route::get('/', [AppController::class, 'index']);
        Route::post('/', [AppController::class, 'store']);
        Route::get('/{app}', [AppController::class, 'show']);
        Route::put('/{app}', [AppController::class, 'update']);
        Route::get('/{app}/context', [AppController::class, 'context']); 
        Route::get('/{app}/responses', [ResponseController::class, 'indexForEditor']);
        
        // App Schema Operations
        Route::get('/{app}/schema', [AppSchemaController::class, 'getSchema']);
        Route::put('/{app}/schema', [AppSchemaController::class, 'updateSchema']);
        Route::get('/{app}/schema/export', [AppSchemaController::class, 'exportSchema']);
        Route::get('/{app}/tables/trash', [TableController::class, 'trashed']);

        // Organizations & Members
        Route::get('/{app}/organizations', [AppController::class, 'organizations']);
        Route::post('/{app}/organizations', [AppController::class, 'attachOrganization']);
        Route::delete('/{app}/organizations/{organization}', [AppController::class, 'detachOrganization']);
        Route::post('/{app}/members', [AppController::class, 'addMember']);
        Route::delete('/{app}/members/{user}', [AppController::class, 'removeMember']);
        Route::delete('/{app}/invitations/{invitation}', [AppController::class, 'cancelInvitation']);

        // Join Links
        Route::get('/{app}/join-link', [AppController::class, 'getJoinLink']);
        Route::post('/{app}/join-link', [AppController::class, 'toggleJoinLink']);
        Route::delete('/{app}/join-link', [AppController::class, 'regenerateJoinLink']);
    });
    
    Route::post('/apps/import', [AppSchemaController::class, 'importSchema']);

    // Organizations
    Route::prefix('organizations')->group(function () {
        Route::get('/', [OrganizationController::class, 'index']);
        Route::post('/', [OrganizationController::class, 'store']);
        Route::prefix('{organization}')->group(function () {
            Route::put('/', [OrganizationController::class, 'update']);
            Route::delete('/', [OrganizationController::class, 'destroy']);
            Route::get('/members', [OrganizationController::class, 'members']);
            Route::post('/members', [OrganizationController::class, 'addMember']);
            Route::delete('/members/{user}', [OrganizationController::class, 'removeMember']);
            Route::delete('/invitations/{invitation}', [OrganizationController::class, 'cancelInvitation']);
        });
    });

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Tables Management
    Route::prefix('tables')->group(function () {
        Route::get('/', [TableController::class, 'index']);
        Route::post('/', [TableController::class, 'store']);
        Route::get('/{table}', [TableController::class, 'show']);
        Route::put('/{table}', [TableController::class, 'update']);
        Route::delete('/{table}', [TableController::class, 'destroy']);
        Route::put('/{table}/restore', [TableController::class, 'restore']);
        Route::delete('/{table}/force', [TableController::class, 'forceDestroy']);
        
        // Export Logic
        Route::post('/{table}/export/request', [ExportController::class, 'requestAsync']);
        Route::get('/{table}/export/status/{job}', [ExportController::class, 'checkStatus']);
        Route::get('/{table}/export/download/{job}', [ExportController::class, 'downloadAsync']);
        Route::get('/{table}/export/get-download-url/{job}', [ExportController::class, 'getDownloadUrl']);
        
        // Versions
        Route::get('/{table}/versions', [TableController::class, 'listVersions']);
        Route::get('/{table}/versions/{version}', [TableController::class, 'showVersion']);
        Route::post('/{table}/versions/draft', [TableController::class, 'createDraftVersion']);
        Route::put('/{table}/versions/{version}', [TableController::class, 'updateVersion']);
        Route::post('/{table}/versions/{version}/publish', [TableController::class, 'publishVersion']);
    });

    // Client/Enumeration Routes
    Route::prefix('assignments')->group(function () {
        Route::get('/', [AssignmentController::class, 'index']);
        Route::get('/{assignment}', [AssignmentController::class, 'show']);
        Route::post('/import', [AssignmentController::class, 'import']);
    });

    Route::get('/responses', [ResponseController::class, 'index']);
    Route::post('/responses/sync', [ResponseController::class, 'store']);
    Route::post('/responses/{response}/approve', [ResponseController::class, 'approve']);
    Route::post('/responses/{response}/reject', [ResponseController::class, 'reject']);

    // Excel
    Route::post('/excel/upload', [ExcelImportController::class, 'upload']);
    Route::post('/excel/preview', [ExcelImportController::class, 'preview']);
    Route::post('/excel/import', [ExcelImportController::class, 'import']);
    Route::get('/excel/status/{jobId}', [ExcelImportController::class, 'checkStatus']);

});
