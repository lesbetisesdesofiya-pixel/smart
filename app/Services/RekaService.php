<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RekaService
{
    private string $apiKey;
    private string $baseUrl = 'https://api.reka.ai/v1';

    public function __construct()
    {
        $this->apiKey = config('reka.api_key', '');
    }

    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    public function chat(string $systemPrompt, string $userMessage, float $temperature = 0.7, int $maxTokens = 500): ?string
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-Api-Key' => $this->apiKey,
            ])->timeout(15)->post("{$this->baseUrl}/chat/completions", [
                'model' => 'reka-flash',
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userMessage],
                ],
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['choices'][0]['message']['content'] ?? null;
            }

            Log::warning('Reka: échec chat', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Throwable $e) {
            Log::error('Reka: exception chat', ['message' => $e->getMessage()]);
            return null;
        }
    }
}
