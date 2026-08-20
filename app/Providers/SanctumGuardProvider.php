<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\Guard;
use Illuminate\Auth\RequestGuard;

class SanctumGuardProvider extends ServiceProvider
{
    public function boot(): void
    {
        Auth::extend('sanctum', function ($app, $name, array $config) {
            $guard = new Guard(
                $app['auth'],
                config('sanctum.expiration'),
                $config['provider'] ?? null,
                config('sanctum.last_used_at', true)
            );

            return new RequestGuard(
                $guard,
                request(),
                $app['auth']->createUserProvider($config['provider'] ?? null)
            );
        });
    }
}
