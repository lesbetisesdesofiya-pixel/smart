<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentModel;
use App\Services\MagicLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MagicLinkController extends Controller
{
    public function consume(Request $request, MagicLinkService $magicLinks): JsonResponse
    {
        $purposes = implode(',', MagicLinkService::PURPOSES);

        $request->validate([
            'token' => 'required|string',
            'purpose' => "required|in:{$purposes}",
        ]);

        $link = $magicLinks->consume($request->token, $request->purpose);

        if (!$link) {
            return response()->json(['message' => 'Lien magique invalide ou expiré.'], 404);
        }

        $parent = $link->parent()->first();

        if (!$parent) {
            return response()->json(['message' => 'Parent introuvable.'], 404);
        }

        $token = $parent->createToken('parent-magic-token')->plainTextToken;
        $tab = $magicLinks->getTabForPurpose($request->purpose);
        $secure = env('SESSION_SECURE_COOKIE', true);

        return response()->json([
            'success' => true,
            'type' => 'parent',
            'id' => $parent->id,
            'auth' => true,
            'tab' => $tab,
        ])->withCookie(
            cookie('classinote_token', $token, 60 * 24, '/', null, $secure, true, false, 'lax')
        );
    }
}
