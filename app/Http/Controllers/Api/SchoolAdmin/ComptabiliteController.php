<?php

namespace App\Http\Controllers\Api\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AnneeScolaire;
use App\Models\Decaissement;
use App\Models\School;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComptabiliteController extends Controller
{
    private function getSchool(Request $request): School
    {
        return School::findOrFail($request->current_school_id);
    }

    private function resolveAnneeScolaire(Request $request, School $school): ?AnneeScolaire
    {
        if ($request->filled('annee_scolaire_id')) {
            return AnneeScolaire::where('school_id', $school->id)->find($request->annee_scolaire_id);
        }
        return $school->anneesScolaires()->where('active', true)->first();
    }

    public function dashboard(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        // Encaissements (payments received)
        $encaissementsQuery = SubscriptionPayment::whereHas('subscription', function ($q) use ($school, $anneeActive) {
            $q->whereHas('eleve', fn($eq) => $eq->where('school_id', $school->id));
            if ($anneeActive) $q->where('annee_scolaire_id', $anneeActive->id);
        });

        $totalEncaisse = (clone $encaissementsQuery)->sum('montant');

        $encaissementsParType = (clone $encaissementsQuery)
            ->selectRaw('type, SUM(montant) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $encaissementsParMois = (clone $encaissementsQuery)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as mois, SUM(montant) as total")
            ->groupBy('mois')
            ->orderBy('mois')
            ->pluck('total', 'mois');

        // Décaissements (expenses)
        $decaissementsQuery = Decaissement::where('school_id', $school->id)
            ->when($anneeActive, fn($q) => $q->where('date', '>=', $anneeActive->created_at));

        $totalDecaisse = (clone $decaissementsQuery)->sum('montant');

        $decaissementsParCategorie = (clone $decaissementsQuery)
            ->selectRaw('categorie, SUM(montant) as total')
            ->groupBy('categorie')
            ->pluck('total', 'categorie');

        // Solde
        $solde = $totalEncaisse - $totalDecaisse;

        return response()->json([
            'success' => true,
            'annee' => $anneeActive ? ['id' => $anneeActive->id, 'libelle' => $anneeActive->libelle] : null,
            'resume' => [
                'total_encaisse' => $totalEncaisse,
                'total_decaisse' => $totalDecaisse,
                'solde' => $solde,
            ],
            'encaissements' => [
                'par_type' => $encaissementsParType,
                'par_mois' => $encaissementsParMois,
            ],
            'decaissements' => [
                'par_categorie' => $decaissementsParCategorie,
            ],
        ]);
    }

    public function encaissements(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $query = SubscriptionPayment::whereHas('subscription', function ($q) use ($school, $anneeActive) {
            $q->whereHas('eleve', fn($eq) => $eq->where('school_id', $school->id));
            if ($anneeActive) $q->where('annee_scolaire_id', $anneeActive->id);
        })->with('subscription.eleve', 'frais');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('date_debut')) {
            $query->where('created_at', '>=', $request->date_debut);
        }

        if ($request->filled('date_fin')) {
            $query->where('created_at', '<=', $request->date_fin . ' 23:59:59');
        }

        $payments = $query->latest()->paginate(50);

        return response()->json([
            'success' => true,
            'payments' => $payments,
        ]);
    }

    public function decaissements(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $query = Decaissement::where('school_id', $school->id);

        if ($request->filled('categorie')) {
            $query->where('categorie', $request->categorie);
        }

        if ($request->filled('date_debut')) {
            $query->where('date', '>=', $request->date_debut);
        }

        if ($request->filled('date_fin')) {
            $query->where('date', '<=', $request->date_fin);
        }

        $decaissements = $query->latest('date')->paginate(50);

        return response()->json([
            'success' => true,
            'decaissements' => $decaissements,
        ]);
    }

    public function storeDecaissement(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $request->validate([
            'libelle' => 'required|string|max:255',
            'categorie' => 'required|in:salaire,loyer,fournitures,transport,entretien,autre',
            'montant' => 'required|numeric|min:0',
            'date' => 'required|date',
            'beneficiaire' => 'nullable|string|max:255',
            'methode_paiement' => 'nullable|in:especes,virement,cheque,wave,orange_money',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $decaissement = Decaissement::create([
            'school_id' => $school->id,
            'libelle' => $request->libelle,
            'categorie' => $request->categorie,
            'montant' => $request->montant,
            'date' => $request->date,
            'beneficiaire' => $request->beneficiaire,
            'methode_paiement' => $request->methode_paiement ?? 'especes',
            'reference' => $request->reference,
            'notes' => $request->notes,
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['success' => true, 'decaissement' => $decaissement], 201);
    }

    public function destroyDecaissement(Request $request, Decaissement $decaissement): JsonResponse
    {
        if ($decaissement->school_id != $request->current_school_id) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        $decaissement->delete();
        return response()->json(['success' => true, 'message' => 'Décaissement supprimé.']);
    }
}
