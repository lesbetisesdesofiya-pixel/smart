<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/app/admin');
});

// Admin App - SPA fallback
Route::get('/app/admin/{any?}', function ($any = null) {
    return response()->file(public_path('app/admin/index.html'));
})->where('any', '.*');

// Magic link route - serves prof app
Route::get('/magic', function () {
    return response()->file(public_path('app/prof/index.html'));
});

// Prof App - SPA fallback
Route::get('/app/prof/{any?}', function ($any = null) {
    return response()->file(public_path('app/prof/index.html'));
})->where('any', '.*');

// Parent App - SPA fallback
Route::get('/app/parent/{any?}', function ($any = null) {
    return response()->file(public_path('app/parent/index.html'));
})->where('any', '.*');

// Parent V2 App - SPA fallback (magic link auth, no PIN)
Route::get('/app/parentV2/{any?}', function ($any = null) {
    return response()->file(public_path('app/parentV2/index.html'));
})->where('any', '.*');

// Superadmin App - SPA fallback
Route::get('/app/superadmin/{any?}', function ($any = null) {
    return response()->file(public_path('app/superadmin/index.html'));
})->where('any', '.*');

Route::get('/superadmin/{any?}', function ($any = null) {
    return response()->file(public_path('app/superadmin/index.html'));
})->where('any', '.*');
