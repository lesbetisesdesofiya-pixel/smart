<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use App\Models\AnneeScolaire;
use App\Models\Eleve;
use App\Models\Evaluation;
use App\Models\Note;
use App\Models\Periode;
use App\Models\Prof;
use App\Models\Remarque;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    private PushNotificationService $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    private function getProf(Request $request): Prof
    {
        $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
        if (!$accessToken) {
            abort(401, 'Token invalide');
        }
        $prof = $accessToken->tokenable;
        if (!$prof->relationLoaded('affectations')) {
            $prof->load('school', 'affectations.matiere', 'affectations.classe');
        }
        return $prof;
    }

    private function resolveAnneeScolaire(Request $request, Prof $prof): ?AnneeScolaire
    {
        return $prof->school->anneesScolaires()->where('active', true)->first();
    }

    public function dashboard(Request $request): JsonResponse
    {
        $prof = $this->getProf($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $prof);

        $affectations = $prof->affectations()
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('matiere', 'classe')
            ->get();

        $classes = $affectations->pluck('classe')->unique('id')->values();
        $matieres = $affectations->pluck('matiere')->unique('id')->values();

        $pairs = $affectations->map(fn($a) => ['classe_id' => $a->classe_id, 'matiere_id' => $a->matiere_id])->toArray();

        // Get evaluations matching exact (classe, matiere) pairs
        $evaluations = Evaluation::where(function ($q) use ($pairs) {
                foreach ($pairs as $pair) {
                    $q->orWhere(function ($sub) use ($pair) {
                        $sub->where('classe_id', $pair['classe_id'])
                            ->where('matiere_id', $pair['matiere_id']);
                    });
                }
            })
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('classe', 'matiere')
            ->withCount('notes')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'titre' => $e->titre,
                'type' => $e->type,
                'matiere' => $e->matiere ? ['id' => $e->matiere_id, 'libelle' => $e->matiere->libelle] : null,
                'matiere_id' => $e->matiere_id,
                'classe' => $e->classe ? ['id' => $e->classe_id, 'libelle' => $e->classe->libelle] : null,
                'date' => $e->date?->format('Y-m-d'),
                'coefficient' => $e->coefficient,
                'note_sur' => $e->note_sur,
                'notes_count' => $e->notes_count,
                'has_notes' => $e->notes_count > 0,
                'is_group_parent' => false,
            ]);

        // Also get group parent evaluations whose children match the teacher's affectations
        $groupParents = Evaluation::where('is_group_parent', true)
            ->whereHas('groupChildren', function ($q) use ($pairs) {
                $q->where(function ($qq) use ($pairs) {
                    foreach ($pairs as $pair) {
                        $qq->orWhere(function ($sub) use ($pair) {
                            $sub->where('classe_id', $pair['classe_id'])
                                ->where('matiere_id', $pair['matiere_id']);
                        });
                    }
                });
            })
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with(['matiere', 'periode'])
            ->withCount('groupChildren')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($g) => [
                'id' => $g->id,
                'titre' => $g->titre,
                'type' => $g->type,
                'matiere' => $g->matiere ? ['id' => $g->matiere_id, 'libelle' => $g->matiere->libelle] : null,
                'matiere_id' => $g->matiere_id,
                'classe' => $g->groupChildren->first()?->classe ? ['id' => $g->groupChildren->first()->classe_id, 'libelle' => $g->groupChildren->pluck('classe.libelle')->filter()->join(', ')] : null,
                'periode' => $g->periode?->libelle,
                'date' => $g->date?->format('Y-m-d'),
                'coefficient' => $g->coefficient,
                'note_sur' => $g->note_sur,
                'nb_classes' => $g->group_children_count,
                'is_group_parent' => true,
                'classes' => $g->groupChildren()->with('classe')->get()->map(fn($c) => [
                    'id' => $c->id,
                    'classe_id' => $c->classe_id,
                    'libelle' => $c->classe?->libelle,
                    'nb_notes' => $c->notes()->count(),
                ]),
            ]);

        $allEvals = $groupParents->concat($evaluations)->sortByDesc('date')->take(10)->values();

        $classesWithStudents = $classes->map(function ($classe) use ($anneeActive) {
            $eleves = \App\Models\Eleve::where('classe_id', $classe->id)
                ->where('active', true)
                ->when($anneeActive, function ($q) use ($anneeActive, $classe) {
                    $q->whereHas('eleveClasses', fn($eq) => $eq
                        ->where('annee_scolaire_id', $anneeActive->id)
                        ->where('classe_id', $classe->id)
                    );
                })
                ->get()
                ->map(fn($e) => [
                    'id' => $e->id,
                    'nom' => $e->nom,
                    'prenom' => $e->prenom,
                    'nom_complet' => $e->nom_complet,
                ])
                ->sortBy('nom')
                ->values();

            return [
                'id' => $classe->id,
                'libelle' => $classe->libelle,
                'section' => $classe->section,
                'eleves_count' => $eleves->count(),
                'eleves' => $eleves,
            ];
        });

        return response()->json([
            'prof' => [
                'id' => $prof->id,
                'nom' => $prof->nom,
                'prenom' => $prof->prenom,
                'nom_complet' => $prof->nom_complet,
                'school' => $prof->school->nom,
                'school_id' => $prof->school_id,
                'ai_notes_enabled' => $prof->school->ai_notes_enabled ?? false,
            ],
            'classes' => $classesWithStudents,
            'matieres' => $matieres,
            'evaluations' => $allEvals,
            'stats' => [
                'nb_classes' => $classes->count(),
                'nb_matieres' => $matieres->count(),
                'nb_evaluations' => $evaluations->count() + $groupParents->count(),
            ],
        ]);
    }

    public function grades(Request $request): JsonResponse
    {
        $prof = $this->getProf($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $prof);

        $affectations = $prof->affectations()
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->get();

        $notes = Note::whereHas('evaluation', function ($q) use ($affectations, $anneeActive) {
                $q->whereIn('classe_id', $affectations->pluck('classe_id'))
                  ->when($anneeActive, fn($eq) => $eq->where('annee_scolaire_id', $anneeActive->id));
            })
            ->with('evaluation.matiere', 'evaluation.classe', 'eleve')
            ->get();

        return response()->json($notes);
    }

    public function storeGrades(Request $request): JsonResponse
    {
        $prof = $this->getProf($request);

        $request->validate([
            'evaluation_id' => 'required|exists:evaluations,id',
            'notes' => 'required|array',
            'notes.*.eleve_id' => 'required|exists:eleves,id',
            'notes.*.note' => 'nullable|numeric|min:0',
            'notes.*.appreciation' => 'nullable|string',
        ]);

        $evaluation = Evaluation::findOrFail($request->evaluation_id);

        // For group parent, the evaluation_id should be the child evaluation
        if ($evaluation->is_group_parent) {
            $pairs = $prof->affectations->map(fn($a) => ['classe_id' => $a->classe_id, 'matiere_id' => $a->matiere_id])->toArray();
            $child = Evaluation::where('evaluation_group_id', $evaluation->id)
                ->where(function ($q) use ($pairs) {
                    foreach ($pairs as $pair) {
                        $q->orWhere(function ($sub) use ($pair) {
                            $sub->where('classe_id', $pair['classe_id'])
                                ->where('matiere_id', $pair['matiere_id']);
                        });
                    }
                })
                ->first();

            if (!$child) {
                return response()->json(['message' => 'Vous n\'enseignez pas dans cette classe pour cette matière'], 403);
            }

            $matiere = \App\Models\Matiere::find($child->matiere_id);

            foreach ($request->notes as $noteData) {
                Note::updateOrCreate(
                    ['evaluation_id' => $child->id, 'eleve_id' => $noteData['eleve_id']],
                    [
                        'note' => $noteData['note'] ?? null,
                        'appreciation' => $noteData['appreciation'] ?? null,
                    ]
                );

                if (!is_null($noteData['note'])) {
                    $eleve = Eleve::with('parents')->find($noteData['eleve_id']);
                    if ($eleve) {
                        foreach ($eleve->parents as $parent) {
                            $this->pushService->notifyParentNewGrade(
                                $parent,
                                $eleve->nom_complet,
                                $matiere->libelle ?? $child->titre,
                                $noteData['note'],
                                $child->note_sur ?? 20
                            );
                        }
                    }
                }
            }

            return response()->json(['message' => 'Notes enregistrées']);
        }

        // Simple evaluation
        $pairs = $prof->affectations->map(fn($a) => ['classe_id' => $a->classe_id, 'matiere_id' => $a->matiere_id])->toArray();
        $allowed = collect($pairs)->contains(fn($p) => $p['classe_id'] == $evaluation->classe_id && $p['matiere_id'] == $evaluation->matiere_id);
        if (!$allowed) {
            return response()->json(['message' => 'Vous n\'enseignez pas dans cette classe'], 403);
        }

        $matiere = \App\Models\Matiere::find($evaluation->matiere_id);

        foreach ($request->notes as $noteData) {
            Note::updateOrCreate(
                ['evaluation_id' => $request->evaluation_id, 'eleve_id' => $noteData['eleve_id']],
                [
                    'note' => $noteData['note'] ?? null,
                    'appreciation' => $noteData['appreciation'] ?? null,
                ]
            );

            if (!is_null($noteData['note'])) {
                $eleve = Eleve::with('parents')->find($noteData['eleve_id']);
                if ($eleve) {
                    foreach ($eleve->parents as $parent) {
                        $this->pushService->notifyParentNewGrade(
                            $parent,
                            $eleve->nom_complet,
                            $matiere->libelle ?? $evaluation->titre,
                            $noteData['note'],
                            $evaluation->note_sur ?? 20
                        );
                    }
                }
            }
        }

        return response()->json(['message' => 'Notes enregistrées']);
    }

    public function evaluations(Request $request): JsonResponse
    {
        $prof = $this->getProf($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $prof);

        $affectations = $prof->affectations()
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->get();

        $pairs = $affectations->map(fn($a) => ['classe_id' => $a->classe_id, 'matiere_id' => $a->matiere_id])->toArray();

        // Get group parent evaluations whose children match the teacher's affectations
        $groupParents = Evaluation::where('is_group_parent', true)
            ->whereHas('groupChildren', function ($q) use ($pairs) {
                $q->where(function ($qq) use ($pairs) {
                    foreach ($pairs as $pair) {
                        $qq->orWhere(function ($sub) use ($pair) {
                            $sub->where('classe_id', $pair['classe_id'])
                                ->where('matiere_id', $pair['matiere_id']);
                        });
                    }
                });
            })
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with(['matiere', 'periode'])
            ->withCount('groupChildren')
            ->get()
            ->map(fn($g) => [
                'id' => $g->id,
                'titre' => $g->titre,
                'type' => $g->type,
                'matiere' => $g->matiere ? ['id' => $g->matiere_id, 'libelle' => $g->matiere->libelle] : null,
                'matiere_id' => $g->matiere_id,
                'classe' => $g->groupChildren->first()?->classe ? ['id' => $g->groupChildren->first()->classe_id, 'libelle' => $g->groupChildren->pluck('classe.libelle')->filter()->join(', ')] : null,
                'periode' => $g->periode?->libelle,
                'periode_id' => $g->periode_id,
                'date' => $g->date?->format('Y-m-d'),
                'coefficient' => $g->coefficient,
                'note_sur' => $g->note_sur,
                'nb_classes' => $g->group_children_count,
                'is_group_parent' => true,
                'has_notes' => $g->groupChildren->some(fn($c) => $c->notes()->count() > 0),
                'classes' => $g->groupChildren()->with('classe')->get()->map(fn($c) => [
                    'id' => $c->id,
                    'classe_id' => $c->classe_id,
                    'libelle' => $c->classe?->libelle,
                    'nb_notes' => $c->notes()->count(),
                ]),
            ]);

        // Get simple (non-group) evaluations matching exact (classe, matiere) pair
        $simpleEvals = Evaluation::where('is_group_parent', false)
            ->where(function ($q) use ($pairs) {
                foreach ($pairs as $pair) {
                    $q->orWhere(function ($sub) use ($pair) {
                        $sub->where('classe_id', $pair['classe_id'])
                            ->where('matiere_id', $pair['matiere_id']);
                    });
                }
            })
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('classe', 'matiere', 'periode')
            ->withCount('notes')
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'titre' => $e->titre,
                'type' => $e->type,
                'matiere' => $e->matiere ? ['id' => $e->matiere_id, 'libelle' => $e->matiere->libelle] : null,
                'matiere_id' => $e->matiere_id,
                'classe' => $e->classe ? ['id' => $e->classe_id, 'libelle' => $e->classe->libelle] : null,
                'periode' => $e->periode?->libelle,
                'periode_id' => $e->periode_id,
                'date' => $e->date?->format('Y-m-d'),
                'coefficient' => $e->coefficient,
                'note_sur' => $e->note_sur,
                'notes_count' => $e->notes_count,
                'has_notes' => $e->notes_count > 0,
                'is_group_parent' => false,
            ]);

        return response()->json(['groups' => $groupParents, 'evaluations' => $simpleEvals]);
    }

    public function evaluationNotes(Request $request, int $evaluationId): JsonResponse
    {
        $prof = $this->getProf($request);

        $evaluation = Evaluation::where('id', $evaluationId)->firstOrFail();

        if ($evaluation->is_group_parent) {
            $pairs = $prof->affectations->map(fn($a) => ['classe_id' => $a->classe_id, 'matiere_id' => $a->matiere_id])->toArray();
            $child = Evaluation::where('evaluation_group_id', $evaluation->id)
                ->where(function ($q) use ($pairs) {
                    foreach ($pairs as $pair) {
                        $q->orWhere(function ($sub) use ($pair) {
                            $sub->where('classe_id', $pair['classe_id'])
                                ->where('matiere_id', $pair['matiere_id']);
                        });
                    }
                })
                ->firstOrFail();

            $notes = Note::where('evaluation_id', $child->id)
                ->with('eleve')
                ->get()
                ->map(fn($n) => [
                    'eleve_id' => $n->eleve_id,
                    'nom_complet' => $n->eleve->nom_complet,
                    'note' => $n->note,
                    'appreciation' => $n->appreciation,
                ]);

            return response()->json([
                'evaluation' => [
                    'id' => $evaluation->id,
                    'titre' => $evaluation->titre,
                    'type' => $evaluation->type,
                    'matiere' => $evaluation->matiere?->libelle,
                    'classe' => $child->classe?->libelle,
                    'note_sur' => $evaluation->note_sur,
                ],
                'notes' => $notes,
            ]);
        }

        $pairs = $prof->affectations->map(fn($a) => ['classe_id' => $a->classe_id, 'matiere_id' => $a->matiere_id])->toArray();
        $allowed = collect($pairs)->contains(fn($p) => $p['classe_id'] == $evaluation->classe_id && $p['matiere_id'] == $evaluation->matiere_id);
        if (!$allowed) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $notes = Note::where('evaluation_id', $evaluationId)
            ->with('eleve')
            ->get()
            ->map(fn($n) => [
                'eleve_id' => $n->eleve_id,
                'nom_complet' => $n->eleve->nom_complet,
                'note' => $n->note,
                'appreciation' => $n->appreciation,
            ]);

        return response()->json([
            'evaluation' => [
                'id' => $evaluation->id,
                'titre' => $evaluation->titre,
                'type' => $evaluation->type,
                'matiere' => $evaluation->matiere?->libelle,
                'classe' => $evaluation->classe?->libelle,
                'note_sur' => $evaluation->note_sur,
            ],
            'notes' => $notes,
        ]);
    }

    public function classDetails(Request $request, int $classeId): JsonResponse
    {
        $prof = $this->getProf($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $prof);

        $hasAccess = $prof->affectations()
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->where('classe_id', $classeId)
            ->exists();

        if (!$hasAccess) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $elevesQuery = \App\Models\Eleve::where('classe_id', $classeId)->where('active', true);
        if ($anneeActive) {
            $elevesQuery = \App\Models\Eleve::whereHas('eleveClasses', fn($q) => $q
                ->where('annee_scolaire_id', $anneeActive->id)
                ->where('classe_id', $classeId)
            )->where('active', true);
        }

        $eleves = $elevesQuery
            ->with('parents:id')
            ->get()
            ->map(function ($eleve) {
                return [
                    'id' => $eleve->id,
                    'nom' => $eleve->nom,
                    'prenom' => $eleve->prenom,
                    'nom_complet' => $eleve->nom_complet,
                    'moyenne' => null,
                    'nb_notes' => 0,
                    'parent_id' => $eleve->parents->first()?->id,
                ];
            })
            ->sortBy('nom')
            ->values()
            ->map(function ($eleve, $index) {
                $eleve['rank'] = $index + 1;
                return $eleve;
            });

        return response()->json($eleves);
    }

    public function linkByCode(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:9',
        ]);

        $prof = Prof::where('code', strtoupper($request->code))
            ->where('code_used', true)
            ->first();

        if (!$prof) {
            return response()->json(['message' => 'Code invalide'], 404);
        }

        return response()->json([
            'id' => $prof->id,
            'nom_complet' => $prof->nom_complet,
            'school' => $prof->school->nom,
            'school_id' => $prof->school_id,
        ]);
    }

    public function storeEvaluation(Request $request): JsonResponse
    {
        $prof = $this->getProf($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $prof);

        $request->validate([
            'titre' => 'required|string',
            'type' => 'required|in:interrogation,devoir,composition',
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'periode_id' => 'nullable|exists:periodes,id',
            'date' => 'nullable|date',
            'coefficient' => 'nullable|numeric',
            'note_sur' => 'nullable|numeric',
        ]);

        $hasAccess = $prof->affectations()
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->where('classe_id', $request->classe_id)
            ->where('matiere_id', $request->matiere_id)
            ->exists();

        if (!$hasAccess) {
            return response()->json(['message' => 'Vous n\'enseignez pas cette matière dans cette classe'], 403);
        }

        $periodeId = $request->periode_id;
        if (!$periodeId) {
            $activePeriode = Periode::where('school_id', $prof->school_id)
                ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
                ->where('date_fin', '>=', now())
                ->orderBy('date_fin')
                ->first();
            $periodeId = $activePeriode?->id;
        }

        $evaluation = Evaluation::create([
            'school_id' => $prof->school_id,
            'titre' => $request->titre,
            'type' => $request->type,
            'classe_id' => $request->classe_id,
            'matiere_id' => $request->matiere_id,
            'periode_id' => $periodeId,
            'annee_scolaire_id' => $anneeActive?->id,
            'date' => $request->date,
            'coefficient' => $request->coefficient ?? 1,
            'note_sur' => $request->note_sur ?? 20,
        ]);

        return response()->json($evaluation, 201);
    }

    public function evaluationStudents(Request $request, int $evaluationId): JsonResponse
    {
        $prof = $this->getProf($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $prof);

        $evaluation = Evaluation::where('id', $evaluationId)->firstOrFail();

        // For group parent: find the child evaluation matching the teacher's affectation
        if ($evaluation->is_group_parent) {
            $pairs = $prof->affectations()
                ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
                ->get()
                ->map(fn($a) => ['classe_id' => $a->classe_id, 'matiere_id' => $a->matiere_id])->toArray();

            $child = Evaluation::where('evaluation_group_id', $evaluation->id)
                ->where(function ($q) use ($pairs) {
                    foreach ($pairs as $pair) {
                        $q->orWhere(function ($sub) use ($pair) {
                            $sub->where('classe_id', $pair['classe_id'])
                                ->where('matiere_id', $pair['matiere_id']);
                        });
                    }
                })
                ->firstOrFail();

            $existingNotes = Note::where('evaluation_id', $child->id)->get()->keyBy('eleve_id');

            // Get students in this class for this evaluation's year
            $elevesQuery = \App\Models\Eleve::where('classe_id', $child->classe_id);
            if ($child->annee_scolaire_id) {
                $elevesQuery = \App\Models\Eleve::whereHas('eleveClasses', fn($q) => $q
                    ->where('annee_scolaire_id', $child->annee_scolaire_id)
                    ->where('classe_id', $child->classe_id)
                );
            }

            $eleves = $elevesQuery->get()
                ->map(function ($eleve) use ($existingNotes, $child) {
                    $note = $existingNotes->get($eleve->id);
                    return [
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
                });

            return response()->json(['students' => $eleves]);
        }

        // Simple evaluation
        $pairs = $prof->affectations()
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->get()
            ->map(fn($a) => ['classe_id' => $a->classe_id, 'matiere_id' => $a->matiere_id])->toArray();

        $allowed = collect($pairs)->contains(fn($p) => $p['classe_id'] == $evaluation->classe_id && $p['matiere_id'] == $evaluation->matiere_id);
        if (!$allowed) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $existingNotes = Note::where('evaluation_id', $evaluationId)
            ->get()
            ->keyBy('eleve_id');

        // Get students in class for this evaluation's year
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

    public function studentEvolution(Request $request, int $eleveId): JsonResponse
    {
        $prof = $this->getProf($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $prof);

        $eleve = Eleve::findOrFail($eleveId);
        if ($eleve->school_id !== $prof->school_id) {
            return response()->json(['message' => 'Cet élève n\'appartient pas à votre école'], 403);
        }

        $affectations = $prof->affectations()
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->get();

        $notes = Note::where('eleve_id', $eleveId)
            ->whereHas('evaluation', function ($q) use ($affectations, $anneeActive) {
                $q->whereIn('classe_id', $affectations->pluck('classe_id'))
                  ->when($anneeActive, fn($eq) => $eq->where('annee_scolaire_id', $anneeActive->id));
            })
            ->with('evaluation.matiere', 'evaluation.periode')
            ->get();

        return response()->json($notes);
    }

    public function schools(Request $request): JsonResponse
    {
        $prof = $this->getProf($request);
        $prof->load('schools');

        $allSchools = collect();
        if ($prof->school) {
            $allSchools->push($prof->school);
        }
        foreach ($prof->schools as $s) {
            if (!$allSchools->contains('id', $s->id)) {
                $allSchools->push($s);
            }
        }

        return response()->json([
            'schools' => $allSchools->map(fn($s) => [
                'id' => $s->id,
                'nom' => $s->nom,
                'has_pin' => $prof->hasPin(),
            ]),
            'active_school_id' => $prof->school_id,
        ]);
    }

    public function addSchool(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'regex:/^[A-Z2-9]{4}-[A-Z2-9]{4}$/'],
        ]);

        $prof = $this->getProf($request);
        $code = strtoupper(trim($request->code));

        $school = \App\Models\School::where('code', $code)->first();

        if (!$school) {
            return response()->json(['message' => 'Code école invalide'], 404);
        }

        if ($prof->schools()->where('school_id', $school->id)->exists() || $prof->school_id === $school->id) {
            return response()->json(['message' => 'Vous êtes déjà associé à cette école'], 422);
        }

        $prof->schools()->attach($school->id);

        return response()->json([
            'message' => 'École ajoutée avec succès',
            'school' => ['id' => $school->id, 'nom' => $school->nom],
        ]);
    }

    public function selectSchool(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => 'required|exists:schools,id',
        ]);

        $prof = $this->getProf($request);

        $hasAccess = $prof->school_id === $request->school_id
            || $prof->schools()->where('school_id', $request->school_id)->exists();

        if (!$hasAccess) {
            return response()->json(['message' => 'Accès refusé à cette école'], 403);
        }

        $prof->update(['school_id' => $request->school_id]);
        $prof->load('school', 'affectations.matiere', 'affectations.classe');

        return response()->json([
            'message' => 'École sélectionnée',
            'school' => ['id' => $prof->school->id, 'nom' => $prof->school->nom],
        ]);
    }

    public function storeInterrogation(Request $request): JsonResponse
    {
        $prof = $this->getProf($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $prof);

        $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'date' => 'nullable|date',
        ]);

        $hasAccess = $prof->affectations()
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->where('classe_id', $request->classe_id)
            ->where('matiere_id', $request->matiere_id)
            ->exists();

        if (!$hasAccess) {
            return response()->json(['message' => 'Vous n\'enseignez pas cette matière dans cette classe'], 403);
        }

        $matiere = \App\Models\Matiere::find($request->matiere_id);
        $activePeriode = Periode::where('school_id', $prof->school_id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->orderBy('numero')
            ->first();

        if (!$activePeriode) {
            return response()->json(['message' => 'Aucune période configurée. Contactez l\'administration.'], 422);
        }

        $evaluation = Evaluation::create([
            'school_id' => $prof->school_id,
            'titre' => 'Interrogation de ' . ($matiere->libelle ?? 'Matière'),
            'type' => 'interrogation',
            'classe_id' => $request->classe_id,
            'matiere_id' => $request->matiere_id,
            'periode_id' => $activePeriode->id,
            'annee_scolaire_id' => $anneeActive?->id,
            'date' => $request->date ?? now()->toDateString(),
            'coefficient' => 1,
            'note_sur' => 20,
        ]);

        return response()->json([
            'id' => $evaluation->id,
            'titre' => $evaluation->titre,
            'type' => $evaluation->type,
            'date' => $evaluation->date,
            'coefficient' => $evaluation->coefficient,
            'note_sur' => $evaluation->note_sur,
            'matiere' => $matiere->libelle,
            'matiere_id' => $evaluation->matiere_id,
            'classe' => $evaluation->classe?->libelle,
            'classe_id' => $evaluation->classe_id,
        ], 201);
    }

    public function presences(Request $request): JsonResponse
    {
        $prof = $this->getProf($request);

        $allowedClasseIds = $prof->affectations->pluck('classe_id')->toArray();

        $query = \App\Models\Presence::whereHas('classe', fn($q) => $q->whereIn('school_id', [$prof->school_id]))
            ->whereIn('classe_id', $allowedClasseIds);

        if ($request->classe_id) {
            if (!in_array((int) $request->classe_id, $allowedClasseIds)) {
                return response()->json(['message' => 'Accès refusé à cette classe'], 403);
            }
            $query->where('classe_id', $request->classe_id);
        }
        if ($request->date) {
            $query->where('date', $request->date);
        }

        $presences = $query->with('eleve', 'classe', 'matiere')->get();

        return response()->json($presences);
    }

    public function storePresences(Request $request): JsonResponse
    {
        $prof = $this->getProf($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $prof);

        $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'nullable|exists:matieres,id',
            'date' => 'required|date',
            'heure_debut' => 'nullable|string',
            'heure_fin' => 'nullable|string',
            'presences' => 'required|array',
            'presences.*.eleve_id' => 'required|exists:eleves,id',
            'presences.*.est_present' => 'required|boolean',
            'presences.*.remarque' => 'nullable|string',
        ]);

        $hasAccess = $prof->affectations()
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->where('classe_id', $request->classe_id)
            ->exists();

        if (!$hasAccess) {
            return response()->json(['message' => 'Vous n\'enseignez pas dans cette classe'], 403);
        }

        foreach ($request->presences as $p) {
            \App\Models\Presence::updateOrCreate(
                [
                    'classe_id' => $request->classe_id,
                    'eleve_id' => $p['eleve_id'],
                    'date' => $request->date,
                    'heure_debut' => $request->heure_debut,
                ],
                [
                    'school_id' => $prof->school_id,
                    'prof_id' => $prof->id,
                    'matiere_id' => $request->matiere_id,
                    'annee_scolaire_id' => $anneeActive?->id,
                    'heure_fin' => $request->heure_fin,
                    'est_present' => $p['est_present'],
                    'remarque' => $p['remarque'] ?? null,
                ]
            );

            if (!$p['est_present']) {
                $eleve = Eleve::with('parents')->find($p['eleve_id']);
                if ($eleve) {
                    foreach ($eleve->parents as $parent) {
                        $this->pushService->notifyParentAbsence(
                            $parent,
                            $eleve->nom_complet,
                            $request->date
                        );
                    }
                }
            }
        }

        return response()->json(['message' => 'Présences enregistrées']);
    }

    public function emploiDuTemps(Request $request): JsonResponse
    {
        $prof = $this->getProf($request);
        $anneeActive = $this->resolveAnneeScolaire($request, $prof);

        $emploi = \App\Models\EmploiDuTemps::where('prof_id', $prof->id)
            ->where('school_id', $prof->school_id)
            ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
            ->with('classe', 'matiere')
            ->get();

        return response()->json($emploi);
    }

    public function storeRemarque(Request $request): JsonResponse
    {
        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'type' => 'required|in:comportement,academique,general',
            'contenu' => 'required|string|max:1000',
        ]);

        $prof = $this->getProf($request);
        $eleve = Eleve::with('classe', 'parents')->findOrFail($request->eleve_id);

        if ($eleve->school_id !== $prof->school_id) {
            return response()->json(['message' => 'Cet élève n\'appartient pas à votre école'], 403);
        }

        $hasAccess = $prof->affectations->contains(fn($a) => $a->classe_id == $eleve->classe_id);
        if (!$hasAccess) {
            return response()->json(['message' => 'Vous n\'enseignez pas dans la classe de cet élève'], 403);
        }

        $remarque = Remarque::create([
            'eleve_id' => $request->eleve_id,
            'prof_id' => $prof->id,
            'school_id' => $prof->school_id,
            'classe_id' => $eleve->classe_id,
            'type' => $request->type,
            'contenu' => strip_tags($request->contenu),
            'visible_parent' => true,
        ]);

        foreach ($eleve->parents as $parent) {
            $this->pushService->notifyParentNewRemark(
                $parent,
                $eleve->nom_complet,
                $request->type
            );
        }

        return response()->json($remarque, 201);
    }

    public function remarques(Request $request): JsonResponse
    {
        $prof = $this->getProf($request);

        $remarques = Remarque::where('prof_id', $prof->id)
            ->with('eleve')
            ->latest()
            ->get();

        return response()->json($remarques);
    }
}
