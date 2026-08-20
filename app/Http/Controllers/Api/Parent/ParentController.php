<?php

namespace App\Http\Controllers\Api\Parent;

use App\Http\Controllers\Controller;
use App\Models\AnneeScolaire;
use App\Models\DemandeAcces;
use App\Models\Eleve;
use App\Models\Evaluation;
use App\Models\Note;
use App\Models\ParentModel;
use App\Models\ParentFeedback;
use App\Models\Remarque;
use App\Models\Frais;
use App\Models\Subscription;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParentController extends Controller
{
    private PushNotificationService $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    private function getParent(Request $request): ParentModel
    {
        $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
        if (!$accessToken) {
            abort(401, 'Token invalide');
        }
        return $accessToken->tokenable;
    }

    private function getUnlockedEleveIds(ParentModel $parent): \Illuminate\Support\Collection
    {
        return $parent->eleves()
            ->where('access_locked', false)
            ->pluck('eleves.id');
    }

    private function resolveAnneeScolaire(Request $request, ParentModel $parent): ?AnneeScolaire
    {
        $schoolId = $parent->eleves()->first()?->school_id;
        if (!$schoolId) return null;

        return AnneeScolaire::where('school_id', $schoolId)->where('active', true)->first();
    }

    private function getBlockedEleves(ParentModel $parent): array
    {
        $eleves = $parent->eleves()->where('access_locked', true)->get();
        $anneeActive = null;

        if ($eleves->count() > 0) {
            $schoolId = $eleves->first()->school_id;
            $anneeActive = \App\Models\AnneeScolaire::where('school_id', $schoolId)->where('active', true)->first();
        }

        return $eleves->map(function ($eleve) use ($anneeActive) {
            $subscription = $eleve->subscriptions()
                ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
                ->with('payments')
                ->first();

            $ecolage = $subscription?->montant_mensuel ?? 0;
            if ($ecolage <= 0) {
                $ecolage = $eleve->classe?->ecolage ?? 0;
            }
            $scolaritePaye = $subscription
                ? $subscription->payments->where('type', 'scolarite')->sum('montant')
                : 0;
            $dette = max(0, $ecolage - $scolaritePaye);

            return [
                'id' => $eleve->id,
                'nom' => $eleve->nom,
                'prenom' => $eleve->prenom,
                'nom_complet' => $eleve->nom_complet,
                'classe' => $eleve->classe->libelle ?? '',
                'lock_message' => $eleve->lock_message,
                'dette' => [
                    'montant' => $dette,
                    'ecolage' => $ecolage,
                    'total_paye' => $scolaritePaye,
                ],
            ];
        })->toArray();
    }

    public function enfants(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $parent);
        $allEleves = $parent->eleves()->with('classe.section')->get();

        $enfants = $allEleves->map(function ($eleve) use ($anneeActive) {
            $subscription = $eleve->subscriptions()
                ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
                ->first();

            // Get the class for this year
            $classeForYear = $eleve->classe;
            if ($anneeActive) {
                $ec = $eleve->eleveClasses()->where('annee_scolaire_id', $anneeActive->id)->first();
                if ($ec) $classeForYear = $ec->classe;
            }

            return [
                'id' => $eleve->id,
                'nom' => $eleve->nom,
                'prenom' => $eleve->prenom,
                'classe' => $classeForYear?->libelle ?? $eleve->classe->libelle,
                'section' => $classeForYear?->section->libelle ?? $eleve->classe->section->libelle ?? null,
                'access_locked' => $eleve->access_locked,
                'lock_message' => $eleve->lock_message,
                'subscription' => $subscription ? [
                    'id' => $subscription->id,
                    'frais_paye' => $subscription->frais_paye,
                    'abonnement_paye' => $subscription->abonnement_paye,
                    'access_locked' => $subscription->access_locked,
                    'lock_message' => $subscription->lock_message,
                ] : null,
            ];
        });

        $blockedEleves = $this->getBlockedEleves($parent);

        return response()->json([
            'success' => true,
            'enfants' => $enfants,
            'blocked_eleves' => $blockedEleves,
            'annee_active' => $anneeActive ? ['id' => $anneeActive->id, 'libelle' => $anneeActive->libelle] : null,
            'parent' => [
                'nom_complet' => $parent->telephone ?? 'Parent',
            ],
        ]);
    }

    public function notes(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);
        $eleveIds = $this->getUnlockedEleveIds($parent);
        $anneeActive = $this->resolveAnneeScolaire($request, $parent);

        $notes = Note::whereIn('eleve_id', $eleveIds)
            ->when($anneeActive, fn($q) => $q->whereHas('evaluation', fn($eq) => $eq->where('annee_scolaire_id', $anneeActive->id)))
            ->with('evaluation.matiere', 'evaluation.periode', 'eleve')
            ->get();

        return response()->json($notes);
    }

    public function contacts(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);
        $eleves = $parent->eleves()->where('access_locked', false)->with('classe')->get();
        $classeIds = $eleves->pluck('classe_id')->unique();
        $schoolIds = $eleves->pluck('school_id')->unique();

        // Teachers who teach in the child's class
        $profs = \App\Models\Prof::whereHas('affectations', function ($q) use ($classeIds) {
                $q->whereIn('classe_id', $classeIds);
            })
            ->with('affectations.matiere', 'affectations.classe')
            ->get()
            ->map(function ($prof) {
                $classes = $prof->affectations->pluck('classe.libelle')->unique()->filter()->values();
                $matieres = $prof->affectations->pluck('matiere.libelle')->unique()->filter()->values();
                return [
                    'id' => $prof->id,
                    'type' => 'prof',
                    'nom_complet' => $prof->prenom . ' ' . $prof->nom,
                    'classes' => $classes->toArray(),
                    'matieres' => $matieres->toArray(),
                    'subtitle' => $matieres->implode(', ') . ' — ' . $classes->implode(', '),
                ];
            });

        // Admins of the school
        $admins = \App\Models\User::where('role', 'admin')
            ->whereHas('schools', function ($q) use ($schoolIds) {
                $q->whereIn('schools.id', $schoolIds);
            })
            ->get()
            ->map(fn($admin) => [
                'id' => $admin->id,
                'type' => 'admin',
                'nom_complet' => $admin->name,
                'classes' => [],
                'matieres' => [],
                'subtitle' => 'Administration',
            ]);

        return response()->json([
            'profs' => $profs,
            'admins' => $admins,
        ]);
    }

    public function avis(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);
        $eleves = $parent->eleves()->where('access_locked', false)->get();
        $schoolIds = $eleves->pluck('school_id')->unique();
        $classeIds = $eleves->pluck('classe_id')->unique();

        $annonces = \App\Models\Annonce::whereIn('school_id', $schoolIds)
            ->where('publie', true)
            ->where(function ($q) use ($classeIds) {
                $q->whereNull('classe_id')
                  ->orWhereIn('classe_id', $classeIds);
            })
            ->with('author', 'classe')
            ->latest()
            ->get();

        return response()->json($annonces);
    }

    public function paiements(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);
        $allEleveIds = $parent->eleves()->pluck('eleves.id');

        $subscriptions = Subscription::whereIn('eleve_id', $allEleveIds)
            ->with('payments', 'eleve', 'anneeScolaire', 'classe.fraisClasses.frais')
            ->get();

        $allPayments = $subscriptions->flatMap(function ($sub) {
            return $sub->payments->map(function ($payment) use ($sub) {
                return [
                    'id' => $payment->id,
                    'eleve_id' => $sub->eleve_id,
                    'eleve' => $sub->eleve->nom_complet,
                    'montant' => $payment->montant,
                    'type' => $payment->type,
                    'methode' => $payment->methode_paiement,
                    'date' => $payment->created_at->format('d/m/Y'),
                    'reference' => $payment->reference,
                ];
            });
        });

        $montantTotal = 0;
        $totalPaye = 0;

        foreach ($subscriptions as $sub) {
            $ecolage = $sub->montant_mensuel ?? 0;
            if ($ecolage <= 0) {
                $ecolage = $sub->classe?->ecolage ?? 0;
            }
            $frais = $sub->classe->fraisClasses->sum('frais.montant');
            $montantTotal += $ecolage + $frais;
            $scolaritePaye = $sub->payments->where('type', 'scolarite')->sum('montant');
            $fraisPaye = $sub->payments->where('type', 'frais')->sum('montant');
            $totalPaye += $scolaritePaye + $fraisPaye;
        }

        return response()->json([
            'payments' => $allPayments->sortByDesc('date')->values(),
            'stats' => [
                'total_paye' => $totalPaye,
                'montant_total' => $montantTotal,
                'reste_a_payer' => max(0, $montantTotal - $totalPaye),
            ],
        ]);
    }

    public function frais(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);
        $allEleves = $parent->eleves()->with('classe.fraisClasses', 'school.frais.classes')->get();

        $result = $allEleves->map(function ($eleve) {
            $classe = $eleve->classe;
            $school = $eleve->school;

            if (!$classe || !$school) {
                return null;
            }

            // Get active subscription if exists
            $subscription = $eleve->subscriptions()
                ->whereHas('anneeScolaire', fn($q) => $q->where('active', true))
                ->with('payments')
                ->first();

            // IDs des frais liés à la classe via frais_classes
            $fraisIdsLies = $classe->fraisClasses->pluck('frais_id')->toArray();

            // Tous les frais de l'école
            $tousLesFrais = $school->frais;

            // Frais visibles = frais liés à la classe + frais sans aucune classe (frais école)
            // Un frais sans classe = il n'a pas d'entrée dans frais_classes du tout
            $fraisVisibles = $tousLesFrais->filter(function ($f) use ($fraisIdsLies, $tousLesFrais) {
                // Si le frais est lié à sa classe, on l'inclut
                if (in_array($f->id, $fraisIdsLies)) return true;
                // Si le frais n'est lié à AUCUNE classe (frais école), on l'inclut aussi
                return $f->classes->isEmpty();
            });

            $fraisItems = $fraisVisibles->map(function ($frais) use ($subscription) {
                $paye = $subscription && $subscription->payments
                    ? $subscription->payments
                        ->where('type', 'frais')
                        ->where('frais_id', $frais->id)
                        ->isNotEmpty()
                    : false;
                return [
                    'id' => $frais->id,
                    'libelle' => $frais->libelle,
                    'montant' => $frais->montant,
                    'description' => $frais->description,
                    'paye' => $paye,
                ];
            })->values();

            // Total frais annexes
            $totalFrais = $fraisItems->sum('montant');
            $totalFraisPaye = $fraisItems->where('paye', true)->sum('montant');

            // Scolarité (payé libre, sans tracker les mois)
            $ecolage = $subscription->montant_mensuel ?? 0;
            if ($ecolage <= 0) {
                $ecolage = $classe->ecolage ?? 0;
            }
            $scolaritePaye = $subscription && $subscription->payments
                ? $subscription->payments->where('type', 'scolarite')->sum('montant')
                : 0;
            $resteScolarite = max(0, $ecolage - $scolaritePaye);

            // Abonnement
            $abonnementPaye = $subscription ? ($subscription->abonnement_paye ?? false) : false;

            // Total général
            $totalGeneral = $ecolage + $totalFrais;
            $totalPayeGeneral = $scolaritePaye + $totalFraisPaye;
            $resteGeneral = max(0, $totalGeneral - $totalPayeGeneral);

            // Historique paiements
            $historique = $subscription && $subscription->payments
                ? $subscription->payments->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'montant' => $p->montant,
                        'type' => $p->type,
                        'methode' => $p->methode_paiement,
                        'reference' => $p->reference,
                        'date' => $p->created_at->format('d/m/Y'),
                    ];
                })->sortByDesc('date')->values()
                : collect();

            return [
                'eleve_id' => $eleve->id,
                'eleve_nom' => $eleve->nom_complet,
                'classe' => $classe->libelle,
                'scolarite' => [
                    'montant' => $ecolage,
                    'paye' => $scolaritePaye,
                    'reste' => $resteScolarite,
                ],
                'frais' => [
                    'total' => $totalFrais,
                    'paye' => $totalFraisPaye,
                    'reste' => max(0, $totalFrais - $totalFraisPaye),
                    'items' => $fraisItems,
                ],
                'abonnement' => [
                    'paye' => $abonnementPaye,
                ],
                'total_general' => $totalGeneral,
                'total_paye' => $totalPayeGeneral,
                'reste_general' => $resteGeneral,
                'historique' => $historique,
            ];
        });

        return response()->json(['success' => true, 'frais' => $result->filter()->values()]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'montant' => 'required|numeric|min:0',
            'type' => 'required|in:scolarite,frais,abonnement',
            'methode_paiement' => 'required|in:wave,orange_money,mtn_momo,free_money,carte_bancaire',
            'mois' => 'nullable|string|max:20',
            'months' => 'nullable|array',
            'months.*' => 'string|max:20',
            'frais_id' => 'nullable|exists:frais,id',
        ]);

        $parent = $this->getParent($request);

        $eleve = Eleve::where('id', $request->eleve_id)
            ->where('access_locked', false)
            ->whereHas('parents', fn($q) => $q->where('parent_id', $parent->id))
            ->first();

        if (!$eleve) {
            return response()->json(['message' => 'Cet élève n\'est pas lié à votre compte ou son accès est bloqué'], 403);
        }

        $subscription = $eleve->subscriptions()
            ->whereHas('anneeScolaire', fn($q) => $q->where('active', true))
            ->first();

        if (!$subscription) {
            return response()->json(['message' => 'Aucune inscription active pour cet élève'], 404);
        }

        $type = $request->type;
        $months = $request->months ?? ($request->mois ? [$request->mois] : []);

        if ($type === 'scolarite') {
            $payment = $subscription->payments()->create([
                'montant' => $request->montant,
                'type' => 'scolarite',
                'methode_paiement' => $request->methode_paiement,
                'reference' => 'PAY-' . strtoupper(uniqid()),
            ]);

            return response()->json(['success' => true, 'payment' => $payment], 201);
        }

        $payment = $subscription->payments()->create([
            'montant' => $request->montant,
            'type' => $type,
            'methode_paiement' => $request->methode_paiement,
            'reference' => 'PAY-' . strtoupper(uniqid()),
            'frais_id' => $request->frais_id,
        ]);

        if ($type === 'frais') {
            $subscription->update(['frais_paye' => true]);
        } elseif ($type === 'abonnement') {
            $subscription->update(['abonnement_paye' => true]);
        }

        return response()->json(['success' => true, 'payment' => $payment], 201);
    }

    public function emploiDuTemps(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);
        $eleveIds = $this->getUnlockedEleveIds($parent);
        $anneeActive = $this->resolveAnneeScolaire($request, $parent);

        $edt = \App\Models\EmploiDuTemps::whereIn('classe_id', function ($q) use ($eleveIds) {
                $q->select('classe_id')->from('eleves')->whereIn('id', $eleveIds);
            })
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('matiere', 'prof')
            ->orderBy('jour')
            ->orderBy('heure_debut')
            ->get();

        return response()->json($edt);
    }

    public function searchParent(Request $request): JsonResponse
    {
        $request->validate([
            'nom_eleve' => 'required|string|min:2',
        ]);

        $parent = $this->getParent($request);
        $parentEleveIds = $parent->eleves()->pluck('eleves.id');

        $eleves = Eleve::whereIn('id', $parentEleveIds)
            ->where(function ($q) use ($request) {
                $search = preg_replace('/[%,_]/', '', $request->nom_eleve);
                $q->where('nom', 'like', "%{$search}%")
                    ->orWhere('prenom', 'like', "%{$search}%");
            })
            ->with('classe')
            ->get();

        $results = $eleves->map(function ($eleve) {
            return [
                'eleve' => $eleve->nom_complet,
                'classe' => $eleve->classe?->libelle ?? '',
            ];
        });

        return response()->json($results);
    }

    public function remarques(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);
        $eleveIds = $parent->eleves()->pluck('eleves.id');

        $remarques = Remarque::whereIn('eleve_id', $eleveIds)
            ->where('visible_parent', true)
            ->with('eleve', 'prof.affectations.matiere')
            ->latest()
            ->get();

        return response()->json($remarques);
    }

    public function storeFeedback(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:avis,suggestion,bug',
            'subject' => 'nullable|string|max:255',
            'contenu' => 'required|string|max:2000',
        ]);

        $parent = $this->getParent($request);

        ParentFeedback::create([
            'parent_id' => $parent->id,
            'type' => $request->type,
            'subject' => $request->subject,
            'contenu' => $request->contenu,
        ]);

        return response()->json(['success' => true, 'message' => 'Merci pour votre retour !']);
    }

    public function storeDemandeAcces(Request $request): JsonResponse
    {
        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'type' => 'required|in:unlock_access,view_grades,view_notes',
            'raison' => 'nullable|string|max:500',
        ]);

        $parent = $this->getParent($request);
        $eleve = Eleve::with('school')->findOrFail($request->eleve_id);

        $isLinked = $parent->eleves()->where('eleves.id', $eleve->id)->exists();
        if (!$isLinked) {
            return response()->json(['message' => 'Cet élève n\'est pas lié à votre compte'], 403);
        }

        $demande = DemandeAcces::create([
            'parent_id' => $parent->id,
            'eleve_id' => $request->eleve_id,
            'school_id' => $eleve->school_id,
            'type' => $request->type,
            'raison' => $request->raison,
        ]);

        $parentNom = $parent->prenom . ' ' . $parent->nom;
        $eleveNom = $eleve->nom_complet;
        $admins = \App\Models\User::where('role', 'admin')
            ->whereHas('schools', fn($q) => $q->where('schools.id', $eleve->school_id))
            ->get();
        foreach ($admins as $admin) {
            $this->pushService->notifyAdminAccessRequest($admin, $parentNom, $eleveNom);
        }

        return response()->json($demande, 201);
    }

    public function demandesAcces(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);

        $demandes = DemandeAcces::where('parent_id', $parent->id)
            ->with('eleve')
            ->latest()
            ->get();

        return response()->json($demandes);
    }

    public function evaluations(Request $request): JsonResponse
    {
        $parent = $this->getParent($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $parent);
        $eleveIds = $parent->enfants()->pluck('eleves.id');
        $classeIds = Eleve::whereIn('id', $eleveIds)->pluck('classe_id');

        $evaluations = \App\Models\Evaluation::where('is_group_parent', false)
            ->whereIn('classe_id', $classeIds)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('classe', 'matiere', 'periode')
            ->orderBy('date')
            ->get();

        return response()->json($evaluations);
    }
}
