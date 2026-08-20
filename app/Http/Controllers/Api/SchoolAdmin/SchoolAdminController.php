<?php

namespace App\Http\Controllers\Api\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use App\Models\AnneeScolaire;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\EmploiDuTemps;
use App\Models\Evaluation;
use App\Models\Frais;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\Periode;
use App\Models\Prof;
use App\Models\School;
use App\Models\Section;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\DemandeAcces;
use App\Models\ParentFeedback;
use App\Services\CodeGenerator;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SchoolAdminController extends Controller
{
    private PushNotificationService $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

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

    private function verifyOwnership($model, Request $request, string $schoolKey = 'school_id'): void
    {
        $schoolId = $request->current_school_id;
        if ($model->$schoolKey != $schoolId) {
            abort(403, 'Non autorisé');
        }
    }

    public function schoolSettings(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        return response()->json([
            'id' => $school->id,
            'nom' => $school->nom,
            'ai_notes_enabled' => $school->ai_notes_enabled ?? false,
        ]);
    }

    public function classes(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $classes = Classe::where('school_id', $school->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('section')
            ->withCount('eleves')
            ->get();

        return response()->json(['success' => true, 'classes' => $classes]);
    }

    public function storeClass(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $request->validate([
            'libelle' => 'required|string',
            'section_id' => 'required|exists:sections,id',
            'ecolage' => 'nullable|numeric|min:0',
        ]);

        $section = Section::findOrFail($request->section_id);
        $this->verifyOwnership($section, $request);

        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $classe = Classe::create([
            'school_id' => $school->id,
            'section_id' => $request->section_id,
            'annee_scolaire_id' => $anneeActive?->id,
            'libelle' => $request->libelle,
            'ecolage' => $request->ecolage ?? 0,
        ]);

        return response()->json($classe, 201);
    }

    public function destroyClass(Classe $classe, Request $request): JsonResponse
    {
        $this->verifyOwnership($classe, $request);
        $classe->delete();
        return response()->json(['message' => 'Classe supprimée']);
    }

    public function matieres(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        return response()->json(['success' => true, 'matieres' => $school->matieres()->get()]);
    }

    public function storeMatiere(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $request->validate([
            'libelle' => 'required|string',
            'categorie' => 'nullable|string',
        ]);

        $matiere = Matiere::create([
            'school_id' => $school->id,
            'libelle' => $request->libelle,
            'categorie' => $request->categorie,
        ]);

        return response()->json($matiere, 201);
    }

    public function destroyMatiere(Matiere $matiere, Request $request): JsonResponse
    {
        $this->verifyOwnership($matiere, $request);
        $matiere->delete();
        return response()->json(['message' => 'Matière supprimée']);
    }

    public function profs(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $profs = $school->profs()->with('affectations.matiere', 'affectations.classe')->get();

        $profs->each(function ($prof) {
            if (!$prof->code_used) {
                $prof->makeVisible(['code']);
            }
            $prof->makeVisible(['code_used']);
        });

        return response()->json(['success' => true, 'profs' => $profs]);
    }

    public function storeProf(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $request->validate([
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'email' => 'nullable|email',
            'telephone' => 'nullable|string',
        ]);

        $prof = Prof::forceCreate([
            'school_id' => $school->id,
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'telephone' => $request->telephone,
            'code' => CodeGenerator::generate(),
            'magic_token' => \Illuminate\Support\Str::uuid()->toString(),
        ]);

        return response()->json([
            'id' => $prof->id,
            'nom' => $prof->nom,
            'prenom' => $prof->prenom,
            'email' => $prof->email,
            'telephone' => $prof->telephone,
            'code' => $prof->code,
            'school_id' => $prof->school_id,
        ], 201);
    }

    public function destroyProf(Prof $prof, Request $request): JsonResponse
    {
        $this->verifyOwnership($prof, $request);
        $prof->delete();
        return response()->json(['message' => 'Prof supprimé']);
    }

    public function eleves(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $eleves = $school->eleves()
            ->with('classe', 'parents')
            ->get();

        return response()->json(['success' => true, 'eleves' => $eleves]);
    }

    public function storeEleve(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $request->validate([
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'classe_id' => 'required|exists:classes,id',
            'date_naissance' => 'nullable|date',
            'matricule' => 'nullable|string',
            'sexe' => 'nullable|in:M,F',
            'parent_telephone' => 'nullable|string',
        ]);

        $eleve = Eleve::forceCreate([
            'school_id' => $school->id,
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'classe_id' => $request->classe_id,
            'date_naissance' => $request->date_naissance,
            'matricule' => $request->matricule,
            'code' => CodeGenerator::generate(),
            'sexe' => $request->sexe,
        ]);

        // Create eleve_classe record
        if ($anneeActive) {
            \App\Models\EleveClasse::create([
                'eleve_id' => $eleve->id,
                'classe_id' => $request->classe_id,
                'annee_scolaire_id' => $anneeActive->id,
            ]);

            // Create subscription
            $classeForSub = Classe::find($request->classe_id);
            $subscription = Subscription::create([
                'eleve_id' => $eleve->id,
                'annee_scolaire_id' => $anneeActive->id,
                'classe_id' => $request->classe_id,
                'inscrit' => true,
                'montant_mensuel' => $classeForSub?->ecolage ?? 0,
            ]);

            // Auto-create inscription fee payment if frais inscription exists for this class
            $fraisInscription = Frais::where('school_id', $school->id)
                ->where('type', 'inscription')
                ->where('actif', true)
                ->whereHas('classes', fn($q) => $q->where('classes.id', $request->classe_id))
                ->first();

            if ($fraisInscription) {
                SubscriptionPayment::create([
                    'subscription_id' => $subscription->id,
                    'frais_id' => $fraisInscription->id,
                    'montant' => $fraisInscription->montant,
                    'type' => 'frais',
                    'methode_paiement' => 'especes',
                    'reference' => 'INSC-' . strtoupper(uniqid()),
                    'notes' => 'Frais d\'inscription automatique',
                ]);
            }
        }

        if ($request->parent_telephone) {
            $this->linkParent($request->parent_telephone, $eleve);
        }

        return response()->json([
            'id' => $eleve->id,
            'nom' => $eleve->nom,
            'prenom' => $eleve->prenom,
            'classe_id' => $eleve->classe_id,
            'school_id' => $eleve->school_id,
            'date_naissance' => $eleve->date_naissance,
            'matricule' => $eleve->matricule,
            'sexe' => $eleve->sexe,
        ], 201);
    }

    public function updateEleve(Request $request, Eleve $eleve): JsonResponse
    {
        $this->verifyOwnership($eleve, $request);
        $eleve->update($request->only(['nom', 'prenom', 'classe_id', 'date_naissance', 'matricule', 'sexe']));

        if ($request->has('parent_telephone')) {
            if ($request->parent_telephone) {
                $this->linkParent($request->parent_telephone, $eleve);
            } else {
                $eleve->parents()->detach();
            }
        }

        return response()->json($eleve->load('classe', 'parents'));
    }

    public function destroyEleve(Eleve $eleve, Request $request): JsonResponse
    {
        $this->verifyOwnership($eleve, $request);

        $pin = $request->input('pin');
        if (!$pin || !Hash::check($pin, $request->user()->pin_hash)) {
            return response()->json(['message' => 'Code PIN incorrect.'], 403);
        }

        $eleve->delete();
        return response()->json(['message' => 'Élève supprimé']);
    }

    private function linkParent(string $telephone, Eleve $eleve): void
    {
        $parent = \App\Models\ParentModel::firstOrNew(['telephone' => $telephone]);
        if (!$parent->exists) {
            $parent->forceFill(['code' => CodeGenerator::generate()])->save();
        }

        $parent->eleves()->syncWithoutDetaching([$eleve->id]);
    }

    public function affectations(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $affectations = Affectation::whereHas('classe', fn($q) => $q->where('school_id', $school->id))
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('prof', 'matiere', 'classe')
            ->get();

        return response()->json($affectations);
    }

    public function storeAffectation(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $request->validate([
            'prof_id' => 'required|exists:profs,id',
            'matiere_id' => 'required|exists:matieres,id',
            'classe_id' => 'required|exists:classes,id',
            'coefficient' => 'nullable|integer|min:1',
        ]);

        $classe = Classe::findOrFail($request->classe_id);
        $this->verifyOwnership($classe, $request);

        $prof = Prof::findOrFail($request->prof_id);
        $this->verifyOwnership($prof, $request);

        $matiere = Matiere::findOrFail($request->matiere_id);
        $this->verifyOwnership($matiere, $request);

        $affectation = Affectation::create([
            'prof_id' => $request->prof_id,
            'matiere_id' => $request->matiere_id,
            'classe_id' => $request->classe_id,
            'annee_scolaire_id' => $anneeActive?->id,
            'coefficient' => $request->coefficient ?? 2,
        ]);

        return response()->json($affectation->load('prof', 'matiere', 'classe'), 201);
    }

    public function updateCoefficient(Request $request, Affectation $affectation): JsonResponse
    {
        $this->verifyOwnership($affectation->classe, $request);
        $request->validate([
            'coefficient' => 'required|integer|min:1',
        ]);

        $affectation->update([
            'coefficient' => $request->coefficient,
        ]);

        return response()->json($affectation->load('prof', 'matiere', 'classe'));
    }

    public function destroyAffectation(Affectation $affectation, Request $request): JsonResponse
    {
        $this->verifyOwnership($affectation, $request);
        $affectation->delete();
        return response()->json(['message' => 'Affectation supprimée']);
    }

    public function frais(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        return response()->json(['success' => true, 'frais' => $school->frais()->with('classes')->get()]);
    }

    public function storeFrais(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $request->validate([
            'libelle' => 'required|string',
            'type' => 'nullable|in:inscription,annexe,minerval',
            'montant' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'classes' => 'nullable|array',
        ]);

        $frais = Frais::create([
            'school_id' => $school->id,
            'libelle' => $request->libelle,
            'type' => $request->type ?? 'annexe',
            'montant' => $request->montant,
            'description' => $request->description,
        ]);

        if ($request->classes) {
            $frais->classes()->sync($request->classes);
        }

        return response()->json(['success' => true, 'frais' => $frais->load('classes')], 201);
    }

    public function destroyFrais(Frais $frais, Request $request): JsonResponse
    {
        $this->verifyOwnership($frais, $request);
        $frais->delete();
        return response()->json(['message' => 'Frais supprimé']);
    }

    public function periodes(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $periodes = Periode::where('school_id', $school->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->get();

        return response()->json($periodes);
    }

    public function storePeriode(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        if (!$anneeActive) {
            return response()->json(['success' => false, 'message' => 'Aucune année scolaire active.'], 422);
        }

        $validated = $request->validate([
            'libelle' => 'required|string|max:255',
            'type' => 'required|string|in:trimestre,semestre',
            'numero' => 'required|integer|min:1',
        ]);

        $periode = Periode::create([
            'school_id' => $school->id,
            'annee_scolaire_id' => $anneeActive->id,
            'libelle' => $validated['libelle'],
            'type' => $validated['type'],
            'numero' => $validated['numero'],
        ]);

        return response()->json(['success' => true, 'periode' => $periode]);
    }

    public function deletePeriode(Request $request, Periode $periode): JsonResponse
    {
        $school = $this->getSchool($request);

        if ($periode->school_id !== $school->id) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        $periode->delete();

        return response()->json(['success' => true]);
    }

    public function evaluations(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $groups = Evaluation::where('school_id', $school->id)
            ->where('is_group_parent', true)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with(['matiere', 'periode'])
            ->withCount('groupChildren')
            ->get()
            ->map(fn($g) => [
                'id' => $g->id,
                'titre' => $g->titre,
                'type' => $g->type,
                'matiere' => $g->matiere?->libelle,
                'matiere_id' => $g->matiere_id,
                'periode' => $g->periode?->libelle,
                'periode_id' => $g->periode_id,
                'date' => $g->date?->format('Y-m-d'),
                'heure_debut' => $g->heure_debut,
                'heure_fin' => $g->heure_fin,
                'coefficient' => $g->coefficient,
                'note_sur' => $g->note_sur,
                'nb_classes' => $g->group_children_count,
                'classes' => $g->groupChildren()->with('classe')->get()->map(fn($c) => [
                    'id' => $c->id,
                    'classe_id' => $c->classe_id,
                    'libelle' => $c->classe?->libelle,
                    'date' => $c->date?->format('Y-m-d'),
                    'heure_debut' => $c->heure_debut,
                    'heure_fin' => $c->heure_fin,
                    'nb_notes' => $c->notes()->count(),
                ]),
            ]);

        $evaluations = Evaluation::where('school_id', $school->id)
            ->where('is_group_parent', false)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('classe', 'matiere', 'periode')
            ->withCount('notes')
            ->get();

        return response()->json(['groups' => $groups, 'evaluations' => $evaluations]);
    }

    public function evaluationStudents(Request $request, int $evaluationId): JsonResponse
    {
        $school = $this->getSchool($request);

        $evaluation = Evaluation::where('id', $evaluationId)
            ->where('school_id', $school->id)
            ->firstOrFail();

        // For group parent: get students from all child evaluations' classes
        if ($evaluation->is_group_parent) {
            $children = Evaluation::where('evaluation_group_id', $evaluation->id)
                ->with('classe')
                ->get();

            $allStudents = [];
            foreach ($children as $child) {
                if (!$child->classe_id) continue;
                $existingNotes = Note::where('evaluation_id', $child->id)->get()->keyBy('eleve_id');

                // Get students in this class for this evaluation's year
                $elevesQuery = \App\Models\Eleve::where('classe_id', $child->classe_id);
                if ($child->annee_scolaire_id) {
                    $elevesQuery = \App\Models\Eleve::whereHas('eleveClasses', fn($q) => $q
                        ->where('annee_scolaire_id', $child->annee_scolaire_id)
                        ->where('classe_id', $child->classe_id)
                    );
                }
                $eleves = $elevesQuery->get();

                foreach ($eleves as $eleve) {
                    $note = $existingNotes->get($eleve->id);
                    $allStudents[] = [
                        'id' => $eleve->id,
                        'nom_complet' => $eleve->nom_complet,
                        'nom' => $eleve->nom,
                        'prenom' => $eleve->prenom,
                        'classe' => $child->classe?->libelle,
                        'classe_id' => $child->classe_id,
                        'evaluation_id' => $child->id,
                        'note' => $note?->note,
                        'note_id' => $note?->id,
                    ];
                }
            }
            return response()->json(['students' => $allStudents]);
        }

        // Simple evaluation - get students in class for this evaluation's year
        $existingNotes = Note::where('evaluation_id', $evaluationId)
            ->get()
            ->keyBy('eleve_id');

        $elevesQuery = \App\Models\Eleve::where('classe_id', $evaluation->classe_id);
        if ($evaluation->annee_scolaire_id) {
            $elevesQuery = \App\Models\Eleve::whereHas('eleveClasses', fn($q) => $q
                ->where('annee_scolaire_id', $evaluation->annee_scolaire_id)
                ->where('classe_id', $evaluation->classe_id)
            );
        }

        $eleves = $elevesQuery->get()
            ->map(function ($eleve) use ($existingNotes, $evaluation) {
                $note = $existingNotes->get($eleve->id);
                return [
                    'id' => $eleve->id,
                    'nom_complet' => $eleve->nom_complet,
                    'nom' => $eleve->nom,
                    'prenom' => $eleve->prenom,
                    'classe' => $evaluation->classe?->libelle,
                    'classe_id' => $evaluation->classe_id,
                    'evaluation_id' => $evaluation->id,
                    'note' => $note?->note,
                    'note_id' => $note?->id,
                ];
            });

        return response()->json(['students' => $eleves]);
    }

    public function storeGrades(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $request->validate([
            'notes' => 'required|array',
            'notes.*.evaluation_id' => 'required|exists:evaluations,id',
            'notes.*.eleve_id' => 'required|exists:eleves,id',
            'notes.*.note' => 'nullable|numeric|min:0',
        ]);

        foreach ($request->notes as $noteData) {
            $evaluation = Evaluation::where('id', $noteData['evaluation_id'])
                ->where('school_id', $school->id)
                ->first();

            if (!$evaluation) continue;

            Note::updateOrCreate(
                ['evaluation_id' => $noteData['evaluation_id'], 'eleve_id' => $noteData['eleve_id']],
                [
                    'note' => $noteData['note'] ?? null,
                ]
            );
        }

        return response()->json(['success' => true]);
    }

    public function storeEvaluationGroup(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $request->validate([
            'titre' => 'nullable|string',
            'type' => 'required|in:interrogation,devoir,devoir_surveille,composition,examen',
            'matiere_id' => 'required|exists:matieres,id',
            'periode_id' => 'required|exists:periodes,id',
            'date' => 'required|date',
            'heure_debut' => 'required|string',
            'heure_fin' => 'required|string',
            'coefficient' => 'nullable|numeric|min:1',
            'note_sur' => 'nullable|numeric|min:1',
            'classe_ids' => 'required|array|min:1',
            'classe_ids.*' => 'exists:classes,id',
        ]);

        $periode = Periode::findOrFail($request->periode_id);
        $this->verifyOwnership($periode, $request);

        $matiere = Matiere::findOrFail($request->matiere_id);
        $this->verifyOwnership($matiere, $request);

        foreach ($request->classe_ids as $classeId) {
            $classe = Classe::findOrFail($classeId);
            $this->verifyOwnership($classe, $request);
        }

        $groupTitle = $request->titre
            ?: ucfirst($request->type) . ' ' . $periode->libelle . ' - ' . $matiere->libelle;

        $group = Evaluation::create([
            'school_id' => $school->id,
            'classe_id' => $request->classe_ids[0],
            'matiere_id' => $request->matiere_id,
            'periode_id' => $request->periode_id,
            'annee_scolaire_id' => $anneeActive?->id,
            'titre' => $groupTitle,
            'type' => $request->type,
            'date' => $request->date,
            'heure_debut' => $request->heure_debut,
            'heure_fin' => $request->heure_fin,
            'coefficient' => $request->coefficient ?? 1,
            'note_sur' => $request->note_sur ?? 20,
            'is_group_parent' => true,
        ]);

        $created = [];
        foreach ($request->classe_ids as $classeId) {
            $created[] = Evaluation::create([
                'school_id' => $school->id,
                'classe_id' => $classeId,
                'matiere_id' => $request->matiere_id,
                'periode_id' => $request->periode_id,
                'annee_scolaire_id' => $anneeActive?->id,
                'titre' => $groupTitle,
                'type' => $request->type,
                'date' => $request->date,
                'heure_debut' => $request->heure_debut,
                'heure_fin' => $request->heure_fin,
                'coefficient' => $request->coefficient ?? 1,
                'note_sur' => $request->note_sur ?? 20,
                'evaluation_group_id' => $group->id,
            ]);
        }

        return response()->json([
            'group' => $group->load('matiere', 'periode'),
            'evaluations' => $created,
        ], 201);
    }

    public function updateEvaluationSchedule(Request $request, Evaluation $evaluation): JsonResponse
    {
        $this->verifyOwnership($evaluation, $request);
        $request->validate([
            'date' => 'sometimes|date',
            'heure_debut' => 'sometimes|string',
            'heure_fin' => 'sometimes|string',
        ]);

        $evaluation->update($request->only(['date', 'heure_debut', 'heure_fin']));
        return response()->json($evaluation->load('classe'));
    }

    public function destroyEvaluation(Evaluation $evaluation, Request $request): JsonResponse
    {
        $this->verifyOwnership($evaluation, $request);

        if ($evaluation->is_group_parent) {
            $children = Evaluation::where('evaluation_group_id', $evaluation->id)->get();
            foreach ($children as $child) {
                $child->notes()->delete();
                $child->delete();
            }
        }

        $evaluation->notes()->delete();
        $evaluation->delete();

        return response()->json(['success' => true]);
    }

    public function storeEvaluation(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $request->validate([
            'titre' => 'required|string',
            'type' => 'required|in:interrogation,devoir,devoir_surveille,composition,examen',
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'periode_id' => 'required|exists:periodes,id',
            'date' => 'nullable|date',
            'heure_debut' => 'nullable|string',
            'heure_fin' => 'nullable|string',
            'coefficient' => 'nullable|numeric|min:0.5',
            'note_sur' => 'nullable|numeric|min:1',
        ]);

        $evaluation = Evaluation::create([
            'school_id' => $school->id,
            'titre' => $request->titre,
            'type' => $request->type,
            'classe_id' => $request->classe_id,
            'matiere_id' => $request->matiere_id,
            'periode_id' => $request->periode_id,
            'annee_scolaire_id' => $anneeActive?->id,
            'date' => $request->date,
            'heure_debut' => $request->heure_debut,
            'heure_fin' => $request->heure_fin,
            'coefficient' => $request->coefficient ?? 1,
            'note_sur' => $request->note_sur ?? 20,
        ]);

        return response()->json($evaluation->load('classe', 'matiere', 'periode'), 201);
    }

    public function rapportNotes(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $query = Evaluation::where('school_id', $school->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with(['classe', 'matiere', 'notes.eleve']);

        if ($request->filled('classe_id') && $request->classe_id !== 'all') {
            $query->where('classe_id', $request->classe_id);
        }
        if ($request->filled('matiere_id') && $request->matiere_id !== 'all') {
            $query->where('matiere_id', $request->matiere_id);
        }

        $evaluationsRaw = $query->get();

        $parEvaluation = $evaluationsRaw->map(fn($eval) => [
            'evaluation_id' => $eval->id,
            'titre' => $eval->titre,
            'type_evaluation' => $eval->type,
            'matiere' => $eval->matiere->libelle ?? '',
            'date' => $eval->date ?? $eval->created_at?->format('Y-m-d'),
            'classe' => $eval->classe->libelle ?? '',
            'moyenne' => round((float) $eval->notes->avg('note'), 2),
            'min' => $eval->notes->min('note'),
            'max' => $eval->notes->max('note'),
            'nombre_eleves' => $eval->notes->count(),
        ]);

        $totalNotes = $evaluationsRaw->sum(fn($e) => $e->notes->count());
        $allNotes = $evaluationsRaw->flatMap(fn($e) => $e->notes->pluck('note'));

        $stats = [
            'total_notes' => $totalNotes,
            'moyenne_generale' => $allNotes->isNotEmpty() ? round($allNotes->avg(), 2) : null,
            'note_max' => $allNotes->isNotEmpty() ? $allNotes->max() : null,
            'note_min' => $allNotes->isNotEmpty() ? $allNotes->min() : null,
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'par_evaluation' => $parEvaluation,
        ]);
    }

    private function computeStudentAverages($evaluations, School $school): array
    {
        $grouped = $evaluations->groupBy(fn($e) => $e->classe_id . '_' . $e->matiere_id);

        $studentSubjectAverages = [];

        foreach ($grouped as $key => $subjectEvals) {
            $firstEval = $subjectEvals->first();
            $classeId = $firstEval->classe_id;
            $matiereId = $firstEval->matiere_id;

            $affectation = Affectation::where('classe_id', $classeId)
                ->where('matiere_id', $matiereId)
                ->first();
            $coefficient = $affectation?->coefficient ?? 2;

            $interrogations = $subjectEvals->where('type', 'interrogation');
            $devoirs = $subjectEvals->where('type', 'devoir');
            $compositions = $subjectEvals->where('type', 'composition');

            $studentNotes = [];

            foreach ($subjectEvals as $eval) {
                foreach ($eval->notes as $note) {
                    $eleveId = $note->eleve_id;
                    if (!isset($studentNotes[$eleveId])) {
                        $studentNotes[$eleveId] = [
                            'eleve' => $note->eleve->nom_complet,
                            'eleve_id' => $eleveId,
                            'interrogations' => [],
                            'devoirs' => [],
                            'compositions' => [],
                        ];
                    }
                    $normalizedNote = ($note->note / $eval->note_sur) * 20;
                    $studentNotes[$eleveId][$eval->type === 'interrogation' ? 'interrogations' : ($eval->type === 'devoir' ? 'devoirs' : 'compositions')][] = $normalizedNote;
                }
            }

            foreach ($studentNotes as $eleveId => &$data) {
                $avgInterrogations = !empty($data['interrogations']) ? array_sum($data['interrogations']) / count($data['interrogations']) : null;
                $avgDevoirs = !empty($data['devoirs']) ? array_sum($data['devoirs']) / count($data['devoirs']) : null;
                $avgCompositions = !empty($data['compositions']) ? array_sum($data['compositions']) / count($data['compositions']) : null;

                if ($avgInterrogations !== null && $avgDevoirs !== null) {
                    $subjectAvg = ($avgInterrogations + $avgDevoirs) / 2;
                } elseif ($avgInterrogations !== null) {
                    $subjectAvg = $avgInterrogations;
                } elseif ($avgDevoirs !== null) {
                    $subjectAvg = $avgDevoirs;
                } else {
                    $subjectAvg = null;
                }

                if ($subjectAvg !== null && $avgCompositions !== null) {
                    $subjectAvg = ($subjectAvg + $avgCompositions) / 2;
                } elseif ($subjectAvg === null && $avgCompositions !== null) {
                    $subjectAvg = $avgCompositions;
                }

                $matiereLibelle = $firstEval->matiere->libelle;

                $studentSubjectAverages[$classeId][$eleveId][$matiereId] = [
                    'matiere' => $matiereLibelle,
                    'coefficient' => $coefficient,
                    'moyenne' => $subjectAvg !== null ? round($subjectAvg, 2) : null,
                ];
            }
        }

        $result = [];

        foreach ($studentSubjectAverages as $classeId => $students) {
            $classe = Classe::find($classeId);
            foreach ($students as $eleveId => $subjects) {
                $totalWeighted = 0;
                $totalCoeff = 0;
                $subjectDetails = [];

                foreach ($subjects as $matiereId => $data) {
                    if ($data['moyenne'] !== null) {
                        $totalWeighted += $data['moyenne'] * $data['coefficient'];
                        $totalCoeff += $data['coefficient'];
                    }
                    $subjectDetails[] = $data;
                }

                $moyenneGenerale = $totalCoeff > 0 ? round($totalWeighted / $totalCoeff, 2) : null;

                $eleve = Eleve::find($eleveId);
                $result[] = [
                    'eleve_id' => $eleveId,
                    'eleve' => $eleve?->nom_complet,
                    'classe' => $classe?->libelle,
                    'classe_id' => $classeId,
                    'matieres' => $subjectDetails,
                    'moyenne_generale' => $moyenneGenerale,
                ];
            }
        }

        return $result;
    }

    public function subscriptions(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        // Auto-create subscriptions for students who don't have one
        if ($anneeActive) {
            $elevesSansAbonnement = $school->eleves()
                ->where('active', true)
                ->whereDoesntHave('subscriptions', fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
                ->get();

            foreach ($elevesSansAbonnement as $eleve) {
                $classe = Classe::find($eleve->classe_id);
                Subscription::create([
                    'eleve_id' => $eleve->id,
                    'annee_scolaire_id' => $anneeActive->id,
                    'classe_id' => $eleve->classe_id,
                    'inscrit' => true,
                    'montant_mensuel' => $classe?->ecolage ?? 0,
                ]);
            }
        }

        $school->load('frais.classes');

        $query = Subscription::whereHas('eleve', fn($q) => $q->where('school_id', $school->id))
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('eleve.classe.fraisClasses.frais', 'payments');

        if ($request->filled('classe_id') && $request->classe_id !== 'all') {
            $query->where('classe_id', $request->classe_id);
        }
        if ($request->filled('niveau') && $request->niveau !== 'all') {
            $query->whereHas('eleve.classe', fn($q) => $q->where('niveau', $request->niveau));
        }

        $subscriptions = $query->get();

        $students = $subscriptions->map(function ($sub) use ($school) {
            $eleve = $sub->eleve;

            $allMonths = ['septembre', 'octobre', 'novembre', 'decembre', 'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin'];
            $moisPayes = $sub->mois_payes ?? [];
            $nbMoisPayes = count($moisPayes);
            $nbMoisRestants = count($allMonths) - $nbMoisPayes;
            $montantAbonnement = 1000;
            $totalPaye = $nbMoisPayes * $montantAbonnement;
            $totalRestant = $nbMoisRestants * $montantAbonnement;

            if ($sub->access_locked) {
                $statut = 'expire';
                $statutLabel = 'Bloqué';
            } elseif ($nbMoisPayes === 0) {
                $statut = 'en_attente';
                $statutLabel = 'En attente';
            } elseif ($nbMoisRestants > 0) {
                $statut = 'en_attente';
                $statutLabel = 'Partiel';
            } else {
                $statut = 'a_jour';
                $statutLabel = 'À jour';
            }

            return [
                'id' => $sub->id,
                'eleve_id' => $eleve->id,
                'nom' => $eleve->nom ?? '',
                'prenom' => $eleve->prenom ?? '',
                'nom_complet' => trim(($eleve->prenom ?? '') . ' ' . ($eleve->nom ?? '')),
                'classe' => $eleve->classe->libelle ?? null,
                'classe_id' => $eleve->classe_id,
                'niveau' => $eleve->classe->niveau ?? 'college',
                'niveau_label' => ($eleve->classe->niveau ?? 'college') === 'lycee' ? 'Lycée' : 'Collège',
                'numero_parent' => $eleve->parent_telephone ?? null,
                'statut_abonnement' => $statut,
                'statut_abonnement_label' => $statutLabel,
                'montant_mensuel' => $montantAbonnement,
                'mois_payes' => $moisPayes,
                'mois_payes_count' => $nbMoisPayes,
                'mois_restants_count' => $nbMoisRestants,
                'total_paye' => $totalPaye,
                'total_restant' => $totalRestant,
                'cles_mois_regles' => array_map(fn($m) => $m, $moisPayes),
                'acces_parent_verrouille' => $sub->access_locked ?? false,
                'message_verrouillage' => $sub->lock_message,
            ];
        });

        if ($request->filled('search') && $request->search) {
            $search = strtolower($request->search);
            $students = $students->filter(fn($s) => str_contains(strtolower($s['nom_complet']), $search) || str_contains(strtolower($s['classe'] ?? ''), $search));
        }
        if ($request->filled('statut') && $request->statut !== 'all') {
            $students = $students->filter(fn($s) => $s['statut_abonnement'] === $request->statut);
        }

        $stats = [
            'total' => $students->count(),
            'a_jour' => $students->filter(fn($s) => $s['statut_abonnement'] === 'a_jour')->count(),
            'en_attente' => $students->filter(fn($s) => $s['statut_abonnement'] === 'en_attente')->count(),
            'expire' => $students->filter(fn($s) => $s['statut_abonnement'] === 'expire')->count(),
            'locked' => $students->filter(fn($s) => $s['acces_parent_verrouille'])->count(),
        ];

        $classes = $school->classes()->get()->map(fn($c) => [
            'id' => $c->id,
            'libelle' => $c->libelle,
            'niveau' => $c->niveau ?? 'college',
            'niveau_label' => ($c->niveau ?? 'college') === 'lycee' ? 'Lycée' : 'Collège',
        ]);

        return response()->json([
            'success' => true,
            'students' => $students->values(),
            'classes' => $classes,
            'stats' => $stats,
        ]);
    }

    public function storeSubscription(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'annee_scolaire_id' => 'required|exists:annees_scolaires,id',
            'classe_id' => 'nullable|exists:classes,id',
        ]);

        $eleve = Eleve::findOrFail($request->eleve_id);
        $this->verifyOwnership($eleve, $request);

        $anneeScolaire = AnneeScolaire::findOrFail($request->annee_scolaire_id);
        $this->verifyOwnership($anneeScolaire, $request);

        if ($request->classe_id) {
            $classe = Classe::findOrFail($request->classe_id);
            $this->verifyOwnership($classe, $request);
        } else {
            $classe = Classe::find($eleve->classe_id);
        }

        $subscription = Subscription::create([
            'eleve_id' => $request->eleve_id,
            'annee_scolaire_id' => $request->annee_scolaire_id,
            'classe_id' => $request->classe_id ?? $eleve->classe_id,
            'inscrit' => true,
            'montant_mensuel' => $classe?->ecolage ?? 0,
        ]);

        return response()->json($subscription, 201);
    }

    public function paySubscription(Request $request, Subscription $subscription): JsonResponse
    {
        $this->verifyOwnership($subscription, $request);

        $anneeActive = $subscription->anneeScolaire ?? $subscription->eleve?->school?->anneesScolaires()->where('active', true)->first();

        $request->validate([
            'montant' => 'nullable|numeric|min:0',
            'type' => 'nullable|in:scolarite,frais,abonnement',
            'methode_paiement' => 'nullable|in:especes,wave,orange_money,mtn_momo,free_money,carte_bancaire',
            'frais_id' => 'nullable|exists:frais,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
            'mois' => 'nullable|string|max:20',
            'months' => 'nullable|array',
            'months.*' => 'string|max:20',
        ]);

        $type = $request->type ?? 'abonnement';
        $months = $request->months ?? ($request->mois ? [$request->mois] : []);

        if ($type === 'frais') {
            $payment = SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'frais_id' => $request->frais_id,
                'montant' => $request->montant ?? 0,
                'type' => 'frais',
                'methode_paiement' => $request->methode_paiement ?? 'especes',
                'reference' => strip_tags($request->reference ?? ''),
                'notes' => strip_tags($request->notes ?? ''),
            ]);

            $subscription->update(['frais_paye' => true]);

            return response()->json(['success' => true, 'payment' => $payment], 201);
        }

        if ($type === 'scolarite') {
            $payment = SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'montant' => $request->montant ?? 0,
                'type' => 'scolarite',
                'methode_paiement' => $request->methode_paiement ?? 'especes',
                'reference' => strip_tags($request->reference ?? ''),
                'notes' => strip_tags($request->notes ?? ''),
            ]);

            return response()->json(['success' => true, 'payment' => $payment], 201);
        }
    }

    public function payByEleve(Request $request, int $eleveId): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $eleve = Eleve::where('id', $eleveId)->where('school_id', $school->id)->firstOrFail();

        $subscription = Subscription::where('eleve_id', $eleve->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->first();

        if (!$subscription) {
            $classe = Classe::find($eleve->classe_id);
            $subscription = Subscription::create([
                'eleve_id' => $eleve->id,
                'annee_scolaire_id' => $anneeActive?->id,
                'classe_id' => $eleve->classe_id,
                'inscrit' => true,
                'montant_mensuel' => $classe?->ecolage ?? 0,
            ]);
        }

        $request->validate([
            'montant' => 'nullable|numeric|min:0',
            'type' => 'nullable|in:scolarite,frais,abonnement',
            'methode_paiement' => 'nullable|in:especes,wave,orange_money,mtn_momo,free_money,carte_bancaire',
            'frais_id' => 'nullable|exists:frais,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
            'mois' => 'nullable|string|max:20',
            'months' => 'nullable|array',
            'months.*' => 'string|max:20',
        ]);

        $type = $request->type ?? 'abonnement';
        $months = $request->months ?? ($request->mois ? [$request->mois] : []);

        if ($type === 'frais') {
            $payment = SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'frais_id' => $request->frais_id,
                'montant' => $request->montant ?? 0,
                'type' => 'frais',
                'methode_paiement' => $request->methode_paiement ?? 'especes',
                'reference' => strip_tags($request->reference ?? ''),
                'notes' => strip_tags($request->notes ?? ''),
            ]);

            $subscription->update(['frais_paye' => true]);

            return response()->json(['success' => true, 'payment' => $payment], 201);
        }

        if ($type === 'scolarite') {
            $payment = SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'montant' => $request->montant ?? 0,
                'type' => 'scolarite',
                'methode_paiement' => $request->methode_paiement ?? 'especes',
                'reference' => strip_tags($request->reference ?? ''),
                'notes' => strip_tags($request->notes ?? ''),
            ]);

            return response()->json(['success' => true, 'payment' => $payment], 201);
        }

        if (empty($months)) {
            return response()->json(['message' => 'Aucun mois sélectionné'], 422);
        }

        $montantMensuel = $subscription->montant_mensuel ?? 0;
        $payments = [];

        foreach ($months as $mois) {
            $payment = SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'frais_id' => $request->frais_id,
                'montant' => $request->montant ?? $montantMensuel,
                'type' => $type,
                'methode_paiement' => $request->methode_paiement ?? 'especes',
                'reference' => strip_tags($request->reference ?? ''),
                'notes' => strip_tags($request->notes ?? ''),
            ]);

            $moisPayes = $subscription->mois_payes ?? [];
            if (!in_array($mois, $moisPayes)) {
                $moisPayes[] = $mois;
                $subscription->update(['mois_payes' => $moisPayes]);
            }

            $payments[] = $payment;
        }

        return response()->json(['success' => true, 'payments' => $payments], 201);
    }

    public function toggleSubscriptionLock(Request $request, Subscription $subscription): JsonResponse
    {
        $this->verifyOwnership($subscription, $request);
        $request->validate([
            'message' => 'nullable|string|max:500',
        ]);
        $locked = !$subscription->access_locked;
        $subscription->update([
            'access_locked' => $locked,
            'lock_message' => $locked ? strip_tags($request->message ?? 'Accès verrouillé par l\'administration') : null,
        ]);

        return response()->json($subscription);
    }

    public function emploiDuTemps(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $school);

        $edt = EmploiDuTemps::where('school_id', $school->id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('classe', 'matiere', 'prof')
            ->get();

        return response()->json($edt);
    }

    public function storeEmploiDuTemps(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'jour' => 'required|in:lundi,mardi,mercredi,jeudi,vendredi,samedi',
            'heure_debut' => 'required|date_format:H:i',
            'heure_fin' => 'required|date_format:H:i|after:heure_debut',
            'matiere_id' => 'nullable|exists:matieres,id',
            'prof_id' => 'nullable|exists:profs,id',
            'type_cours' => 'nullable|in:cours,recreation,pause',
        ]);

        $classe = Classe::findOrFail($request->classe_id);
        $this->verifyOwnership($classe, $request);

        if ($request->matiere_id) {
            $matiere = Matiere::findOrFail($request->matiere_id);
            $this->verifyOwnership($matiere, $request);
        }

        if ($request->prof_id) {
            $prof = Prof::findOrFail($request->prof_id);
            $this->verifyOwnership($prof, $request);
        }

        $edt = EmploiDuTemps::create([
            'school_id' => $school->id,
            'classe_id' => $request->classe_id,
            'annee_scolaire_id' => $anneeActive?->id,
            'jour' => $request->jour,
            'heure_debut' => $request->heure_debut,
            'heure_fin' => $request->heure_fin,
            'matiere_id' => $request->matiere_id,
            'prof_id' => $request->prof_id,
            'type_cours' => $request->type_cours ?? 'cours',
        ]);

        return response()->json($edt->load('classe', 'matiere', 'prof'), 201);
    }

    public function annonces(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        return response()->json($school->annonces()->with('author', 'classe')->latest()->get());
    }

    public function storeAnnonce(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $request->validate([
            'titre' => 'required|string|max:255',
            'contenu' => 'required|string|max:5000',
            'type' => 'nullable|in:info,alerte,urgent',
            'classe_id' => 'nullable|exists:classes,id',
        ]);

        $annonce = $school->annonces()->create([
            'user_id' => $request->user()->id,
            'classe_id' => $request->classe_id,
            'titre' => strip_tags($request->titre),
            'contenu' => strip_tags($request->contenu),
            'type' => $request->type ?? 'info',
            'publie' => true,
        ]);

        return response()->json($annonce->load('classe'), 201);
    }

    public function conversations(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        return response()->json($school->conversations()->with('lastMessage')->get());
    }

    public function demandesAcces(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);

        $demandes = DemandeAcces::where('school_id', $school->id)
            ->with('eleve', 'parent')
            ->latest()
            ->get();

        return response()->json($demandes);
    }

    public function updateDemandeAcces(Request $request, DemandeAcces $demande): JsonResponse
    {
        $this->verifyOwnership($demande, $request);
        $request->validate([
            'statut' => 'required|in:approuve,rejete',
            'reponse_admin' => 'nullable|string|max:500',
        ]);

        $demande->update([
            'statut' => $request->statut,
            'reponse_admin' => $request->reponse_admin,
        ]);

        if ($request->statut === 'approuve' && $demande->type === 'unlock_access') {
            $demande->eleve->update(['access_locked' => false, 'lock_message' => null]);
        }

        $parent = $demande->parent;
        if ($parent) {
            $eleveNom = $demande->eleve?->nom_complet ?? 'votre enfant';
            $statut = $request->statut === 'approuve' ? 'approuvée' : 'rejetée';
            $this->pushService->sendToParent(
                $parent,
                'Demande d\'accès ' . $statut,
                "Votre demande d'accès pour $eleveNom a été $statut.",
                ['type' => 'demande_acces', 'statut' => $request->statut]
            );
        }

        return response()->json($demande);
    }

    public function toggleProfAccess(Prof $prof, Request $request): JsonResponse
    {
        $this->verifyOwnership($prof, $request);
        $prof->update(['active' => !$prof->active]);
        return response()->json($prof);
    }

    public function resetProfPin(Prof $prof, Request $request): JsonResponse
    {
        $this->verifyOwnership($prof, $request);
        $tempPin = str_pad(random_int(1000, 9999), 4, '0', STR_PAD_LEFT);
        $prof->forceFill([
            'pin_hash' => \Hash::make($tempPin),
            'pin_must_change' => true,
        ])->save();

        return response()->json([
            'message' => 'PIN du professeur réinitialisé.',
            'temporary_pin' => $tempPin,
        ]);
    }

    public function resetParentPin(\App\Models\ParentModel $parent, Request $request): JsonResponse
    {
        $this->verifyOwnership($parent, $request);
        $tempPin = str_pad(random_int(1000, 9999), 4, '0', STR_PAD_LEFT);
        $parent->forceFill([
            'pin_hash' => \Hash::make($tempPin),
            'pin_must_change' => true,
        ])->save();

        return response()->json([
            'message' => 'PIN du parent réinitialisé.',
            'temporary_pin' => $tempPin,
        ]);
    }

    public function parents(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $parents = \App\Models\ParentModel::whereHas('eleves', fn($q) => $q->where('school_id', $school->id))
            ->with('eleves')
            ->get();

        return response()->json(['success' => true, 'parents' => $parents]);
    }

    public function toggleEleveAccess(Eleve $eleve, Request $request): JsonResponse
    {
        $this->verifyOwnership($eleve, $request);
        $eleve->update(['active' => !$eleve->active]);
        return response()->json($eleve);
    }

    public function bulkToggleEleveLock(Request $request): JsonResponse
    {
        $request->validate([
            'eleve_ids' => 'required|array',
            'eleve_ids.*' => 'required|exists:eleves,id',
            'lock' => 'required|boolean',
            'message' => 'nullable|string|max:500',
        ]);

        $school = $this->getSchool($request);
        $locked = $request->boolean('lock');
        $message = strip_tags($request->message ?? 'Accès verrouillé par l\'établissement. Veuillez régulariser votre situation.');

        $eleves = Eleve::where('school_id', $school->id)
            ->whereIn('id', $request->eleve_ids)
            ->get();

        foreach ($eleves as $eleve) {
            $eleve->update([
                'access_locked' => $locked,
                'lock_message' => $locked ? $message : null,
            ]);
        }

        $updated = $eleves->count();

        if ($locked) {
            $eleves = Eleve::whereIn('id', $request->eleve_ids)->with('parents')->get();
            foreach ($eleves as $eleve) {
                foreach ($eleve->parents as $parent) {
                    $this->pushService->notifyParentBlocked(
                        $parent,
                        $eleve->nom_complet,
                        $request->message ?? 'Accès verrouillé par l\'établissement.'
                    );
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => "$updated élève(s) " . ($locked ? 'bloqué(s)' : 'débloqué(s)') . ' avec succès.',
            'updated' => $updated,
        ]);
    }

    public function elevesFiltered(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $query = $school->eleves()->with('classe', 'parents');

        // Filter by class
        if ($request->filled('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        // Filter by classes (array)
        if ($request->filled('classe_ids') && is_array($request->classe_ids)) {
            $query->whereIn('classe_id', $request->classe_ids);
        }

        // Filter by access_locked
        if ($request->has('access_locked')) {
            $query->where('access_locked', $request->boolean('access_locked'));
        }

        // Filter by active status
        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        // Filter by subscription status
        if ($request->has('has_subscription')) {
            $hasSub = $request->boolean('has_subscription');
            if ($hasSub) {
                $query->whereHas('subscriptions', function ($q) use ($anneeActive) {
                    if ($anneeActive) $q->where('annee_scolaire_id', $anneeActive->id);
                });
            } else {
                $query->whereDoesntHave('subscriptions', function ($q) use ($anneeActive) {
                    if ($anneeActive) $q->where('annee_scolaire_id', $anneeActive->id);
                });
            }
        }

        // Filter by payment status: paid, unpaid, partial
        if ($request->filled('payment_status')) {
            $status = $request->input('payment_status');
            $query->whereHas('subscriptions', function ($q) use ($status, $anneeActive) {
                if ($anneeActive) $q->where('annee_scolaire_id', $anneeActive->id);
                switch ($status) {
                    case 'paid':
                        $q->where('abonnement_paye', true);
                        break;
                    case 'unpaid':
                        $q->where('abonnement_paye', false);
                        break;
                    case 'partial':
                        $q->where('abonnement_paye', false)
                          ->whereHas('payments');
                        break;
                }
            });
        }

        // Filter by minimum remaining amount
        if ($request->filled('min_remaining')) {
            $minRemaining = (float) $request->input('min_remaining');
            $query->whereHas('subscriptions', function ($q) use ($minRemaining, $anneeActive) {
                if ($anneeActive) $q->where('annee_scolaire_id', $anneeActive->id);
                $q->whereRaw('(montant_mensuel * 10 - COALESCE((SELECT SUM(montant) FROM subscription_payments WHERE subscription_id = subscriptions.id), 0)) >= ?', [$minRemaining]);
            });
        }

        // Search by name or matricule
        if ($request->filled('search')) {
            $search = str_replace(['%', '_'], ['\\%', '\\_'], $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('matricule', 'like', "%{$search}%");
            });
        }

        $eleves = $query->get();

        // Enrich with subscription/payment data
        $enriched = $eleves->map(function ($eleve) use ($anneeActive) {
            $subscription = $eleve->subscriptions()
                ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
                ->with('payments')
                ->first();

            $totalPaye = $subscription ? $subscription->payments->sum('montant') : 0;
            $moisPayes = $subscription ? ($subscription->mois_payes ?? []) : [];
            $moisImpayes = $this->calculateUnpaidMonths($moisPayes);

            // Abonnement: monthly, tracked by mois_payes
            $montantMensuel = $subscription ? ($subscription->montant_mensuel ?? 0) : 0;
            if ($montantMensuel <= 0) {
                $montantMensuel = $eleve->classe?->ecolage ?? 0;
                if ($montantMensuel > 0 && $subscription) {
                    $subscription->update(['montant_mensuel' => $montantMensuel]);
                }
            }
            $detteAbonnement = count($moisImpayes) * $montantMensuel;

            // Scolarité: total frais linked to class + ecolage, paid via frais payments
            $fraisPayesIds = $subscription
                ? $subscription->payments->where('type', 'frais')->pluck('frais_id')->filter()->values()->all()
                : [];

            $fraisDeLaClasse = $eleve->classe
                ? $eleve->classe->fraisClasses()->with('frais')->get()->pluck('frais')->filter()
                : collect();

            $ecolage = $eleve->classe?->ecolage ?? 0;
            $totalFraisScolarite = $fraisDeLaClasse->sum('montant') + $ecolage;
            $totalFraisPaye = $fraisDeLaClasse
                ->filter(fn($f) => in_array($f->id, $fraisPayesIds))
                ->sum('montant');

            // Scolarite (ecolage) payments
            $scolaritePaye = $subscription
                ? $subscription->payments->where('type', 'scolarite')->sum('montant')
                : 0;
            $resteEcolage = max(0, $ecolage - $scolaritePaye);
            $resteFrais = max(0, $fraisDeLaClasse->sum('montant') - $totalFraisPaye);

            return [
                'id' => $eleve->id,
                'nom' => $eleve->nom,
                'prenom' => $eleve->prenom,
                'nom_complet' => $eleve->nom_complet,
                'matricule' => $eleve->matricule,
                'sexe' => $eleve->sexe,
                'classe' => $eleve->classe?->libelle,
                'classe_id' => $eleve->classe_id,
                'active' => $eleve->active,
                'access_locked' => $eleve->access_locked,
                'lock_message' => $eleve->lock_message,
                'parents' => $eleve->parents->map(fn($p) => [
                    'id' => $p->id,
                    'telephone' => $p->telephone,
                    'code' => $p->code_used ? null : $p->makeVisible(['code'])->code,
                    'code_used' => $p->code_used,
                ]),
                'subscription' => $subscription ? [
                    'id' => $subscription->id,
                    'abonnement_paye' => $subscription->abonnement_paye,
                    'frais_paye' => $subscription->frais_paye,
                    'montant_mensuel' => $montantMensuel,
                    'mois_payes' => $moisPayes,
                    'total_paye' => $totalPaye,
                    'frais_payes_ids' => $fraisPayesIds,
                ] : null,
                'dette' => [
                    'ecolage' => $ecolage,
                    'scolarite' => $resteEcolage,
                    'frais' => $resteFrais,
                    'abonnement' => $detteAbonnement,
                    'mois_impayes' => $moisImpayes,
                    'montant_mensuel' => $montantMensuel,
                    'frais_total' => $totalFraisScolarite,
                    'frais_paye' => $totalFraisPaye,
                ],
            ];
        });

        return response()->json(['success' => true, 'eleves' => $enriched]);
    }

    public function eleveProgression(Request $request, int $eleve): JsonResponse
    {
        $school = $this->getSchool($request);
        $eleveModel = Eleve::where('id', $eleve)->where('school_id', $school->id)->firstOrFail();

        $anneesScolaires = AnneeScolaire::where('school_id', $school->id)->orderBy('id')->get();

        $progression = [];
        $totalNotes = 0;
        $allMoyennes = [];

        foreach ($anneesScolaires as $annee) {
            $notes = Note::where('eleve_id', $eleveModel->id)
                ->whereHas('evaluation', fn($q) => $q->where('annee_scolaire_id', $annee->id))
                ->with('evaluation.matiere', 'evaluation.periode')
                ->get();

            if ($notes->isEmpty()) continue;

            $notesFormatted = $notes->map(function ($n) use ($eleveModel) {
                $eval = $n->evaluation;
                $prof = '—';
                if ($eval && $eval->matiere_id && $eleveModel->classe_id) {
                    $aff = Affectation::where('classe_id', $eleveModel->classe_id)
                        ->where('matiere_id', $eval->matiere_id)
                        ->first();
                    if ($aff && $aff->prof) {
                        $prof = trim($aff->prof->prenom . ' ' . $aff->prof->nom);
                    }
                }
                return [
                    'id' => $n->id,
                    'matiere' => $eval?->matiere?->libelle ?? '—',
                    'prof' => $prof,
                    'periode' => $eval?->periode?->libelle ?? '—',
                    'type_evaluation' => $eval?->type ?? '—',
                    'valeur' => (float) $n->note,
                    'date_evaluation' => $eval?->date ? \Illuminate\Support\Carbon::parse($eval->date)->format('d/m/Y') : '',
                    'remarque' => $n->appreciation,
                    'evaluation' => $eval?->titre,
                ];
            });

            $valeurs = $notesFormatted->pluck('valeur')->filter()->values();
            $moyenne = $valeurs->isNotEmpty() ? round($valeurs->avg(), 2) : null;

            $progression[] = [
                'annee_scolaire' => $annee->libelle,
                'annee_id' => $annee->id,
                'notes' => $notesFormatted->toArray(),
                'moyenne' => $moyenne,
                'meilleure_note' => $valeurs->isNotEmpty() ? $valeurs->max() : 0,
                'plus_basse_note' => $valeurs->isNotEmpty() ? $valeurs->min() : 0,
                'nombre_notes' => $valeurs->count(),
            ];

            $totalNotes += $valeurs->count();
            if ($moyenne !== null) $allMoyennes[] = $moyenne;
        }

        return response()->json([
            'success' => true,
            'eleve' => [
                'id' => $eleveModel->id,
                'nom' => $eleveModel->nom,
                'prenom' => $eleveModel->prenom,
                'matricule' => $eleveModel->matricule,
                'classe_actuelle' => $eleveModel->classe?->libelle,
                'section' => $eleveModel->classe?->section?->libelle,
            ],
            'progression' => $progression,
            'resume' => [
                'total_notes' => $totalNotes,
                'moyenne_generale' => $allMoyennes ? round(array_sum($allMoyennes) / count($allMoyennes), 2) : null,
                'nb_annees' => count($progression),
            ],
        ]);
    }

    private function calculateUnpaidMonths(array $moisPayes): array
    {
        $allMonths = [
            'septembre', 'octobre', 'novembre', 'decembre',
            'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin'
        ];
        return array_values(array_diff($allMonths, $moisPayes));
    }

    public function exportElevesCsv(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $anneeActive = $school->anneesScolaires()->where('active', true)->first();

        $eleves = $school->eleves()
            ->with('classe', 'parents', 'subscriptions.payments')
            ->get();

        $data = $eleves->map(function ($eleve) use ($anneeActive) {
            $subscription = $eleve->subscriptions()
                ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
                ->first();

            $totalPaye = $subscription ? $subscription->payments->sum('montant') : 0;
            $montantMensuel = $subscription?->montant_mensuel ?? 0;
            $moisPayes = $subscription?->mois_payes ?? [];
            $moisImpayes = $this->calculateUnpaidMonths($moisPayes);
            $dette = count($moisImpayes) * $montantMensuel;

            return [
                'Nom' => $eleve->nom,
                'Prénom' => $eleve->prenom,
                'Matricule' => $eleve->matricule ?? '',
                'Classe' => $eleve->classe?->libelle ?? '',
                ' Sexe' => $eleve->sexe ?? '',
                'Téléphone parent' => $eleve->parents->first()?->telephone ?? '',
                'Actif' => $eleve->active ? 'Oui' : 'Non',
                'Bloqué' => $eleve->access_locked ? 'Oui' : 'Non',
                'Abonnement payé' => $subscription?->abonnement_paye ? 'Oui' : 'Non',
                'Total payé (FCFA)' => $totalPaye,
                'Dette (FCFA)' => $dette,
                'Mois impayés' => implode(', ', $moisImpayes),
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function parentFeedback(Request $request): JsonResponse
    {
        $school = $this->getSchool($request);
        $parentIds = $school->eleves()->with('parents')->get()->pluck('parents.*.id')->flatten()->unique();

        $feedback = ParentFeedback::whereIn('parent_id', $parentIds)
            ->with('parent')
            ->latest()
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'type' => $f->type,
                'subject' => $f->subject,
                'contenu' => $f->contenu,
                'lu' => $f->lu,
                'parent_telephone' => $f->parent?->telephone,
                'created_at' => $f->created_at?->format('d/m/Y H:i'),
            ]);

        return response()->json(['success' => true, 'feedback' => $feedback]);
    }

    public function markFeedbackRead(Request $request, int $id): JsonResponse
    {
        $feedback = ParentFeedback::findOrFail($id);
        $feedback->update(['lu' => true]);
        return response()->json(['success' => true]);
    }
}
