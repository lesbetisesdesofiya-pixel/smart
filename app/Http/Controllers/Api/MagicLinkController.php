<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentModel;
use App\Models\Prof;
use App\Services\MagicLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;

class MagicLinkController extends Controller
{
    public function consume(Request $request, MagicLinkService $magicLinks): JsonResponse
    {
        $allPurposes = array_merge(
            MagicLinkService::PURPOSES,
            ['prof_dashboard', 'prof_absences']
        );
        $purposes = implode(',', $allPurposes);

        $request->validate([
            'token' => 'required|string',
            'purpose' => "required|in:{$purposes}",
        ]);

        $link = $magicLinks->consume($request->token, $request->purpose);

        if (!$link) {
            return response()->json(['message' => 'Lien magique invalide ou expiré.'], 404);
        }

        // Prof magic link
        if (str_starts_with($request->purpose, 'prof_')) {
            $prof = $link->prof()->first();

            if (!$prof) {
                return response()->json(['message' => 'Professeur introuvable.'], 404);
            }

            // Login with session (remember me)
            Auth::guard('prof')->login($prof, true);
            $request->session()->regenerate();

            return response()->json([
                'success' => true,
                'type' => 'prof',
                'id' => $prof->id,
                'auth' => true,
            ]);
        }

        // Parent magic link
        $parent = $link->parent()->first();

        if (!$parent) {
            return response()->json(['message' => 'Parent introuvable.'], 404);
        }

        // Login with session (remember me)
        Auth::guard('parent')->login($parent, true);
        $request->session()->regenerate();

        $tab = $magicLinks->getTabForPurpose($request->purpose);

        return response()->json([
            'success' => true,
            'type' => 'parent',
            'id' => $parent->id,
            'auth' => true,
            'tab' => $tab,
        ]);
    }
}
