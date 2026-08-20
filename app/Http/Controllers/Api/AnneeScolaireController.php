<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnneeScolaire;
use App\Models\School;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnneeScolaireController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = School::findOrFail($request->current_school_id);
        $annees = $school->anneesScolaires()->orderByDesc('libelle')->get();

        return response()->json(['success' => true, 'annees' => $annees]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = School::findOrFail($request->current_school_id);

        $request->validate([
            'libelle' => 'required|string|max:20',
        ]);

        $libelle = trim($request->libelle);

        $exists = AnneeScolaire::where('school_id', $school->id)
            ->where('libelle', $libelle)
            ->exists();

        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Cette année scolaire existe déjà.'], 422);
        }

        $annee = AnneeScolaire::create([
            'school_id' => $school->id,
            'libelle' => $libelle,
            'active' => false,
        ]);

        return response()->json(['success' => true, 'annee' => $annee], 201);
    }

    public function activate(Request $request, AnneeScolaire $annee): JsonResponse
    {
        $school = School::findOrFail($request->current_school_id);

        if ($annee->school_id !== $school->id) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        // Deactivate all other years for this school
        AnneeScolaire::where('school_id', $school->id)
            ->where('id', '!=', $annee->id)
            ->update(['active' => false]);

        $annee->update(['active' => true]);

        return response()->json(['success' => true, 'annee' => $annee]);
    }

    public function destroy(Request $request, AnneeScolaire $annee): JsonResponse
    {
        $school = School::findOrFail($request->current_school_id);

        if ($annee->school_id !== $school->id) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        if ($annee->active) {
            return response()->json(['success' => false, 'message' => 'Impossible de supprimer l\'année active.'], 422);
        }

        $annee->delete();

        return response()->json(['success' => true, 'message' => 'Année supprimée.']);
    }
}
