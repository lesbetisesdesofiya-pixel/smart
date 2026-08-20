<?php

namespace App\Console\Commands;

use App\Models\ParentModel;
use App\Models\Eleve;
use App\Models\Note;
use App\Models\Evaluation;
use App\Models\Presence;
use App\Models\EleveClasse;
use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DemoCleanup extends Command
{
    protected $signature = 'demo:cleanup {--parent_id= : ID du parent démo à nettoyer} {--force : Supprimer même si pas expiré}';
    protected $description = 'Nettoie les comptes démo expirés (parents + élèves + notes)';

    public function handle(): int
    {
        $parentId = $this->option('parent_id');
        $force = $this->option('force');

        $query = ParentModel::where('is_demo', true);

        if ($parentId) {
            $query->where('id', $parentId);
        } elseif (!$force) {
            $query->where('demo_expires_at', '<=', now());
        }

        $demos = $query->get();

        if ($demos->isEmpty()) {
            $this->info('Aucun compte démo à nettoyer.');
            return self::SUCCESS;
        }

        $deleted = 0;

        foreach ($demos as $parent) {
            if (!$force && $parent->demo_expires_at && $parent->demo_expires_at->isFuture()) {
                $this->info("Parent #{$parent->id} pas encore expiré, skip.");
                continue;
            }

            $eleves = $parent->eleves;

            foreach ($eleves as $eleve) {
                Note::whereIn('evaluation_id', function ($q) use ($eleve) {
                    $q->select('id')->from('evaluations')->where('school_id', $eleve->school_id);
                })->where('eleve_id', $eleve->id)->delete();

                Evaluation::where('school_id', $eleve->school_id)->delete();

                Presence::where('eleve_id', $eleve->id)->delete();

                EleveClasse::where('eleve_id', $eleve->id)->delete();

                Subscription::where('eleve_id', $eleve->id)->delete();

                $eleve->parents()->detach();
                $eleve->delete();
            }

            $parent->delete();
            $deleted++;

            Log::info("Zernio: compte démo nettoyé", ['parent_id' => $parent->id]);
        }

        $this->info("✅ {$deleted} compte(s) démo nettoyé(s).");
        return self::SUCCESS;
    }
}
