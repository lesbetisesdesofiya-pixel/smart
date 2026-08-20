<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\ParentModel;
use App\Models\Prof;
use App\Models\User;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private PushNotificationService $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    private function getAuthUser(Request $request): \Illuminate\Database\Eloquent\Model
    {
        $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
        if (!$accessToken) {
            abort(401, 'Token invalide');
        }
        return $accessToken->tokenable;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $this->getAuthUser($request);

        $notifications = Notification::where('notifiable_type', get_class($user))
            ->where('notifiable_id', $user->id)
            ->latest()
            ->take(50)
            ->get()
            ->map(fn($n) => [
                'id' => $n->id,
                'titre' => $n->titre,
                'contenu' => $n->contenu,
                'type' => $n->type,
                'lu' => $n->lu,
                'data' => $n->data,
                'created_at' => $n->created_at->toISOString(),
            ]);

        $unreadCount = Notification::where('notifiable_type', get_class($user))
            ->where('notifiable_id', $user->id)
            ->where('lu', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user = $this->getAuthUser($request);

        Notification::where('notifiable_type', get_class($user))
            ->where('notifiable_id', $user->id)
            ->where('id', $id)
            ->update(['lu' => true]);

        return response()->json(['success' => true]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $this->getAuthUser($request);

        Notification::where('notifiable_type', get_class($user))
            ->where('notifiable_id', $user->id)
            ->where('lu', false)
            ->update(['lu' => true]);

        return response()->json(['success' => true]);
    }

    public function saveToken(Request $request): JsonResponse
    {
        $request->validate([
            'device_token' => 'required|string',
        ]);

        $user = $this->getAuthUser($request);

        $user->forceFill(['device_token' => $request->device_token])->save();

        return response()->json([
            'success' => true,
            'message' => 'Device token enregistré',
        ]);
    }

    public function removeToken(Request $request): JsonResponse
    {
        $user = $this->getAuthUser($request);
        $user->forceFill(['device_token' => null])->save();

        return response()->json([
            'success' => true,
            'message' => 'Device token supprimé',
        ]);
    }

    public function testNotification(Request $request): JsonResponse
    {
        $user = $this->getAuthUser($request);

        $pushSent = false;

        if ($user instanceof ParentModel) {
            $pushSent = $this->pushService->sendToParent(
                $user,
                'Test ClassiNote',
                'Si vous voyez cette notification, tout fonctionne !',
                ['type' => 'test']
            );
        } elseif ($user instanceof Prof) {
            $pushSent = $this->pushService->sendToProf(
                $user,
                'Test ClassiNote',
                'Si vous voyez cette notification, tout fonctionne !',
                ['type' => 'test']
            );
        } elseif ($user instanceof User) {
            $pushSent = $this->pushService->sendToAdmin(
                $user,
                'Test ClassiNote',
                'Si vous voyez cette notification, tout fonctionne !',
                ['type' => 'test']
            );
        }

        $message = $pushSent
            ? 'Notification de test envoyée (push + enregistrée)'
            : 'Notification enregistrée (push non disponible - device_token=' . ($user->device_token ? 'present' : 'absent') . ')';

        return response()->json(['success' => true, 'message' => $message]);
    }
}
