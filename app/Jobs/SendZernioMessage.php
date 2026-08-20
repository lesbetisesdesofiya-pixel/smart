<?php

namespace App\Jobs;

use App\Models\WhatsAppMessage;
use App\Services\ZernioService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendZernioMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public $backoff = [5, 15];

    public function __construct(
        public int $conversationDbId,
        public string $zernioConversationId,
        public string $accountId,
        public string $text,
        public array $quickReplies = [],
        public ?array $interactive = null
    ) {}

    public function handle(ZernioService $zernio): void
    {
        $options = $this->quickReplies ? ['quickReplies' => $this->quickReplies] : [];

        if ($this->interactive) {
            $options['interactive'] = $this->interactive;
        }

        $result = $zernio->sendMessage(
            $this->zernioConversationId,
            $this->accountId,
            $this->text,
            null,
            $options
        );

        if (!empty($result['success'])) {
            WhatsAppMessage::create([
                'conversation_id' => $this->conversationDbId,
                'zernio_message_id' => $result['data']['messageId'] ?? null,
                'direction' => 'outgoing',
                'message' => $this->text,
                'status' => 'sent',
                'sent_at' => now(),
            ]);
        } elseif (!empty($result['error'])) {
            Log::error('Zernio: échec envoi message (queue)', [
                'conversation_id' => $this->zernioConversationId,
                'result' => $result,
            ]);
        }
    }
}
