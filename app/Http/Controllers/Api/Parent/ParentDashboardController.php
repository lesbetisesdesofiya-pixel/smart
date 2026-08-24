<?php

namespace App\Http\Controllers\Api\Parent;

use App\Http\Controllers\Controller;
use App\Models\AnneeScolaire;
use App\Models\ParentModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ParentDashboardController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $parent = $this->getParent($request);
            if (!$parent) return response()->json(['message' => 'Non autorisé'], 401);

            $anneeActive = $this->resolveAnneeScolaire($parent);
            $eleveIds = $parent->eleves()->where('access_locked', false)->pluck('eleves.id');

            // Enfants
            $enfants = $parent->eleves()->with('classe')->get()->map(fn($e) => [
                'id' => $e->id, 'nom' => $e->nom, 'prenom' => $e->prenom,
                'nom_complet' => trim($e->prenom . ' ' . $e->nom),
                'classe' => $e->classe ? ['libelle' => $e->classe->libelle] : null,
                'access_locked' => $e->access_locked,
            ]);

            $actifEnfant = $enfants->first(fn($e) => !$e['access_locked']) ?? $enfants->first();
            $actifId = $actifEnfant['id'] ?? null;

            // Présence aujourd'hui
            $presentToday = true;
            if ($actifId) {
                $p = \App\Models\Presence::where('eleve_id', $actifId)->whereDate('date', now())->first();
                $presentToday = $p ? (bool) $p->est_present : true;
            }

            // Dernière note + tendance
            $derniereNote = null;
            if ($actifId) {
                $note = \App\Models\Note::where('eleve_id', $actifId)->with('evaluation.matiere')->latest()->first();
                if ($note) {
                    $tendance = \App\Models\Note::where('eleve_id', $actifId)->orderBy('id', 'desc')->take(5)->pluck('note')->reverse()->values()->toArray();
                    $derniereNote = [
                        'matiere' => $note->evaluation?->matiere?->libelle ?? 'Matière',
                        'titre' => $note->evaluation?->titre ?? 'Évaluation',
                        'note' => $note->note, 'sur' => $note->evaluation?->note_sur ?? 20,
                        'appreciation' => $note->appreciation, 'tendance' => $tendance,
                    ];
                }
            }

            // Résumé
            $absencesMois = $actifId ? \App\Models\Presence::where('eleve_id', $actifId)->where('date', '>=', now()->subDays(30))->where('est_present', false)->count() : 0;
            $examensAVenir = \App\Models\Evaluation::whereIn('classe_id', fn($q) => $q->select('classe_id')->from('eleves')->whereIn('id', $eleveIds))->where('date', '>=', now())->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))->count();
            $messagesNonLus = \App\Models\Message::whereHas('conversation', fn($q) => $q->where('parent_id', $parent->id))->where('lu', false)->where(fn($q) => $q->where('sender_type', '!=', ParentModel::class)->orWhereNull('sender_type'))->count();

            $montantDu = 0; $montantPaye = 0;
            $subscriptions = collect();
            try {
                $subscriptions = \App\Models\Subscription::whereIn('eleve_id', $eleveIds)->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))->with('payments')->get();
                foreach ($subscriptions as $sub) {
                    $montantDu += $sub->ecolage ?? 0;
                    $montantPaye += $sub->payments->where('type', 'scolarite')->sum('montant');
                }
            } catch (\Throwable $e) {}

            // Dernier avis
            $dernierAvis = null;
            if ($actifId) {
                $avis = \App\Models\Remarque::where('eleve_id', $actifId)->with('prof')->latest()->first();
                if ($avis) $dernierAvis = ['auteur' => $avis->prof ? trim($avis->prof->prenom . ' ' . $avis->prof->nom) : 'Professeur', 'contenu' => $avis->contenu, 'date' => $avis->created_at->format('Y-m-d')];
            }

            // === DONNÉES POUR TOUTES LES PAGES ===

            $notes = \App\Models\Note::whereIn('eleve_id', $eleveIds)->with('evaluation.matiere')->latest()->take(50)->get()->map(fn($n) => [
                'id' => $n->id, 'note' => $n->note, 'appreciation' => $n->appreciation,
                'evaluation' => $n->evaluation ? ['id' => $n->evaluation->id, 'titre' => $n->evaluation->titre, 'note_sur' => $n->evaluation->note_sur, 'coefficient' => $n->evaluation->coefficient, 'date' => $n->evaluation->date?->format('Y-m-d'), 'matiere' => $n->evaluation->matiere ? ['libelle' => $n->evaluation->matiere->libelle] : null] : null,
            ]);

            $examens = \App\Models\Evaluation::whereIn('classe_id', fn($q) => $q->select('classe_id')->from('eleves')->whereIn('id', $eleveIds))->with('matiere')->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))->orderBy('date', 'desc')->take(30)->get()->map(fn($e) => [
                'id' => $e->id, 'titre' => $e->titre, 'date' => $e->date?->format('Y-m-d'), 'coefficient' => $e->coefficient, 'note_sur' => $e->note_sur,
                'matiere' => $e->matiere ? ['libelle' => $e->matiere->libelle] : null,
            ]);

            $absences = $actifId ? \App\Models\Presence::where('eleve_id', $actifId)->where('est_present', false)->orderByDesc('date')->take(30)->get()->map(fn($a) => ['id' => $a->id, 'date' => $a->date, 'justifie' => $a->justifie ?? false])->toArray() : [];

            $remarques = \App\Models\Remarque::whereIn('eleve_id', $eleveIds)->with('prof')->latest()->take(20)->get()->map(fn($r) => [
                'id' => $r->id, 'contenu' => $r->contenu, 'type' => $r->type ?? 'Information',
                'prof' => $r->prof ? ['prenom' => $r->prof->prenom, 'nom' => $r->prof->nom] : null,
                'created_at' => $r->created_at?->format('Y-m-d H:i'),
            ]);

            $conversations = \App\Models\Conversation::where('parent_id', $parent->id)->with('prof', 'lastMessage')->orderByDesc('last_message_at')->take(20)->get()->map(fn($c) => [
                'id' => $c->id, 'subject' => $c->subject,
                'prof' => $c->prof ? ['prenom' => $c->prof->prenom, 'nom' => $c->prof->nom] : null,
                'last_message' => $c->lastMessage ? ['contenu' => $c->lastMessage->contenu] : null,
                'last_message_at' => $c->last_message_at?->format('Y-m-d H:i'),
                'unread_count' => $c->messages()->where('lu', false)->where('sender_type', '!=', ParentModel::class)->count(),
            ]);

            $paiements = $subscriptions->flatMap(fn($sub) => $sub->payments->map(fn($p) => ['id' => $p->id, 'libelle' => $p->type ?? 'Paiement', 'montant' => $p->montant, 'date' => $p->created_at?->format('Y-m-d'), 'statut' => 'paye']))->values()->toArray();

            $emploi = [];
            try {
                $emploi = \App\Models\EmploiDuTemps::whereIn('classe_id', function ($q) use ($eleveIds) {
                    $q->select('classe_id')->from('eleves')->whereIn('id', $eleveIds);
                })
                ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
                ->with('matiere', 'prof')
                ->orderBy('jour')
                ->orderBy('heure_debut')
                ->get()
                ->map(fn($e) => [
                    'id' => $e->id,
                    'jour' => $e->jour,
                    'heure' => $e->heure_debut,
                    'debut' => $e->heure_debut,
                    'fin' => $e->heure_fin,
                    'matiere' => $e->matiere?->libelle ?? 'Cours',
                    'prof' => $e->prof ? trim($e->prof->prenom . ' ' . $e->prof->nom) : null,
                    'salle' => $e->salle,
                    'classe' => $e->classe?->libelle,
                ])
                ->toArray();
            } catch (\Throwable $e) {}

            return response()->json([
                'parent' => ['nom_complet' => trim($parent->prenom . ' ' . $parent->nom)],
                'enfants' => $enfants,
                'actif' => ['id' => $actifId, 'nom' => $actifEnfant['prenom'] ?? '', 'present_aujourd_hui' => $presentToday, 'prochain_cours' => null],
                'resume' => ['absences_mois' => $absencesMois, 'examens_a_venir' => $examensAVenir, 'messages_non_lus' => $messagesNonLus, 'montant_du' => $montantDu, 'montant_paye' => $montantPaye],
                'derniere_note' => $derniereNote,
                'dernier_avis' => $dernierAvis,
                'notes' => $notes,
                'examens' => $examens,
                'absences' => $absences,
                'remarques' => $remarques,
                'conversations' => $conversations,
                'paiements' => $paiements,
                'emploi' => $emploi,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur serveur', 'error' => $e->getMessage(), 'file' => basename($e->getFile()) . ':' . $e->getLine()], 500);
        }
    }

    private function getParent(Request $request): ?ParentModel
    {
        $parent = Auth::guard('parent')->user();
        if (!$parent) {
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
            if ($token && $token->tokenable instanceof ParentModel) $parent = $token->tokenable;
        }
        return $parent;
    }

    private function resolveAnneeScolaire(ParentModel $parent): ?AnneeScolaire
    {
        $schoolId = $parent->eleves()->first()?->school_id;
        return $schoolId ? AnneeScolaire::where('school_id', $schoolId)->where('active', true)->first() : null;
    }
}
