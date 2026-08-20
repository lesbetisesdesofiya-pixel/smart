<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ThrottlePinAttempts
{
    public function handle(Request $request, Closure $next): Response
    {
        $email = $request->input('email', '');
        $key = $email ? "pin_attempts:admin:{$email}" : 'pin_attempts:' . $request->ip();
        $attempts = cache()->get($key, 0);

        if ($attempts >= 5) {
            return response()->json([
                'message' => 'Trop de tentatives. Réessayez dans 5 minutes.',
            ], 429);
        }

        return $next($request);
    }

    public static function increment(string $key): void
    {
        $attempts = cache()->get($key, 0);
        cache()->put($key, $attempts + 1, 300);
    }

    public static function reset(string $key): void
    {
        cache()->forget($key);
    }
}
