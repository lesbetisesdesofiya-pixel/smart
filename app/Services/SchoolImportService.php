<?php

namespace App\Services;

use App\Models\Affectation;
use App\Models\AnneeScolaire;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\EleveClasse;
use App\Models\EmploiDuTemps;
use App\Models\Evaluation;
use App\Models\Frais;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\ParentModel;
use App\Models\Periode;
use App\Models\Prof;
use App\Models\School;
use App\Models\Section;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SchoolImportService
{
    private array $report = [];
    private ?AnneeScolaire $anneeScolaire = null;

    public function import(School $school, array $data): array
    {
        $this->report = [
            'annee_scolaire' => ['created' => 0, 'duplicated' => 0, 'deactivated_previous' => false],
            'sections' => ['created' => 0, 'duplicated' => 0],
            'classes' => ['created' => 0, 'duplicated' => 0],
            'matieres' => ['created' => 0, 'duplicated' => 0],
            'profs' => ['created' => 0, 'duplicated' => 0],
            'eleves' => ['created' => 0, 'updated' => 0, 'duplicated' => 0, 'promoted' => 0],
            'parents' => ['created' => 0, 'duplicated' => 0],
            'affectations' => ['created' => 0, 'duplicated' => 0],
            'periodes' => ['created' => 0, 'duplicated' => 0],
            'emploi_du_temps' => ['created' => 0, 'duplicated' => 0],
            'evaluations' => ['created' => 0, 'duplicated' => 0],
            'notes' => ['created' => 0, 'updated' => 0],
            'frais' => ['created' => 0, 'duplicated' => 0],
        ];

        try {
            DB::transaction(function () use ($school, $data) {
                $this->anneeScolaire = $this->importAnneeScolaire($school, $data['annee_scolaire'] ?? null);

                if (!empty($data['sections'])) {
                    $this->importSections($school, $data['sections']);
                }

                if (!empty($data['classes'])) {
                    $this->importClasses($school, $data['classes']);
                }

                if (!empty($data['matieres'])) {
                    $this->importMatieres($school, $data['matieres']);
                }

                if (!empty($data['profs'])) {
                    $this->importProfs($school, $data['profs']);
                }

                if (!empty($data['eleves'])) {
                    $this->importEleves($school, $data['eleves']);
                }

                if (!empty($data['affectations'])) {
                    $this->importAffectations($school, $data['affectations']);
                }

                if (!empty($data['periodes'])) {
                    $this->importPeriodes($school, $data['periodes']);
                }

                if (!empty($data['emploi_du_temps'])) {
                    $this->importEmploiDuTemps($school, $data['emploi_du_temps']);
                }

                if (!empty($data['evaluations'])) {
                    $this->importEvaluations($school, $data['evaluations']);
                }

                if (!empty($data['notes'])) {
                    $this->importNotes($school, $data['notes']);
                }

                if (!empty($data['frais'])) {
                    $this->importFrais($school, $data['frais']);
                }
            });
        } catch (\Exception $e) {
            Log::error('Import failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'report' => $this->report,
            ];
        }

        return [
            'success' => true,
            'report' => $this->report,
        ];
    }

    private function importAnneeScolaire(School $school, ?string $libelle): AnneeScolaire
    {
        $libelle = $libelle ?? date('Y') . '-' . (date('Y') + 1);

        // Deactivate all previous years for this school
        $previousActive = AnneeScolaire::where('school_id', $school->id)
            ->where('active', true)
            ->get();

        if ($previousActive->isNotEmpty()) {
            AnneeScolaire::where('school_id', $school->id)
                ->where('active', true)
                ->update(['active' => false]);
            $this->report['annee_scolaire']['deactivated_previous'] = true;
        }

        $existing = AnneeScolaire::where('school_id', $school->id)
            ->where('libelle', $libelle)
            ->first();

        if ($existing) {
            $this->report['annee_scolaire']['duplicated']++;
            $existing->update(['active' => true]);
            return $existing;
        }

        $this->report['annee_scolaire']['created']++;
        return AnneeScolaire::create([
            'school_id' => $school->id,
            'libelle' => $libelle,
            'active' => true,
        ]);
    }

    private function importSections(School $school, array $sections): void
    {
        foreach ($sections as $item) {
            $libelle = trim($item['libelle'] ?? '');
            if (empty($libelle)) continue;

            $existing = Section::where('school_id', $school->id)
                ->where('libelle', $libelle)
                ->first();

            if ($existing) {
                $this->report['sections']['duplicated']++;
                continue;
            }

            Section::create([
                'school_id' => $school->id,
                'libelle' => $libelle,
            ]);
            $this->report['sections']['created']++;
        }
    }

    private function importClasses(School $school, array $classes): void
    {
        foreach ($classes as $item) {
            $libelle = trim($item['libelle'] ?? '');
            if (empty($libelle)) continue;

            $sectionLibelle = trim($item['section'] ?? 'Secondaire');
            $section = Section::where('school_id', $school->id)
                ->where('libelle', $sectionLibelle)
                ->first();

            if (!$section) {
                $section = Section::create([
                    'school_id' => $school->id,
                    'libelle' => $sectionLibelle,
                ]);
                $this->report['sections']['created']++;
            }

            $existing = Classe::where('school_id', $school->id)
                ->where('section_id', $section->id)
                ->where('annee_scolaire_id', $this->anneeScolaire->id)
                ->where('libelle', $libelle)
                ->first();

            if ($existing) {
                $this->report['classes']['duplicated']++;
                if (isset($item['ecolage'])) {
                    $existing->update(['ecolage' => $item['ecolage']]);
                }
                continue;
            }

            Classe::create([
                'school_id' => $school->id,
                'section_id' => $section->id,
                'annee_scolaire_id' => $this->anneeScolaire->id,
                'libelle' => $libelle,
                'ecolage' => $item['ecolage'] ?? 0,
            ]);
            $this->report['classes']['created']++;
        }
    }

    private function importMatieres(School $school, array $matieres): void
    {
        foreach ($matieres as $item) {
            $libelle = trim($item['libelle'] ?? '');
            if (empty($libelle)) continue;

            $existing = Matiere::where('school_id', $school->id)
                ->where('libelle', $libelle)
                ->first();

            if ($existing) {
                $this->report['matieres']['duplicated']++;
                continue;
            }

            Matiere::create([
                'school_id' => $school->id,
                'libelle' => $libelle,
                'categorie' => $item['categorie'] ?? null,
            ]);
            $this->report['matieres']['created']++;
        }
    }

    private function importProfs(School $school, array $profs): void
    {
        foreach ($profs as $item) {
            $nom = trim($item['nom'] ?? '');
            $prenom = trim($item['prenom'] ?? '');

            if (empty($nom) && empty($prenom)) continue;

            $existing = Prof::where('school_id', $school->id)
                ->where('nom', $nom)
                ->where('prenom', $prenom)
                ->first();

            if ($existing) {
                $this->report['profs']['duplicated']++;
                continue;
            }

            Prof::forceCreate([
                'school_id' => $school->id,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => $item['email'] ?? null,
                'telephone' => $item['telephone'] ?? null,
                'code' => CodeGenerator::generate(),
            ]);
            $this->report['profs']['created']++;
        }
    }

    private function importEleves(School $school, array $eleves): void
    {
        $autoMatriculeCounter = Eleve::where('school_id', $school->id)->count();

        foreach ($eleves as $item) {
            $nom = trim($item['nom'] ?? '');
            $prenom = trim($item['prenom'] ?? '');
            $classeLibelle = trim($item['classe'] ?? '');
            $parentTelephone = trim($item['parent_telephone'] ?? '');

            if (empty($nom) || empty($prenom) || empty($classeLibelle)) continue;

            $classe = Classe::where('school_id', $school->id)
                ->where('annee_scolaire_id', $this->anneeScolaire->id)
                ->where('libelle', $classeLibelle)
                ->first();

            if (!$classe) {
                continue;
            }

            // Match by nom + prenom + parent telephone
            $existing = null;
            if (!empty($parentTelephone)) {
                $normalizedPhone = PhoneNormalizer::normalize($parentTelephone);
                $existing = Eleve::where('school_id', $school->id)
                    ->where('nom', $nom)
                    ->where('prenom', $prenom)
                    ->whereHas('parents', function ($q) use ($normalizedPhone) {
                        $q->whereRaw("REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(telephone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''), '.', '') = ?", [$normalizedPhone]);
                    })
                    ->first();
            }

            if ($existing) {
                // Check if student already has a class for this year
                $alreadyInYear = EleveClasse::where('eleve_id', $existing->id)
                    ->where('annee_scolaire_id', $this->anneeScolaire->id)
                    ->first();

                if ($alreadyInYear) {
                    $this->report['eleves']['duplicated']++;
                    continue;
                }

                // Promotion: update classe_id and create eleve_classe record
                $oldClasseId = $existing->classe_id;
                $existing->update(['classe_id' => $classe->id]);

                EleveClasse::create([
                    'eleve_id' => $existing->id,
                    'classe_id' => $classe->id,
                    'annee_scolaire_id' => $this->anneeScolaire->id,
                ]);

                $this->report['eleves']['promoted']++;
                $this->report['eleves']['updated']++;

                // Also update subscription if exists
                $this->updateSubscriptionClasse($existing, $classe);
                continue;
            }

            // No match by parent phone - try match by nom + prenom + school (fallback)
            $existingByName = Eleve::where('school_id', $school->id)
                ->where('nom', $nom)
                ->where('prenom', $prenom)
                ->first();

            if ($existingByName) {
                $alreadyInYear = EleveClasse::where('eleve_id', $existingByName->id)
                    ->where('annee_scolaire_id', $this->anneeScolaire->id)
                    ->first();

                if ($alreadyInYear) {
                    $this->report['eleves']['duplicated']++;
                    continue;
                }

                // Promotion
                $existingByName->update(['classe_id' => $classe->id]);

                EleveClasse::create([
                    'eleve_id' => $existingByName->id,
                    'classe_id' => $classe->id,
                    'annee_scolaire_id' => $this->anneeScolaire->id,
                ]);

                $this->report['eleves']['promoted']++;
                $this->report['eleves']['updated']++;
                $this->updateSubscriptionClasse($existingByName, $classe);

                // Link parent if provided and not already linked
                if (!empty($parentTelephone)) {
                    $this->linkParentToEleve($parentTelephone, trim($item['parent_nom'] ?? ''), $existingByName);
                }
                continue;
            }

            // New student
            $matricule = $item['matricule'] ?? null;
            if (empty($matricule)) {
                $autoMatriculeCounter++;
                $matricule = 'MAT-' . date('Y') . str_pad($autoMatriculeCounter, 4, '0', STR_PAD_LEFT);
            }

            $eleve = Eleve::forceCreate([
                'school_id' => $school->id,
                'nom' => $nom,
                'prenom' => $prenom,
                'classe_id' => $classe->id,
                'date_naissance' => $this->normalizeDate($item['date_naissance'] ?? null),
                'matricule' => $matricule,
                'code' => CodeGenerator::generate(),
                'sexe' => $item['sexe'] ?? null,
            ]);

            // Create eleve_classe record
            EleveClasse::create([
                'eleve_id' => $eleve->id,
                'classe_id' => $classe->id,
                'annee_scolaire_id' => $this->anneeScolaire->id,
            ]);

            $this->report['eleves']['created']++;

            $parentNom = trim($item['parent_nom'] ?? '');
            if (!empty($parentTelephone)) {
                $this->linkParentToEleve($parentTelephone, $parentNom, $eleve);
            }
        }
    }

    private function updateSubscriptionClasse(Eleve $eleve, Classe $classe): void
    {
        $subscription = \App\Models\Subscription::where('eleve_id', $eleve->id)
            ->where('annee_scolaire_id', $this->anneeScolaire->id)
            ->first();

        if ($subscription) {
            $subscription->update(['classe_id' => $classe->id]);
        }
    }

    private function linkParentToEleve(string $telephone, string $nom, Eleve $eleve): void
    {
        $parent = ParentModel::where('telephone', $telephone)->first();

        if ($parent) {
            $this->report['parents']['duplicated']++;
        } else {
            $parent = ParentModel::forceCreate([
                'telephone' => $telephone,
                'nom' => $nom,
                'code' => CodeGenerator::generate(),
            ]);
            $this->report['parents']['created']++;
        }

        $alreadyLinked = $parent->eleves()->where('eleve_id', $eleve->id)->exists();
        if (!$alreadyLinked) {
            $parent->eleves()->attach($eleve->id);
        }
    }

    private function importAffectations(School $school, array $affectations): void
    {
        foreach ($affectations as $item) {
            $prof = $this->findProfByName($school, $item['prof'] ?? null);
            $matiere = $this->findMatiereByName($school, $item['matiere'] ?? null);
            $classe = $this->findClasseByName($school, $item['classe'] ?? null);

            if (!$prof || !$matiere || !$classe) {
                continue;
            }

            $existing = Affectation::where('prof_id', $prof->id)
                ->where('matiere_id', $matiere->id)
                ->where('classe_id', $classe->id)
                ->where('annee_scolaire_id', $this->anneeScolaire->id)
                ->first();

            if ($existing) {
                $this->report['affectations']['duplicated']++;
                if (isset($item['coefficient'])) {
                    $existing->update(['coefficient' => $item['coefficient']]);
                }
                continue;
            }

            Affectation::create([
                'prof_id' => $prof->id,
                'matiere_id' => $matiere->id,
                'classe_id' => $classe->id,
                'annee_scolaire_id' => $this->anneeScolaire->id,
                'coefficient' => $item['coefficient'] ?? 1,
            ]);
            $this->report['affectations']['created']++;
        }
    }

    private function importPeriodes(School $school, array $periodes): void
    {
        foreach ($periodes as $item) {
            $libelle = trim($item['libelle'] ?? '');
            if (empty($libelle)) continue;

            $existing = Periode::where('school_id', $school->id)
                ->where('annee_scolaire_id', $this->anneeScolaire->id)
                ->where('libelle', $libelle)
                ->first();

            if ($existing) {
                $this->report['periodes']['duplicated']++;
                continue;
            }

            Periode::create([
                'school_id' => $school->id,
                'annee_scolaire_id' => $this->anneeScolaire->id,
                'libelle' => $libelle,
                'type' => $item['type'] ?? 'trimestre',
                'numero' => $item['numero'] ?? 1,
            ]);
            $this->report['periodes']['created']++;
        }
    }

    private function importEmploiDuTemps(School $school, array $edt): void
    {
        foreach ($edt as $item) {
            $classe = $this->findClasseByName($school, $item['classe'] ?? null);
            $matiere = $this->findMatiereByName($school, $item['matiere'] ?? null);
            $prof = $this->findProfByName($school, $item['prof'] ?? null);

            if (!$classe) {
                continue;
            }

            $jour = strtolower(trim($item['jour'] ?? ''));
            $heureDebut = $this->normalizeTime($item['heure_debut'] ?? '');
            $heureFin = $this->normalizeTime($item['heure_fin'] ?? '');

            $existing = EmploiDuTemps::where('school_id', $school->id)
                ->where('classe_id', $classe->id)
                ->where('annee_scolaire_id', $this->anneeScolaire->id)
                ->where('jour', $jour)
                ->where('heure_debut', $heureDebut)
                ->first();

            if ($existing) {
                $this->report['emploi_du_temps']['duplicated']++;
                continue;
            }

            EmploiDuTemps::create([
                'school_id' => $school->id,
                'classe_id' => $classe->id,
                'matiere_id' => $matiere?->id,
                'prof_id' => $prof?->id,
                'annee_scolaire_id' => $this->anneeScolaire->id,
                'jour' => $jour,
                'heure_debut' => $heureDebut,
                'heure_fin' => $heureFin,
                'type_cours' => $item['type_cours'] ?? 'cours',
            ]);
            $this->report['emploi_du_temps']['created']++;
        }
    }

    private function importEvaluations(School $school, array $evaluations): void
    {
        foreach ($evaluations as $item) {
            $classe = $this->findClasseByName($school, $item['classe'] ?? null);
            $matiere = $this->findMatiereByName($school, $item['matiere'] ?? null);
            $periode = $this->findPeriodeByName($school, $item['periode'] ?? null);

            if (!$classe || !$matiere || !$periode) {
                continue;
            }

            $titre = trim($item['titre'] ?? '');
            if (empty($titre)) continue;

            Evaluation::create([
                'school_id' => $school->id,
                'classe_id' => $classe->id,
                'matiere_id' => $matiere->id,
                'periode_id' => $periode->id,
                'annee_scolaire_id' => $this->anneeScolaire->id,
                'titre' => $titre,
                'type' => $item['type'] ?? 'devoir',
                'date' => $this->normalizeDate($item['date'] ?? null),
                'coefficient' => $item['coefficient'] ?? 1,
                'note_sur' => $item['note_sur'] ?? 20,
            ]);
            $this->report['evaluations']['created']++;
        }
    }

    private function importNotes(School $school, array $notes): void
    {
        foreach ($notes as $item) {
            $eleve = $this->findEleveByName($school, $item['eleve_nom'] ?? null, $item['eleve_prenom'] ?? null, $item['classe'] ?? null);

            if (!$eleve) {
                continue;
            }

            $evaluation = null;
            if (!empty($item['evaluation_titre'])) {
                $evaluation = Evaluation::where('school_id', $school->id)
                    ->where('annee_scolaire_id', $this->anneeScolaire->id)
                    ->where('titre', $item['evaluation_titre'])
                    ->first();
            }

            if (!$evaluation) {
                continue;
            }

            $existing = Note::where('evaluation_id', $evaluation->id)
                ->where('eleve_id', $eleve->id)
                ->first();

            if ($existing) {
                $existing->update([
                    'note' => $item['note'] ?? $existing->note,
                    'appreciation' => $item['appreciation'] ?? $existing->appreciation,
                ]);
                $this->report['notes']['updated']++;
                continue;
            }

            Note::create([
                'evaluation_id' => $evaluation->id,
                'eleve_id' => $eleve->id,
                'note' => $item['note'] ?? null,
                'appreciation' => $item['appreciation'] ?? null,
            ]);
            $this->report['notes']['created']++;
        }
    }

    private function importFrais(School $school, array $frais): void
    {
        foreach ($frais as $item) {
            $libelle = trim($item['libelle'] ?? '');
            if (empty($libelle)) continue;

            $existing = Frais::where('school_id', $school->id)
                ->where('libelle', $libelle)
                ->first();

            if ($existing) {
                $this->report['frais']['duplicated']++;
                if (!empty($item['classes'])) {
                    $classIds = Classe::where('school_id', $school->id)
                        ->whereIn('libelle', $item['classes'])
                        ->pluck('id')
                        ->toArray();
                    $existing->classes()->sync($classIds);
                }
                continue;
            }

            $fraisRecord = Frais::create([
                'school_id' => $school->id,
                'libelle' => $libelle,
                'description' => $item['description'] ?? null,
                'montant' => $item['montant'] ?? 0,
                'actif' => $item['actif'] ?? true,
            ]);

            if (!empty($item['classes'])) {
                $classIds = Classe::where('school_id', $school->id)
                    ->whereIn('libelle', $item['classes'])
                    ->pluck('id')
                    ->toArray();
                $fraisRecord->classes()->sync($classIds);
            }

            $this->report['frais']['created']++;
        }
    }

    private function findProfByName(School $school, ?string $fullName): ?Prof
    {
        if (empty($fullName)) return null;

        $parts = explode(' ', trim($fullName), 2);
        $prenom = $parts[0] ?? '';
        $nom = $parts[1] ?? '';

        if (!empty($nom)) {
            $prof = Prof::where('school_id', $school->id)
                ->where('prenom', $prenom)
                ->where('nom', $nom)
                ->first();
            if ($prof) return $prof;
        }

        return Prof::where('school_id', $school->id)
            ->where(function ($q) use ($prenom) {
                $q->where('prenom', $prenom)
                  ->orWhere('nom', $prenom);
            })
            ->first();
    }

    private function findMatiereByName(School $school, ?string $libelle): ?Matiere
    {
        if (empty($libelle)) return null;

        return Matiere::where('school_id', $school->id)
            ->where('libelle', trim($libelle))
            ->first();
    }

    private function findClasseByName(School $school, ?string $libelle): ?Classe
    {
        if (empty($libelle)) return null;

        return Classe::where('school_id', $school->id)
            ->where('annee_scolaire_id', $this->anneeScolaire->id)
            ->where('libelle', trim($libelle))
            ->first();
    }

    private function findPeriodeByName(School $school, ?string $libelle): ?Periode
    {
        if (empty($libelle)) return null;

        return Periode::where('school_id', $school->id)
            ->where('annee_scolaire_id', $this->anneeScolaire->id)
            ->where('libelle', trim($libelle))
            ->first();
    }

    private function findEleveByName(School $school, ?string $nom, ?string $prenom, ?string $classe): ?Eleve
    {
        if (empty($nom) || empty($prenom)) return null;

        $query = Eleve::where('school_id', $school->id)
            ->where('nom', trim($nom))
            ->where('prenom', trim($prenom));

        if (!empty($classe)) {
            $classeModel = $this->findClasseByName($school, $classe);
            if ($classeModel) {
                $query->where('classe_id', $classeModel->id);
            }
        }

        return $query->first();
    }

    private function normalizeTime(string $time): string
    {
        $time = trim($time);
        if (preg_match('/^(\d{1,2})h(\d{2})$/i', $time, $m)) {
            return sprintf('%02d:%02d:00', (int)$m[1], (int)$m[2]);
        }
        if (preg_match('/^(\d{1,2}):(\d{2})$/', $time, $m)) {
            return sprintf('%02d:%02d:00', (int)$m[1], (int)$m[2]);
        }
        if (preg_match('/^(\d{1,2}):(\d{2}):(\d{2})$/', $time, $m)) {
            return sprintf('%02d:%02d:%02d', (int)$m[1], (int)$m[2], (int)$m[3]);
        }
        return $time;
    }

    private function normalizeDate(?string $date): ?string
    {
        if (empty($date)) return null;
        $date = trim($date);
        if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $date, $m)) {
            return "{$m[3]}-{$m[2]}-{$m[1]}";
        }
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $date;
        }
        return null;
    }
}
