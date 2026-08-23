<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateParent
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::guard('parent')->check()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        return $next($request);
    }
}
