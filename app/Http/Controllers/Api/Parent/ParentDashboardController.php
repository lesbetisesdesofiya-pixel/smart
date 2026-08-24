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
        // Support both Sanctum token and session (magic link) auth
        $parent = Auth::guard('parent')->user();
        if (!$parent) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
            if ($accessToken && $accessToken->tokenable instanceof ParentModel) {
                $parent = $accessToken->tokenable;
            }
        }

        if (!$parent) {
            return response()->json(['message' => 'Non autorisé'], 401);
        }

        $anneeActive = $this->resolveAnneeScolaire($parent);
        $eleveIds = $parent->eleves()->where('access_locked', false)->pluck('eleves.id');

        // Enfants
        $enfants = $parent->eleves()
            ->with('classe')
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'nom' => $e->nom,
                'prenom' => $e->prenom,
                'nom_complet' => trim($e->prenom . ' ' . $e->nom),
                'classe' => $e->classe ? ['libelle' => $e->classe->libelle] : null,
                'access_locked' => $e->access_locked,
            ]);

        // Premier enfant non-verrouillé pour le contexte actif
        $actifEnfant = $enfants->first(fn($e) => !$e['access_locked']) ?? $enfants->first();
        $actifId = $actifEnfant['id'] ?? null;

        // Présence aujourd'hui
        $presentToday = false;
        if ($actifId) {
            $presence = \App\Models\Presence::where('eleve_id', $actifId)
                ->whereDate('date', now())
                ->first();
            $presentToday = $presence ? $presence->est_present : true;
        }

        // Dernière note
        $derniereNote = null;
        if ($actifId) {
            $note = \App\Models\Note::where('eleve_id', $actifId)
                ->with('evaluation.matiere')
                ->latest()
                ->first();
            if ($note) {
                // Tendance des 5 dernières notes
                $tendance = \App\Models\Note::where('eleve_id', $actifId)
                    ->orderBy('id', 'desc')
                    ->take(5)
                    ->pluck('note')
                    ->reverse()
                    ->values()
                    ->toArray();

                $derniereNote = [
                    'matiere' => $note->evaluation?->matiere?->libelle ?? 'Matière',
                    'titre' => $note->evaluation?->titre ?? 'Évaluation',
                    'note' => $note->note,
                    'sur' => $note->evaluation?->note_sur ?? 20,
                    'appreciation' => $note->appreciation,
                    'tendance' => $tendance,
                ];
            }
        }

        // Résumé
        $absencesMois = 0;
        $examensAVenir = 0;
        $messagesNonLus = 0;
        $montantDu = 0;
        $montantPaye = 0;

        if ($actifId) {
            $absencesMois = \App\Models\Presence::where('eleve_id', $actifId)
                ->where('date', '>=', now()->subDays(30))
                ->where('est_present', false)
                ->count();
        }

        $examensAVenir = \App\Models\Evaluation::whereIn('classe_id', function ($q) use ($eleveIds) {
            $q->select('classe_id')->from('eleves')->whereIn('id', $eleveIds);
        })
        ->where('date', '>=', now())
        ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
        ->count();

        // Messages non lus
        $messagesNonLus = \App\Models\Message::whereHas('conversation', function ($q) use ($parent) {
            $q->where('parent_id', $parent->id);
        })
        ->where('lu', false)
        ->where(function ($q) {
            $q->where('sender_type', '!=', ParentModel::class)
              ->orWhereNull('sender_type');
        })
        ->count();

        // Paiements (simplifié - via subscriptions)
        $montantDu = 0;
        $montantPaye = 0;
        try {
            $subscriptions = \App\Models\Subscription::whereIn('eleve_id', $eleveIds)
                ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
                ->with('payments')
                ->get();
            foreach ($subscriptions as $sub) {
                $montantDu += $sub->ecolage ?? 0;
                $montantPaye += $sub->payments->where('type', 'scolarite')->sum('montant');
            }
        } catch (\Throwable $e) {
            // Ignore payment errors
        }

        // Dernier avis
        $dernierAvis = null;
        if ($actifId) {
            $avis = \App\Models\Remarque::where('eleve_id', $actifId)
                ->with('prof')
                ->latest()
                ->first();
            if ($avis) {
                $dernierAvis = [
                    'auteur' => $avis->prof ? trim($avis->prof->prenom . ' ' . $avis->prof->nom) : 'Professeur',
                    'contenu' => $avis->contenu,
                    'date' => $avis->created_at->format('Y-m-d'),
                ];
            }
        }

        return response()->json([
            'parent' => [
                'nom_complet' => trim($parent->prenom . ' ' . $parent->nom),
            ],
            'enfants' => $enfants,
            'actif' => [
                'id' => $actifId,
                'nom' => $actifEnfant['prenom'] ?? '',
                'present_aujourd_hui' => $presentToday,
                'prochain_cours' => null,
            ],
            'resume' => [
                'absences_mois' => $absencesMois,
                'examens_a_venir' => $examensAVenir,
                'messages_non_lus' => $messagesNonLus,
                'montant_du' => $montantDu,
                'montant_paye' => $montantPaye,
            ],
            'derniere_note' => $derniereNote,
            'dernier_avis' => $dernierAvis,
        ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => $e->getMessage(),
                'file' => basename($e->getFile()) . ':' . $e->getLine(),
            ], 500);
        }
    }

    private function resolveAnneeScolaire(ParentModel $parent): ?AnneeScolaire
    {
        $schoolId = $parent->eleves()->first()?->school_id;
        if (!$schoolId) return null;
        return AnneeScolaire::where('school_id', $schoolId)->where('active', true)->first();
    }

    public function absences(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);
        if (!$parent) return response()->json(['message' => 'Non autorisé'], 401);

        $eleveIds = $parent->eleves()->where('access_locked', false)->pluck('eleves.id');

        $absences = \App\Models\Presence::whereIn('eleve_id', $eleveIds)
            ->where('est_present', false)
            ->with('eleve')
            ->orderByDesc('date')
            ->take(50)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'date' => $p->date,
                'eleve' => $p->eleve ? $p->eleve->nom_complet : null,
                'matiere' => $p->matiere ?? null,
                'justifie' => $p->justifie ?? false,
            ]);

        return response()->json($absences);
    }

    public function nouveautes(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);
        if (!$parent) return response()->json(['message' => 'Non autorisé'], 401);

        $eleveIds = $parent->eleves()->where('access_locked', false)->pluck('eleves.id');
        $anneeActive = $this->resolveAnneeScolaire($parent);
        $feed = [];

        // Notes récentes
        $notes = \App\Models\Note::whereIn('eleve_id', $eleveIds)
            ->with('evaluation.matiere', 'eleve')
            ->latest()
            ->take(10)
            ->get();
        foreach ($notes as $n) {
            $feed[] = [
                'id' => 'note-' . $n->id,
                'type' => 'note',
                'titre' => $n->evaluation?->titre ?? 'Note',
                'contenu' => $n->eleve?->nom_complet . ' : ' . $n->note . '/' . ($n->evaluation?->note_sur ?? 20) . ' en ' . ($n->evaluation?->matiere?->libelle ?? ''),
                'date' => $n->created_at,
            ];
        }

        // Remarques récentes
        $remarques = \App\Models\Remarque::whereIn('eleve_id', $eleveIds)
            ->with('prof', 'eleve')
            ->latest()
            ->take(10)
            ->get();
        foreach ($remarques as $r) {
            $feed[] = [
                'id' => 'avis-' . $r->id,
                'type' => 'avis',
                'titre' => $r->prof ? $r->prof->nom_complet : 'Professeur',
                'contenu' => $r->contenu,
                'date' => $r->created_at,
            ];
        }

        // Absences récentes
        $absences = \App\Models\Presence::whereIn('eleve_id', $eleveIds)
            ->where('est_present', false)
            ->with('eleve')
            ->orderByDesc('date')
            ->take(10)
            ->get();
        foreach ($absences as $a) {
            $feed[] = [
                'id' => 'absence-' . $a->id,
                'type' => 'absence',
                'titre' => 'Absence',
                'contenu' => $a->eleve?->nom_complet . ' absent(e) le ' . ($a->date ? date('d/m/Y', strtotime($a->date)) : ''),
                'date' => $a->date,
            ];
        }

        // Trier par date décroissante
        usort($feed, fn($a, $b) => strtotime($b['date'] ?? 0) - strtotime($a['date'] ?? 0));

        return response()->json(array_slice($feed, 0, 30));
    }

    private function getParent(Request $request): ?ParentModel
    {
        $parent = Auth::guard('parent')->user();
        if (!$parent) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
            if ($accessToken && $accessToken->tokenable instanceof ParentModel) {
                $parent = $accessToken->tokenable;
            }
        }
        return $parent;
    }
}
