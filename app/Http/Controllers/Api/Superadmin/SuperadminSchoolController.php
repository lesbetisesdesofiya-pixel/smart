<?php

namespace App\Http\Controllers\Api\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Prof;
use App\Models\AnneeScolaire;
use App\Models\Evaluation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperadminSchoolController extends Controller
{
    public function dashboard(School $school): JsonResponse
    {
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $nbClasses = Classe::where('school_id', $school->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->count();

        $nbEleves = Eleve::where('school_id', $school->id)
            ->where('active', true)
            ->when($anneeActive, fn($q) => $q->whereHas('eleveClasses', fn($eq) => $eq->where('annee_scolaire_id', $anneeActive->id)))
            ->count();

        $nbProfs = Prof::where('school_id', $school->id)->where('active', true)->count();

        $nbEvaluations = Evaluation::where('school_id', $school->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->count();

        return response()->json([
            'school' => [
                'id' => $school->id,
                'nom' => $school->nom,
                'adresse' => $school->adresse,
                'telephone' => $school->telephone,
                'email' => $school->email,
                'ai_notes_enabled' => $school->ai_notes_enabled ?? false,
            ],
            'stats' => [
                'nb_classes' => $nbClasses,
                'nb_eleves' => $nbEleves,
                'nb_profs' => $nbProfs,
                'nb_evaluations' => $nbEvaluations,
            ],
        ]);
    }

    public function classes(School $school): JsonResponse
    {
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $classes = Classe::where('school_id', $school->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('section')
            ->withCount('eleves')
            ->get();

        return response()->json(['success' => true, 'classes' => $classes]);
    }

    public function eleves(School $school): JsonResponse
    {
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $eleves = $school->eleves()
            ->with('classe', 'parents')
            ->where('active', true)
            ->when($anneeActive, fn($q) => $q->whereHas('eleveClasses', fn($eq) => $eq->where('annee_scolaire_id', $anneeActive->id)))
            ->get();

        return response()->json($eleves);
    }

    public function profs(School $school): JsonResponse
    {
        $profs = $school->profs()
            ->with('affectations.matiere', 'affectations.classe')
            ->where('active', true)
            ->get();

        $profs->each(function ($prof) {
            if (!$prof->code_used) {
                $prof->makeVisible(['code']);
            }
            $prof->makeVisible(['code_used']);
        });

        return response()->json(['success' => true, 'profs' => $profs]);
    }

    public function evaluations(School $school): JsonResponse
    {
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $evaluations = Evaluation::where('school_id', $school->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('matiere', 'classes', 'periode')
            ->withCount('notes')
            ->orderByDesc('date')
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'titre' => $e->titre,
                'type' => $e->type,
                'date' => $e->date,
                'coefficient' => $e->coefficient,
                'note_sur' => $e->note_sur,
                'matiere' => $e->matiere?->libelle,
                'matiere_id' => $e->matiere_id,
                'periode' => $e->periode?->libelle,
                'periode_id' => $e->periode_id,
                'classes' => $e->classes->map(fn($c) => [
                    'id' => $c->id,
                    'libelle' => $c->libelle,
                    'classe_id' => $c->classe_id,
                    'nb_notes' => $c->nb_notes ?? 0,
                ]),
                'nb_classes' => $e->classes->count(),
            ]);

        return response()->json(['evaluations' => $evaluations]);
    }

    public function matieres(School $school): JsonResponse
    {
        $matieres = $school->matieres()->get();
        return response()->json($matieres);
    }

    public function affectations(School $school): JsonResponse
    {
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $affectations = \App\Models\Affectation::whereHas('classe', fn($q) => $q->where('school_id', $school->id))
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('prof', 'matiere', 'classe')
            ->get();

        return response()->json(['success' => true, 'affectations' => $affectations]);
    }

    public function emploiDuTemps(School $school): JsonResponse
    {
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $edt = \App\Models\EmploiDuTemps::where('school_id', $school->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('classe', 'prof', 'matiere')
            ->get();

        return response()->json(['emploi_du_temps' => $edt]);
    }

    public function anneesScolaires(School $school): JsonResponse
    {
        $annees = $school->anneesScolaires()->orderByDesc('libelle')->get();
        return response()->json(['success' => true, 'annees' => $annees]);
    }

    public function storeAnneeScolaire(Request $request, School $school): JsonResponse
    {
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

    public function activateAnneeScolaire(Request $request, School $school, AnneeScolaire $annee): JsonResponse
    {
        if ($annee->school_id !== $school->id) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        AnneeScolaire::where('school_id', $school->id)
            ->where('id', '!=', $annee->id)
            ->update(['active' => false]);

        $annee->update(['active' => true]);

        return response()->json(['success' => true, 'annee' => $annee]);
    }
}
