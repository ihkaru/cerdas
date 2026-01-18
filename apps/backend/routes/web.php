<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Media Proxy for COEP Support (Development Environment)
Route::get('/media/{path}', function ($path) {
    // Prevent directory traversal
    if (strpos($path, '..') !== false) abort(404);

    $fullPath = storage_path('app/public/' . $path);
    if (!file_exists($fullPath)) abort(404);

    return response()->file($fullPath, [
        'Cross-Origin-Resource-Policy' => 'cross-origin',
        'Access-Control-Allow-Origin' => '*',
    ]);
})->where('path', '.*');
