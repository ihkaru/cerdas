<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'status' => 'online',
        'version' => '1.0.0',
        'php' => PHP_VERSION,
    ]);
});

// Canonical Agent Skill Endpoints (Single Source of Truth)
Route::get('/skill.md', [\App\Http\Controllers\Api\Agent\AgentSystemController::class, 'skill']);
Route::get('/skill', [\App\Http\Controllers\Api\Agent\AgentSystemController::class, 'skill']);
Route::get('/.well-known/skill.md', [\App\Http\Controllers\Api\Agent\AgentSystemController::class, 'skill']);

// Media Proxy for COEP Support (Development Environment)
Route::get('/media/{path}', function ($path) {
    // Prevent directory traversal
    if (strpos($path, '..') !== false) {
        abort(404);
    }

    $fullPath = storage_path('app/public/'.$path);
    if (! file_exists($fullPath)) {
        abort(404);
    }

    return response()->file($fullPath, [
        'Cross-Origin-Resource-Policy' => 'cross-origin',
        'Access-Control-Allow-Origin' => '*',
    ]);
})->where('path', '.*');
