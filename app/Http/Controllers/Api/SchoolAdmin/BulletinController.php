<?php

namespace App\Http\Controllers\Api\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use App\Models\AnneeScolaire;
use App\Models\Classe;
use App\Models\Bulletin;
use App\Models\Eleve;
use App\Models\EleveClasse;
use App\Models\Evaluation;
use App\Models\Note;
use App\Models\Periode;
use App\Models\School;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BulletinController extends Controller
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

    public function affectations(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $affectations = Affectation::whereHas('classe', fn($q) => $q->where('school_id', $school->id))
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('prof', 'matiere', 'classe')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'prof' => $a->prof->nom_complet,
                'matiere' => $a->matiere->libelle,
                'classe' => $a->classe->libelle,
                'classe_id' => $a->classe_id,
                'matiere_id' => $a->matiere_id,
                'prof_id' => $a->prof_id,
                'has_notes' => Evaluation::where('classe_id', $a->classe_id)
                    ->where('matiere_id', $a->matiere_id)
                    ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
                    ->whereHas('notes')
                    ->exists(),
            ]);

        return response()->json(['success' => true, 'affectations' => $affectations]);
    }

    public function saisieNotes(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'periode_id' => 'required|exists:periodes,id',
        ]);

        $classe = Classe::findOrFail($request->classe_id);
        $periode = Periode::findOrFail($request->periode_id);

        // Get students in this class for this year
        $eleves = Eleve::whereHas('eleveClasses', fn($q) => $q
                ->where('annee_scolaire_id', $anneeActive->id)
                ->where('classe_id', $request->classe_id)
            )
            ->where('active', true)
            ->get()
            ->sortBy('nom')
            ->values();

        // Get or create the 4 evaluations (i1, i2, ds, com) for this class/subject/period
        $types = ['interrogation_1' => 'i1', 'interrogation_2' => 'i2', 'devoir_surveille' => 'ds', 'composition' => 'com'];
        $evaluations = [];

        foreach ($types as $typeKey => $typeLabel) {
            $evaluation = Evaluation::where('classe_id', $request->classe_id)
                ->where('matiere_id', $request->matiere_id)
                ->where('periode_id', $request->periode_id)
                ->where('annee_scolaire_id', $anneeActive->id)
                ->where('titre', $typeLabel)
                ->first();

            if (!$evaluation) {
                $evaluation = Evaluation::create([
                    'school_id' => $school->id,
                    'classe_id' => $request->classe_id,
                    'matiere_id' => $request->matiere_id,
                    'periode_id' => $request->periode_id,
                    'annee_scolaire_id' => $anneeActive->id,
                    'titre' => $typeLabel,
                    'type' => $typeKey === 'composition' ? 'composition' : ($typeKey === 'devoir_surveille' ? 'devoir' : 'interrogation'),
                    'coefficient' => $typeKey === 'composition' ? 2 : 1,
                    'note_sur' => 20,
                ]);
            }

            $evaluations[$typeKey] = $evaluation;
        }

        // Get existing notes for all 4 evaluations
        $evalIds = collect($evaluations)->pluck('id');
        $existingNotes = Note::whereIn('evaluation_id', $evalIds)
            ->get()
            ->keyBy(fn($n) => $n->evaluation_id . '_' . $n->eleve_id);

        // Build student data with notes
        $students = $eleves->map(function ($eleve) use ($evaluations, $existingNotes) {
            $notes = [];
            foreach ($evaluations as $typeKey => $eval) {
                $note = $existingNotes->get($eval->id . '_' . $eleve->id);
                $notes[$typeKey] = [
                    'evaluation_id' => $eval->id,
                    'note_id' => $note?->id,
                    'note' => $note?->note,
                ];
            }

            return [
                'eleve_id' => $eleve->id,
                'nom' => $eleve->nom,
                'prenom' => $eleve->prenom,
                'nom_complet' => $eleve->nom_complet,
                'notes' => $notes,
            ];
        });

        return response()->json([
            'success' => true,
            'classe' => ['id' => $classe->id, 'libelle' => $classe->libelle],
            'matiere_id' => (int) $request->matiere_id,
            'periode' => ['id' => $periode->id, 'libelle' => $periode->libelle],
            'evaluations' => collect($evaluations)->map(fn($e) => ['id' => $e->id, 'titre' => $e->titre])->toArray(),
            'students' => $students,
        ]);
    }

    public function storeSaisieNotes(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $request->validate([
            'notes' => 'required|array',
            'notes.*.eleve_id' => 'required|exists:eleves,id',
            'notes.*.i1' => 'nullable|numeric|min:0|max:20',
            'notes.*.i2' => 'nullable|numeric|min:0|max:20',
            'notes.*.ds' => 'nullable|numeric|min:0|max:20',
            'notes.*.com' => 'nullable|numeric|min:0|max:20',
            'i1_evaluation_id' => 'required|exists:evaluations,id',
            'i2_evaluation_id' => 'required|exists:evaluations,id',
            'ds_evaluation_id' => 'required|exists:evaluations,id',
            'com_evaluation_id' => 'required|exists:evaluations,id',
        ]);

        $evalMap = [
            'i1' => $request->i1_evaluation_id,
            'i2' => $request->i2_evaluation_id,
            'ds' => $request->ds_evaluation_id,
            'com' => $request->com_evaluation_id,
        ];

        foreach ($request->notes as $noteData) {
            foreach (['i1', 'i2', 'ds', 'com'] as $type) {
                if (isset($noteData[$type]) && $noteData[$type] !== null) {
                    Note::updateOrCreate(
                        ['evaluation_id' => $evalMap[$type], 'eleve_id' => $noteData['eleve_id']],
                        ['note' => $noteData[$type]]
                    );
                }
            }
        }

        return response()->json(['success' => true, 'message' => 'Notes enregistrées']);
    }

    public function bulletinsClasse(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'periode_id' => 'required|exists:periodes,id',
        ]);

        $classe = Classe::findOrFail($request->classe_id);
        $periode = Periode::findOrFail($request->periode_id);

        // Get all affectations for this class
        $affectations = Affectation::where('classe_id', $classe->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('matiere')
            ->get();

        // Get all students in this class for this year
        $eleves = Eleve::whereHas('eleveClasses', fn($q) => $q
                ->where('annee_scolaire_id', $anneeActive->id)
                ->where('classe_id', $classe->id)
            )
            ->where('active', true)
            ->get()
            ->sortBy('nom')
            ->values();

        // Check if all affectations have notes
        $allNoted = true;
        $affectationsStatus = [];

        foreach ($affectations as $aff) {
            $evaluations = Evaluation::where('classe_id', $classe->id)
                ->where('matiere_id', $aff->matiere_id)
                ->where('periode_id', $periode->id)
                ->where('annee_scolaire_id', $anneeActive->id)
                ->get();

            $totalExpected = $eleves->count() * $evaluations->count();
            $totalNotes = Note::whereIn('evaluation_id', $evaluations->pluck('id'))->count();

            $isComplete = $totalNotes >= $totalExpected && $totalExpected > 0;
            if (!$isComplete) $allNoted = false;

            $affectationsStatus[] = [
                'id' => $aff->id,
                'matiere' => $aff->matiere->libelle,
                'prof' => $aff->prof->nom_complet,
                'nb_evaluations' => $evaluations->count(),
                'nb_notes' => $totalNotes,
                'expected' => $totalExpected,
                'complete' => $isComplete,
            ];
        }

        // Get bulletins already generated
        $bulletins = \App\Models\Bulletin::where('classe_id', $classe->id)
            ->where('periode_id', $periode->id)
            ->where('annee_scolaire_id', $anneeActive->id)
            ->get()
            ->keyBy('eleve_id');

        $studentsWithStatus = $eleves->map(function ($eleve) use ($bulletins) {
            return [
                'eleve_id' => $eleve->id,
                'nom_complet' => $eleve->nom_complet,
                'bulletin_generated' => $bulletins->has($eleve->id),
                'bulletin_downloaded' => $bulletins->get($eleve->id)?->downloaded ?? false,
            ];
        });

        return response()->json([
            'success' => true,
            'classe' => ['id' => $classe->id, 'libelle' => $classe->libelle],
            'periode' => ['id' => $periode->id, 'libelle' => $periode->libelle],
            'affectations' => $affectationsStatus,
            'all_noted' => $allNoted,
            'students' => $studentsWithStatus,
        ]);
    }

    public function generateBulletin(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'classe_id' => 'required|exists:classes,id',
            'periode_id' => 'required|exists:periodes,id',
        ]);

        $eleve = Eleve::findOrFail($request->eleve_id);
        $classe = Classe::findOrFail($request->classe_id);
        $periode = Periode::findOrFail($request->periode_id);

        // Get all affectations for this class
        $affectations = Affectation::where('classe_id', $classe->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('matiere')
            ->get();

        $matieres = [];
        foreach ($affectations as $aff) {
            $evaluations = Evaluation::where('classe_id', $classe->id)
                ->where('matiere_id', $aff->matiere_id)
                ->where('periode_id', $periode->id)
                ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
                ->get();

            $notes = [];
            foreach ($evaluations as $eval) {
                $note = Note::where('evaluation_id', $eval->id)
                    ->where('eleve_id', $eleve->id)
                    ->first();
                $notes[$eval->titre] = $note?->note;
            }

            // Calculate average
            $validNotes = array_filter($notes, fn($n) => $n !== null);
            $moyenne = !empty($validNotes) ? round(array_sum($validNotes) / count($validNotes), 2) : null;

            $matieres[] = [
                'matiere' => $aff->matiere->libelle,
                'coefficient' => $aff->coefficient,
                'notes' => $notes,
                'moyenne' => $moyenne,
            ];
        }

        // Calculate general average
        $totalWeighted = 0;
        $totalCoeff = 0;
        foreach ($matieres as $m) {
            if ($m['moyenne'] !== null) {
                $totalWeighted += $m['moyenne'] * $m['coefficient'];
                $totalCoeff += $m['coefficient'];
            }
        }
        $moyenneGenerale = $totalCoeff > 0 ? round($totalWeighted / $totalCoeff, 2) : null;

        // Store bulletin record
        $bulletin = Bulletin::updateOrCreate(
            ['eleve_id' => $eleve->id, 'periode_id' => $periode->id, 'annee_scolaire_id' => $anneeActive->id],
            [
                'classe_id' => $classe->id,
                'school_id' => $school->id,
                'generated_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'bulletin' => [
                'id' => $bulletin->id,
                'eleve' => $eleve->nom_complet,
                'classe' => $classe->libelle,
                'periode' => $periode->libelle,
                'annee' => $anneeActive->libelle,
                'matieres' => $matieres,
                'moyenne_generale' => $moyenneGenerale,
            ],
        ]);
    }

    public function generateBulletinsClasse(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'periode_id' => 'required|exists:periodes,id',
        ]);

        $classe = Classe::findOrFail($request->classe_id);
        $periode = Periode::findOrFail($request->periode_id);

        $eleves = Eleve::whereHas('eleveClasses', fn($q) => $q
                ->where('annee_scolaire_id', $anneeActive->id)
                ->where('classe_id', $classe->id)
            )
            ->where('active', true)
            ->get();

        $generated = [];
        foreach ($eleves as $eleve) {
            $bulletin = Bulletin::updateOrCreate(
                ['eleve_id' => $eleve->id, 'periode_id' => $periode->id, 'annee_scolaire_id' => $anneeActive->id],
                [
                    'classe_id' => $classe->id,
                    'school_id' => $school->id,
                    'generated_at' => now(),
                ]
            );
            $generated[] = $bulletin->id;
        }

        return response()->json([
            'success' => true,
            'message' => count($generated) . ' bulletins générés.',
            'bulletin_ids' => $generated,
        ]);
    }

    public function downloadBulletin(Request $request, Bulletin $bulletin): JsonResponse
    {
        if ($bulletin->school_id != $request->current_school_id) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        $bulletin->update(['downloaded' => true]);

        return response()->json([
            'success' => true,
            'bulletin' => $bulletin->load('eleve', 'classe', 'periode', 'anneeScolaire'),
        ]);
    }

    public function searchBulletins(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $query = Bulletin::where('school_id', $school->id)
            ->with('eleve', 'classe', 'periode', 'anneeScolaire');

        if ($request->filled('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        if ($request->filled('annee_scolaire_id')) {
            $query->where('annee_scolaire_id', $request->annee_scolaire_id);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('eleve', function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%");
            });
        }

        $bulletins = $query->latest()->paginate(50);

        return response()->json(['success' => true, 'bulletins' => $bulletins]);
    }
}
