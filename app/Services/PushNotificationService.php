<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\ParentModel;
use App\Models\Prof;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    private string $projectId;
    private string $serviceAccountPath;

    public function __construct()
    {
        $this->projectId = config('services.firebase.project_id');
        $this->serviceAccountPath = config('services.firebase.service_account_path');
    }

    private function getAccessToken(): string
    {
        $serviceAccount = json_decode(file_get_contents($this->serviceAccountPath), true);

        $now = time();
        $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'iss' => $serviceAccount['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ]));

        $data = "$header.$payload";
        $signature = '';

        openssl_sign($data, $signature, $serviceAccount['private_key'], 'SHA256');

        $jwt = "$data." . base64_encode($signature);

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if ($response->failed()) {
            Log::error('Firebase: Échec de l\'obtention du token d\'accès', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception('Impossible d\'obtenir le token d\'accès Firebase');
        }

        return $response->json('access_token');
    }

    private function storeNotification($notifiable, string $titre, string $contenu, string $type = 'info', array $data = []): void
    {
        Notification::create([
            'notifiable_type' => get_class($notifiable),
            'notifiable_id' => $notifiable->id,
            'titre' => $titre,
            'contenu' => $contenu,
            'type' => $type,
            'data' => $data,
        ]);
    }

    public function sendToDevice(string $deviceToken, string $title, string $body, array $data = []): bool
    {
        try {
            $accessToken = $this->getAccessToken();

            $payload = [
                'message' => [
                    'token' => $deviceToken,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                    ],
                    'data' => array_map('strval', $data),
                    'android' => [
                        'priority' => 'high',
                    ],
                    'webpush' => [
                        'headers' => [
                            'TTL' => '86400',
                            'Urgency' => 'high',
                        ],
                        'notification' => [
                            'icon' => '/smart/public/app/parent/icons/icon-192x192.png',
                            'badge' => '/smart/public/app/parent/icons/badge-72x72.png',
                        ],
                    ],
                ],
            ];

            $response = Http::withToken($accessToken)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post("https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send", $payload);

            if ($response->successful()) {
                return true;
            }

            Log::error('Firebase: Erreur envoi notification', [
                'status' => $response->status(),
                'body' => $response->body(),
                'token' => substr($deviceToken, 0, 20) . '...',
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('Firebase: Exception envoi notification', [
                'message' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function sendToParent(ParentModel $parent, string $title, string $body, array $data = []): bool
    {
        $this->storeNotification($parent, $title, $body, $data['type'] ?? 'info', $data);

        if (!$parent->device_token) {
            return false;
        }

        return $this->sendToDevice($parent->device_token, $title, $body, $data);
    }

    public function sendToProf(Prof $prof, string $title, string $body, array $data = []): bool
    {
        $this->storeNotification($prof, $title, $body, $data['type'] ?? 'info', $data);

        if (!$prof->device_token) {
            return false;
        }

        return $this->sendToDevice($prof->device_token, $title, $body, $data);
    }

    public function sendToAdmin(User $admin, string $title, string $body, array $data = []): bool
    {
        $this->storeNotification($admin, $title, $body, $data['type'] ?? 'info', $data);

        if (!$admin->device_token) {
            return false;
        }

        return $this->sendToDevice($admin->device_token, $title, $body, $data);
    }

    public function notifyParentBlocked(ParentModel $parent, string $eleveNom, string $message): bool
    {
        return $this->sendToParent(
            $parent,
            'Accès bloqué',
            "L'accès de $eleveNom a été verrouillé. $message",
            ['type' => 'parent_blocked', 'eleve' => $eleveNom]
        );
    }

    public function notifyParentNewGrade(ParentModel $parent, string $eleveNom, string $matiere, float $note, float $noteSur): bool
    {
        return $this->sendToParent(
            $parent,
            'Nouvelle note',
            "$eleveNom a reçu $note/$noteSur en $matiere",
            ['type' => 'parent_new_grade', 'eleve' => $eleveNom, 'matiere' => $matiere]
        );
    }

    public function notifyParentNewRemark(ParentModel $parent, string $eleveNom, string $typeRemarque): bool
    {
        return $this->sendToParent(
            $parent,
            'Nouvelle remarque',
            "Une remarque ($typeRemarque) a été ajoutée pour $eleveNom",
            ['type' => 'parent_new_remark', 'eleve' => $eleveNom]
        );
    }

    public function notifyParentAbsence(ParentModel $parent, string $eleveNom, string $date): bool
    {
        return $this->sendToParent(
            $parent,
            'Absence signalée',
            "$eleveNom est absent(e) le $date",
            ['type' => 'parent_absence', 'eleve' => $eleveNom, 'date' => $date]
        );
    }

    public function notifyParentMessage(ParentModel $parent, string $senderName, string $preview): bool
    {
        return $this->sendToParent(
            $parent,
            'Nouveau message',
            "De $senderName: $preview",
            ['type' => 'parent_message', 'sender' => $senderName]
        );
    }

    public function notifyProfMessage(Prof $prof, string $senderName, string $preview): bool
    {
        return $this->sendToProf(
            $prof,
            'Nouveau message',
            "De $senderName: $preview",
            ['type' => 'prof_message', 'sender' => $senderName]
        );
    }

    public function notifyProfAccessRequest(Prof $prof, string $parentNom, string $eleveNom): bool
    {
        return $this->sendToProf(
            $prof,
            'Demande d\'accès',
            "$parentNom demande l'accès pour $eleveNom",
            ['type' => 'prof_access_request', 'parent' => $parentNom, 'eleve' => $eleveNom]
        );
    }

    public function notifyAdminAccessRequest(User $admin, string $parentNom, string $eleveNom): bool
    {
        return $this->sendToAdmin(
            $admin,
            'Nouvelle demande d\'accès',
            "$parentNom demande l'accès pour $eleveNom",
            ['type' => 'admin_access_request', 'parent' => $parentNom, 'eleve' => $eleveNom]
        );
    }

    public function notifyAdminMessage(User $admin, string $senderName, string $preview): bool
    {
        return $this->sendToAdmin(
            $admin,
            'Nouveau message',
            "De $senderName: $preview",
            ['type' => 'admin_message', 'sender' => $senderName]
        );
    }
}
