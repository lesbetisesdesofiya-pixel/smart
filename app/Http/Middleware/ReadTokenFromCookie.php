<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class ReadTokenFromCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        $tokenString = null;

        if (!$request->bearerToken() && $request->hasCookie('classinote_token')) {
            $tokenString = $request->cookie('classinote_token');
            if ($tokenString) {
                $request->headers->set('Authorization', 'Bearer ' . $tokenString);
            }
        }

        $response = $next($request);

        if ($tokenString && $response instanceof Response) {
            $accessToken = PersonalAccessToken::findToken($tokenString);

            if ($accessToken) {
                $now = now();
                $lastUsed = $accessToken->last_used_at;

                $accessToken->update(['last_used_at' => $now]);

                $tokenable = $accessToken->tokenable;
                $isSuperadmin = method_exists($tokenable, 'getAttribute')
                    && $tokenable->getAttribute('role') === 'superadmin';

                $cookieMinutes = $isSuperadmin ? 60 : 60 * 24 * 300;

                $daysSinceLastUse = $lastUsed ? $lastUsed->diffInDays($now) : 999;

                if (!$isSuperadmin && $daysSinceLastUse >= 7) {
                    $tokenName = $accessToken->name;
                    $accessToken->delete();

                    $newToken = $tokenable->createToken($tokenName)->plainTextToken;
                    $secure = env('SESSION_SECURE_COOKIE', true);

                    $response->headers->setCookie(
                        cookie('classinote_token', $newToken, $cookieMinutes, '/', null, $secure, true, false, 'lax')
                    );
                }
            }
        }

        return $response;
    }
}
