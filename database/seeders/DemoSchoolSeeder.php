<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;
use App\Models\User;
use App\Models\AnneeScolaire;
use App\Models\Section;
use App\Models\Classe;
use App\Models\Matiere;
use App\Models\Prof;
use App\Models\Eleve;
use App\Models\ParentModel;
use App\Models\Evaluation;
use App\Models\Note;
use App\Models\Presence;
use App\Models\Annonce;
use App\Models\Remarque;
use App\Models\Frais;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\EmploiDuTemps;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSchoolSeeder extends Seeder
{
    public function run(): void
    {
        // === ÉCOLE ===
        $school = School::firstOrCreate(
            ['code' => 'ECOLED'],
            [
                'nom' => 'École Démonstration',
                'adresse' => '123 Rue de la Paix, Lomé',
                'telephone' => '+228900000000',
                'email' => 'contact@ecole-demo.tg',
                'active' => true,
            ]
        );

        // === ADMIN ===
        $admin = User::firstOrCreate(
            ['email' => 'admin@ecole-demo.tg'],
            [
                'name' => 'Admin École',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'school_id' => $school->id,
            ]
        );
        $school->admins()->syncWithoutDetaching([$admin->id]);

        // === ANNÉE SCOLAIRE ===
        $annee = AnneeScolaire::firstOrCreate(
            ['school_id' => $school->id, 'libelle' => '2025-2026'],
            ['active' => true, 'date_debut' => '2025-09-01', 'date_fin' => '2026-06-30']
        );

        // === SECTIONS ===
        $sectionPrimaire = Section::firstOrCreate(
            ['school_id' => $school->id, 'nom' => 'Primaire']
        );
        $sectionCollege = Section::firstOrCreate(
            ['school_id' => $school->id, 'nom' => 'Collège']
        );

        // === CLASSES ===
        $classe6A = Classe::firstOrCreate(
            ['school_id' => $school->id, 'section_id' => $sectionCollege->id, 'libelle' => '6ème A', 'annee_scolaire_id' => $annee->id]
        );
        $classe5B = Classe::firstOrCreate(
            ['school_id' => $school->id, 'section_id' => $sectionCollege->id, 'libelle' => '5ème B', 'annee_scolaire_id' => $annee->id]
        );
        $classe4A = Classe::firstOrCreate(
            ['school_id' => $school->id, 'section_id' => $sectionCollege->id, 'libelle' => '4ème A', 'annee_scolaire_id' => $annee->id]
        );

        // === MATIÈRES ===
        $matiereMath = Matiere::firstOrCreate(['school_id' => $school->id, 'libelle' => 'Mathématiques']);
        $matiereFr = Matiere::firstOrCreate(['school_id' => $school->id, 'libelle' => 'Français']);
        $matiereAngl = Matiere::firstOrCreate(['school_id' => $school->id, 'libelle' => 'Anglais']);
        $matiereSVT = Matiere::firstOrCreate(['school_id' => $school->id, 'libelle' => 'SVT']);
        $matiereHG = Matiere::firstOrCreate(['school_id' => $school->id, 'libelle' => 'Histoire-Géo']);

        // === PROFS ===
        $profKofi = Prof::firstOrCreate(
            ['telephone' => '+22890680185'],
            ['school_id' => $school->id, 'nom' => 'Agbeko', 'prenom' => 'Kofi', 'email' => 'kofi@ecole-demo.tg', 'active' => true]
        );
        $profKofi->schools()->syncWithoutDetaching([$school->id]);

        $profAdjoa = Prof::firstOrCreate(
            ['telephone' => '+22890123456'],
            ['school_id' => $school->id, 'nom' => 'Amoussou', 'prenom' => 'Adjoa', 'email' => 'adjoa@ecole-demo.tg', 'active' => true]
        );
        $profAdjoa->schools()->syncWithoutDetaching([$school->id]);

        $profKossi = Prof::firstOrCreate(
            ['telephone' => '+22890987654'],
            ['school_id' => $school->id, 'nom' => 'Dogbo', 'prenom' => 'Kossi', 'email' => 'kossi@ecole-demo.tg', 'active' => true]
        );
        $profKossi->schools()->syncWithoutDetaching([$school->id]);

        // === AFFECTATIONS ===
        \App\Models\Affectation::firstOrCreate(['prof_id' => $profKofi->id, 'classe_id' => $classe6A->id, 'matiere_id' => $matiereMath->id, 'annee_scolaire_id' => $annee->id, 'school_id' => $school->id]);
        \App\Models\Affectation::firstOrCreate(['prof_id' => $profKofi->id, 'classe_id' => $classe5B->id, 'matiere_id' => $matiereMath->id, 'annee_scolaire_id' => $annee->id, 'school_id' => $school->id]);
        \App\Models\Affectation::firstOrCreate(['prof_id' => $profKofi->id, 'classe_id' => $classe4A->id, 'matiere_id' => $matiereMath->id, 'annee_scolaire_id' => $annee->id, 'school_id' => $school->id]);
        \App\Models\Affectation::firstOrCreate(['prof_id' => $profAdjoa->id, 'classe_id' => $classe6A->id, 'matiere_id' => $matiereFr->id, 'annee_scolaire_id' => $annee->id, 'school_id' => $school->id]);
        \App\Models\Affectation::firstOrCreate(['prof_id' => $profKossi->id, 'classe_id' => $classe6A->id, 'matiere_id' => $matiereAngl->id, 'annee_scolaire_id' => $annee->id, 'school_id' => $school->id]);

        // === PARENTS + ÉLÈVES ===
        $enfants = [
            ['parent_phone' => '+228911111111', 'parent_nom' => 'Dupont', 'nom' => 'Dupont', 'prenom' => 'Amina', 'sexe' => 'F', 'age' => 12, 'classe' => $classe6A],
            ['parent_phone' => '+228911111111', 'parent_nom' => 'Dupont', 'nom' => 'Dupont', 'prenom' => 'Kofi', 'sexe' => 'M', 'age' => 10, 'classe' => $classe5B],
            ['parent_phone' => '+228922222222', 'parent_nom' => 'Mensah', 'nom' => 'Mensah', 'prenom' => 'Fatou', 'sexe' => 'F', 'age' => 11, 'classe' => $classe6A],
            ['parent_phone' => '+228933333333', 'parent_nom' => 'Koffi', 'nom' => 'Koffi', 'prenom' => 'Yao', 'sexe' => 'M', 'age' => 13, 'classe' => $classe4A],
        ];

        $createdParents = [];
        foreach ($enfants as $e) {
            $parent = ParentModel::firstOrCreate(
                ['telephone' => $e['parent_phone']],
                ['code' => strtoupper(Str::random(4) . '-' . Str::random(4)), 'active' => true, 'whatsapp_activated' => true]
            );
            $createdParents[$e['parent_phone']] = $parent;

            $eleve = Eleve::firstOrCreate(
                ['school_id' => $school->id, 'nom' => $e['nom'], 'prenom' => $e['prenom']],
                [
                    'classe_id' => $e['classe']->id,
                    'date_naissance' => now()->subYears($e['age'])->toDateString(),
                    'matricule' => 'ELV-' . strtoupper(Str::random(6)),
                    'sexe' => $e['sexe'],
                    'active' => true,
                ]
            );
            $eleve->parents()->syncWithoutDetaching([$parent->id]);

            \App\Models\EleveClasse::firstOrCreate(
                ['eleve_id' => $eleve->id, 'annee_scolaire_id' => $annee->id],
                ['classe_id' => $e['classe']->id]
            );

            $sub = Subscription::firstOrCreate(
                ['eleve_id' => $eleve->id, 'annee_scolaire_id' => $annee->id],
                ['classe_id' => $e['classe']->id, 'inscrit' => true, 'montant_mensuel' => 25000]
            );

            // Notes
            $matieres = [$matiereMath, $matiereFr, $matiereAngl];
            $types = [
                ['type' => 'composition', 'titre' => 'Composition du 1er trimestre'],
                ['type' => 'interrogation', 'titre' => 'Interrogation'],
                ['type' => 'devoir_surveille', 'titre' => 'Devoir surveillé'],
            ];
            $periode = $annee->periodes()->first();

            foreach ($matieres as $i => $mat) {
                $typeInfo = $types[$i % count($types)];
                $eval = Evaluation::firstOrCreate(
                    ['school_id' => $school->id, 'classe_id' => $e['classe']->id, 'matiere_id' => $mat->id, 'titre' => $typeInfo['titre'] . ' en ' . $mat->libelle],
                    [
                        'periode_id' => $periode?->id,
                        'annee_scolaire_id' => $annee->id,
                        'type' => $typeInfo['type'],
                        'date' => now()->subDays(rand(5, 40))->toDateString(),
                        'coefficient' => rand(1, 3),
                        'note_sur' => 20,
                    ]
                );
                Note::firstOrCreate(
                    ['evaluation_id' => $eval->id, 'eleve_id' => $eleve->id],
                    ['note' => rand(80, 180) / 10, 'appreciation' => ['Très bien', 'Bien', 'Passable', 'Assez bien', 'Excellent'][rand(0, 4)]]
                );
            }

            // Examens à venir
            if ($matieres->count() >= 2) {
                Evaluation::firstOrCreate(
                    ['school_id' => $school->id, 'classe_id' => $e['classe']->id, 'matiere_id' => $matieres[0]->id, 'titre' => 'Composition du 3ème trimestre en ' . $matieres[0]->libelle],
                    [
                        'periode_id' => $periode?->id,
                        'annee_scolaire_id' => $annee->id,
                        'type' => 'composition',
                        'date' => now()->addDays(10)->toDateString(),
                        'coefficient' => 2,
                        'note_sur' => 20,
                    ]
                );
                Evaluation::firstOrCreate(
                    ['school_id' => $school->id, 'classe_id' => $e['classe']->id, 'matiere_id' => $matieres[1]->id, 'titre' => 'Interrogation en ' . $matieres[1]->libelle],
                    [
                        'periode_id' => $periode?->id,
                        'annee_scolaire_id' => $annee->id,
                        'type' => 'interrogation',
                        'date' => now()->addDays(5)->toDateString(),
                        'coefficient' => 1,
                        'note_sur' => 20,
                    ]
                );
            }

            // Absences
            for ($i = 0; $i < 3; $i++) {
                Presence::create([
                    'school_id' => $school->id,
                    'classe_id' => $e['classe']->id,
                    'eleve_id' => $eleve->id,
                    'annee_scolaire_id' => $annee->id,
                    'date' => now()->subDays(rand(1, 30))->toDateString(),
                    'est_present' => false,
                    'remarque' => ['Absence non justifiée', 'Absence justifiée (certificat médical)', 'Retard (30 min)'][rand(0, 2)],
                ]);
            }

            // Remarques
            foreach ([$profKofi, $profAdjoa] as $prof) {
                Remarque::firstOrCreate(
                    ['eleve_id' => $eleve->id, 'prof_id' => $prof->id, 'type' => 'comportement'],
                    [
                        'school_id' => $school->id,
                        'classe_id' => $e['classe']->id,
                        'contenu' => "{$e['prenom']} est un élève sérieux et attentif en classe.",
                        'visible_parent' => true,
                    ]
                );
            }

            // Frais
            $fraisItems = [
                ['libelle' => 'Scolarité', 'type' => 'scolarite', 'montant' => 75000],
                ['libelle' => 'Frais d\'inscription', 'type' => 'inscription', 'montant' => 15000],
                ['libelle' => 'Assurance scolaire', 'type' => 'assurance', 'montant' => 5000],
                ['libelle' => 'Uniforme scolaire', 'type' => 'tenue', 'montant' => 12000],
            ];

            $createdFrais = [];
            foreach ($fraisItems as $fd) {
                $frais = Frais::firstOrCreate(
                    ['school_id' => $school->id, 'libelle' => $fd['libelle']],
                    ['type' => $fd['type'], 'montant' => $fd['montant'], 'actif' => true]
                );
                $frais->classes()->syncWithoutDetaching([$e['classe']->id]);
                $createdFrais[] = $frais;
            }

            // Paiements
            $paiements = [
                ['frais_index' => 0, 'montant' => 50000],
                ['frais_index' => 0, 'montant' => 25000],
                ['frais_index' => 1, 'montant' => 15000],
                ['frais_index' => 3, 'montant' => 12000],
            ];
            foreach ($paiements as $p) {
                $f = $createdFrais[$p['frais_index']] ?? null;
                if ($f) {
                    SubscriptionPayment::firstOrCreate(
                        ['subscription_id' => $sub->id, 'frais_id' => $f->id, 'montant' => $p['montant']],
                        ['type' => 'frais', 'methode_paiement' => 'especes']
                    );
                }
            }
        }

        // === ANNONCES ===
        Annonce::firstOrCreate(
            ['school_id' => $school->id, 'titre' => 'Réunion parents-professeurs'],
            ['user_id' => $admin->id, 'contenu' => 'Une réunion est prévue le 25 août à 15h.', 'type' => 'info', 'publie' => true]
        );
        Annonce::firstOrCreate(
            ['school_id' => $school->id, 'titre' => 'Fête de fin d\'année'],
            ['user_id' => $admin->id, 'contenu' => 'La cérémonie aura lieu le 30 juin à 9h.', 'type' => 'evenement', 'publie' => true]
        );

        // === PÉRIODES ===
        \App\Models\Periode::firstOrCreate(
            ['school_id' => $school->id, 'annee_scolaire_id' => $annee->id, 'libelle' => '1er Trimestre'],
            ['date_debut' => '2025-09-01', 'date_fin' => '2025-12-31']
        );
        \App\Models\Periode::firstOrCreate(
            ['school_id' => $school->id, 'annee_scolaire_id' => $annee->id, 'libelle' => '2ème Trimestre'],
            ['date_debut' => '2026-01-01', 'date_fin' => '2026-03-31']
        );
        \App\Models\Periode::firstOrCreate(
            ['school_id' => $school->id, 'annee_scolaire_id' => $annee->id, 'libelle' => '3ème Trimestre'],
            ['date_debut' => '2026-04-01', 'date_fin' => '2026-06-30']
        );

        $this->command->info('✅ Données démo créées !');
        $this->command->info('📱 Numéros de test :');
        $this->command->info('   Parent (2 enfants) : +228911111111');
        $this->command->info('   Parent (1 enfant)  : +228922222222');
        $this->command->info('   Parent (1 enfant)  : +228933333333');
        $this->command->info('   Prof Kofi          : +22890680185');
        $this->command->info('   Prof Adjoa         : +22890123456');
        $this->command->info('   Prof Kossi         : +22890987654');
        $this->command->info('   Admin              : admin@ecole-demo.tg / admin123');
    }
}
