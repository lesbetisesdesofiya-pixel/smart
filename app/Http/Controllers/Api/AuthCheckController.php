<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AuthCheckController extends Controller
{
    public function checkProf(): JsonResponse
    {
        $prof = Auth::guard('prof')->user();

        if (!$prof) {
            return response()->json(['authenticated' => false], 401);
        }

        return response()->json([
            'authenticated' => true,
            'type' => 'prof',
            'id' => $prof->id,
            'nom_complet' => $prof->nom_complet,
        ]);
    }

    public function checkParent(): JsonResponse
    {
        $parent = Auth::guard('parent')->user();

        if (!$parent) {
            return response()->json(['authenticated' => false], 401);
        }

        return response()->json([
            'authenticated' => true,
            'type' => 'parent',
            'id' => $parent->id,
        ]);
    }
}
