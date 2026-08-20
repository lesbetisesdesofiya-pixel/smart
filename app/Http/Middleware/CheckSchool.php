<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSchool
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $schoolId = $request->route('school') ?? $request->header('X-School-Id');

        if ($schoolId && !$user->isSuperadmin()) {
            $hasAccess = $user->schools()->where('schools.id', $schoolId)->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Accès refusé à cette école'], 403);
            }
        }

        if ($schoolId) {
            $request->merge(['current_school_id' => $schoolId]);
        } elseif (!$user->isSuperadmin()) {
            return response()->json(['message' => 'Aucune école sélectionnée'], 400);
        }

        return $next($request);
    }
}
