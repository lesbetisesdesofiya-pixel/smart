<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MagicLink;
use App\Models\ParentModel;
use App\Models\Prof;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MagicLinkController extends Controller
{
    public function consume(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $token = $request->input('token');
        $hash = hash('sha256', $token);

        // Atomic consumption with lock
        $result = DB::transaction(function () use ($hash, $request) {
            $magicLink = MagicLink::where('token_hash', $hash)
                ->whereNull('used_at')
                ->where('expires_at', '>', now())
                ->lockForUpdate()
                ->first();

            if (!$magicLink) {
                return ['error' => true, 'message' => 'Lien magique invalide ou expiré.'];
            }

            // Mark as used
            $magicLink->update(['used_at' => now()]);

            // Determine user type and login
            $userType = $magicLink->user_type;

            if ($userType === 'prof') {
                $prof = $magicLink->prof;
                if (!$prof) {
                    return ['error' => true, 'message' => 'Professeur introuvable.'];
                }

                Auth::guard('prof')->login($prof, true);
                $request->session()->regenerate();

                return [
                    'success' => true,
                    'type' => 'prof',
                    'id' => $prof->id,
                ];
            }

            if ($userType === 'parent') {
                $parent = $magicLink->parent;
                if (!$parent) {
                    return ['error' => true, 'message' => 'Parent introuvable.'];
                }

                Auth::guard('parent')->login($parent, true);
                $request->session()->regenerate();

                return [
                    'success' => true,
                    'type' => 'parent',
                    'id' => $parent->id,
                ];
            }

            return ['error' => true, 'message' => 'Type utilisateur inconnu.'];
        });

        if (!empty($result['error'])) {
            return response()->json(['message' => $result['message']], 404);
        }

        return response()->json($result);
    }

    public function me(Request $request): JsonResponse
    {
        // Check prof guard
        $prof = Auth::guard('prof')->user();
        if ($prof) {
            return response()->json([
                'authenticated' => true,
                'type' => 'prof',
                'user' => [
                    'id' => $prof->id,
                    'nom_complet' => $prof->nom_complet,
                ],
            ]);
        }

        // Check parent guard
        $parent = Auth::guard('parent')->user();
        if ($parent) {
            return response()->json([
                'authenticated' => true,
                'type' => 'parent',
                'user' => [
                    'id' => $parent->id,
                ],
            ]);
        }

        return response()->json(['authenticated' => false], 401);
    }
}
