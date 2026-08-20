<?php

namespace App\Jobs;

use App\Models\ParentModel;
use App\Models\Eleve;
use App\Models\Note;
use App\Models\Evaluation;
use App\Models\Presence;
use App\Models\EleveClasse;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\Frais;
use App\Models\Annonce;
use App\Models\Remarque;
use App\Models\WhatsAppConversation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CleanExpiredDemo implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public int $parentId
    ) {}

    public function handle(): void
    {
        $parent = ParentModel::find($this->parentId);

        if (!$parent || !$parent->is_demo) {
            return;
        }

        $phone = $parent->telephone;
        $eleves = $parent->eleves;

        foreach ($eleves as $eleve) {
            Note::where('eleve_id', $eleve->id)->delete();

            Evaluation::where('school_id', $eleve->school_id)
                ->where('classe_id', $eleve->classe_id)
                ->delete();

            Presence::where('eleve_id', $eleve->id)->delete();
            EleveClasse::where('eleve_id', $eleve->id)->delete();

            SubscriptionPayment::whereHas('subscription', fn($q) => $q->where('eleve_id', $eleve->id))->delete();
            Subscription::where('eleve_id', $eleve->id)->delete();

            Remarque::where('eleve_id', $eleve->id)->delete();

            $eleve->parents()->detach();
            $eleve->delete();
        }

        $parent->delete();

        $conv = WhatsAppConversation::where('participant_phone', $phone)->first();
        if ($conv) {
            $conv->resetState();
        }

        Log::info('Zernio: compte démo nettoyé automatiquement', ['parent_id' => $this->parentId]);
    }
}
