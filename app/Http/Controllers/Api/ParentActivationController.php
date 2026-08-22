<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\ParentModel;

class ParentActivationController extends Controller
{
    public function handleActivationStep(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'action' => 'required|in:pwa_installed,notifications_enabled',
            'push_subscription' => 'nullable|array',
        ]);

        $parent = ParentModel::where('activation_token', $request->token)->first();

        if (!$parent) {
            return response()->json(['status' => 'error', 'message' => 'Token invalide'], 404);
        }

        if ($request->action === 'pwa_installed') {
            $parent->update(['pwa_installed' => true]);
        }

        if ($request->action === 'notifications_enabled') {
            $parent->update(['notifications_enabled' => true]);
        }

        if ($parent->pwa_installed && $parent->notifications_enabled) {
            $parent->update(['whatsapp_activated' => true]);
        }

        $parent->refresh();

        return response()->json([
            'status' => 'success',
            'pwa_installed' => $parent->pwa_installed,
            'notifications_enabled' => $parent->notifications_enabled,
            'is_fully_activated' => $parent->whatsapp_activated,
        ]);
    }

    public function checkStatus(Request $request): JsonResponse
    {
        $request->validate(['token' => 'required|string']);

        $parent = ParentModel::where('activation_token', $request->token)->first();

        if (!$parent) {
            return response()->json(['status' => 'error', 'message' => 'Token invalide'], 404);
        }

        return response()->json([
            'pwa_installed' => $parent->pwa_installed,
            'notifications_enabled' => $parent->notifications_enabled,
            'is_fully_activated' => $parent->whatsapp_activated,
        ]);
    }
}
