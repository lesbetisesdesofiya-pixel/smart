<?php

namespace App\Jobs;

use App\Models\ParentModel;
use App\Models\WhatsAppConversation;
use App\Services\ZernioService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DemoFollowUp implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public int $parentId
    ) {}

    public function handle(ZernioService $zernio): void
    {
        $parent = ParentModel::find($this->parentId);

        if (!$parent || !$parent->is_demo) {
            return;
        }

        $conv = WhatsAppConversation::where('participant_phone', $parent->telephone)->first();

        if (!$conv) {
            return;
        }

        $message = "👋 Bonjour ! Votre *démo ClassiNote* de 1 heure vient de se terminer.\n\n";
        $message .= "avez-vous aimé l'expérience ?\n\n";
        $message .= "Si *oui*, n'hésitez pas à en parler à l'administration de l'école de votre enfant pour qu'elle adopte *ClassiNote*.\n\n";
        $message .= "Si vous avez des remarques ou des suggestions, nous sommes à votre écoute !\n\n";
        $message .= "💬 Répondez simplement à ce message pour nous faire part de votre ressenti.";

        $options = [
            'quickReplies' => [
                ['title' => '👍 J\'ai aimé', 'payload' => 'demo_feedback_positive'],
                ['title' => '💬 Un commentaire', 'payload' => 'demo_feedback_comment'],
            ],
        ];

        $result = $zernio->sendMessage(
            $conv->zernio_conversation_id,
            $conv->account_id,
            $message,
            null,
            $options
        );

        if (!empty($result['success'])) {
            Log::info('Zernio: message de suivi démo envoyé', ['parent_id' => $this->parentId]);
        }

        $conv->setState('awaiting_demo_feedback');

        \App\Jobs\CleanExpiredDemo::dispatch($this->parentId)->delay(now()->addMinutes(30));
    }
}
