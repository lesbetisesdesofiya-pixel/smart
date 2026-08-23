<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\Routing\Exception\RouteNotFoundException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(\App\Http\Middleware\ReadTokenFromCookie::class);
        
        // Add session middleware to API routes
        $middleware->api(prepend: [
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        ]);
        
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'school' => \App\Http\Middleware\CheckSchool::class,
            'pin.verified' => \App\Http\Middleware\EnsurePinVerified::class,
            'throttle.pin' => \App\Http\Middleware\ThrottlePinAttempts::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (RouteNotFoundException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }
        });
        $exceptions->renderable(function (AuthenticationException $e, $request) {
            return response()->json(['message' => 'Non authentifié'], 401);
        });
    })->create();
