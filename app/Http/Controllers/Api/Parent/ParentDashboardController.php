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
        $messagesNonLus = \App\Models\Message::where(function ($q) use ($parent) {
            $q->where('destinable_type', ParentModel::class)
              ->where('destinable_id', $parent->id)
              ->where('lu', false);
        })->count();

        // Paiements
        $frais = \App\Models\Frais::whereIn('eleve_id', $eleveIds)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->get();
        $montantDu = $frais->sum('montant');
        $montantPaye = $frais->where('statut', 'paye')->sum('montant');

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
    }

    private function resolveAnneeScolaire(ParentModel $parent): ?AnneeScolaire
    {
        $schoolId = $parent->eleves()->first()?->school_id;
        if (!$schoolId) return null;
        return AnneeScolaire::where('school_id', $schoolId)->where('active', true)->first();
    }
}
