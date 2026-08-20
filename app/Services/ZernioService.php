<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ZernioService
{
    private string $baseUrl;
    private string $apiKey;
    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('zernio.base_url');
        $this->apiKey = config('zernio.api_key');
        $this->timeout = config('zernio.timeout', 30);
    }

    private function client()
    {
        return Http::withToken($this->apiKey)
            ->baseUrl($this->baseUrl)
            ->timeout($this->timeout);
    }

    public function listConversations(array $params = []): ?array
    {
        try {
            $response = $this->client()->get('/v1/inbox/conversations', array_merge([
                'platform' => 'whatsapp',
            ], $params));
        } catch (\Throwable $e) {
            Log::error('Zernio: exception listConversations', ['message' => $e->getMessage()]);
            return null;
        }

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Zernio: échec listConversations', [
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function getMessages(string $conversationId, string $accountId, array $params = []): ?array
    {
        try {
            $response = $this->client()->get("/v1/inbox/conversations/{$conversationId}/messages", array_merge([
                'accountId' => $accountId,
            ], $params));
        } catch (\Throwable $e) {
            Log::error('Zernio: exception getMessages', ['message' => $e->getMessage()]);
            return null;
        }

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Zernio: échec getMessages', [
            'conversationId' => $conversationId,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function sendMessage(string $conversationId, string $accountId, string $message, ?string $attachmentUrl = null, array $options = []): ?array
    {
        $payload = [
            'accountId' => $accountId,
        ];

        if ($message !== '') {
            $payload['message'] = $message;
        }

        if ($attachmentUrl) {
            $payload['attachmentUrl'] = $attachmentUrl;
        }

        if (!empty($options['buttons'])) {
            $payload['buttons'] = $options['buttons'];
        }

        if (!empty($options['quickReplies'])) {
            $payload['quickReplies'] = $options['quickReplies'];
        }

        if (!empty($options['interactive'])) {
            $payload['interactive'] = $options['interactive'];
        }

        try {
            $response = $this->client()->post("/v1/inbox/conversations/{$conversationId}/messages", $payload);
        } catch (\Throwable $e) {
            Log::error('Zernio: exception sendMessage', [
                'conversationId' => $conversationId,
                'message' => $e->getMessage(),
            ]);
            return ['error' => true, 'exception' => $e->getMessage()];
        }

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Zernio: échec sendMessage', [
            'conversationId' => $conversationId,
            'status' => $response->status(),
            'body' => $response->body(),
            'payload' => $payload,
        ]);

        return ['error' => true, 'status' => $response->status(), 'body' => $response->json()];
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $secret = config('zernio.webhook_secret');

        if (!$secret) {
            Log::warning('Zernio: webhook_secret non configuré');
            return false;
        }

        $expected = hash_hmac('sha256', $payload, $secret);

        return hash_equals($expected, $signature);
    }

    public function sendTypingIndicator(string $conversationId, string $accountId): bool
    {
        try {
            $response = $this->client()->post("/v1/inbox/conversations/{$conversationId}/typing", [
                'accountId' => $accountId,
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            return false;
        }
    }
}
