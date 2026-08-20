<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\User;
use App\Models\AnneeScolaire;
use App\Models\Periode;
use App\Models\Section;
use App\Models\Classe;
use App\Models\Matiere;
use App\Models\Prof;
use App\Models\Affectation;
use App\Models\Eleve;
use App\Models\ParentModel;
use App\Models\Subscription;
use App\Models\EleveClasse;
use App\Models\Frais;
use App\Models\Evaluation;
use App\Models\Note;
use App\Models\Presence;
use App\Models\Remarque;
use App\Models\Annonce;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSchoolSeeder extends Seeder
{
    public function run(): void
    {
        // Skip if already seeded
        if (School::where('code', 'CSM01')->exists()) {
            echo "⚠️  École « Collège Sainte Marie » déjà créée. Skip.\n";
            return;
        }

        // ─── 1. Admin ─────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@college-sainte-marie.com'],
            [
                'name' => 'Admin Collège Sainte Marie',
                'password' => Hash::make('classinote2026'),
                'role' => 'admin',
                'active' => true,
            ]
        );

        // ─── 2. École ────────────────────────────────────
        $school = School::firstOrCreate(
            ['code' => 'CSM01'],
            [
                'nom' => 'Collège Sainte Marie',
                'adresse' => 'Boulevard du 13 Janvier, Lomé',
                'telephone' => '+228 22 21 30 40',
                'email' => 'contact@college-sainte-marie.com',
                'ville' => 'Lomé',
                'pays' => 'Togo',
                'devise' => 'FCFA',
                'active' => true,
            ]
        );

        $admin->schools()->attach($school->id);

        // ─── 3. Année scolaire + périodes ─────────────────
        $annee = AnneeScolaire::create([
            'school_id' => $school->id,
            'libelle' => '2025-2026',
            'active' => true,
        ]);

        $periode1 = Periode::create(['school_id' => $school->id, 'annee_scolaire_id' => $annee->id, 'libelle' => '1er Trimestre', 'type' => 'trimestre', 'numero' => 1]);
        $periode2 = Periode::create(['school_id' => $school->id, 'annee_scolaire_id' => $annee->id, 'libelle' => '2ème Trimestre', 'type' => 'trimestre', 'numero' => 2]);
        $periode3 = Periode::create(['school_id' => $school->id, 'annee_scolaire_id' => $annee->id, 'libelle' => '3ème Trimestre', 'type' => 'trimestre', 'numero' => 3]);

        // ─── 4. Sections + Classes ────────────────────────
        $section = Section::create(['school_id' => $school->id, 'libelle' => 'Collège']);

        $classe6e = Classe::create(['school_id' => $school->id, 'section_id' => $section->id, 'annee_scolaire_id' => $annee->id, 'libelle' => '6ème A', 'ecolage' => 75000]);
        $classe5e = Classe::create(['school_id' => $school->id, 'section_id' => $section->id, 'annee_scolaire_id' => $annee->id, 'libelle' => '5ème B', 'ecolage' => 80000]);
        $classe4e = Classe::create(['school_id' => $school->id, 'section_id' => $section->id, 'annee_scolaire_id' => $annee->id, 'libelle' => '4ème A', 'ecolage' => 85000]);

        // ─── 5. Matières ──────────────────────────────────
        $maths    = Matiere::create(['school_id' => $school->id, 'libelle' => 'Mathématiques', 'categorie' => 'scientifique']);
        $francais = Matiere::create(['school_id' => $school->id, 'libelle' => 'Français', 'categorie' => 'littéraire']);
        $anglais  = Matiere::create(['school_id' => $school->id, 'libelle' => 'Anglais', 'categorie' => 'littéraire']);
        $sciences = Matiere::create(['school_id' => $school->id, 'libelle' => 'Sciences', 'categorie' => 'scientifique']);
        $histgeo  = Matiere::create(['school_id' => $school->id, 'libelle' => 'Histoire-Géographie', 'categorie' => 'littéraire']);
        $eps      = Matiere::create(['school_id' => $school->id, 'libelle' => 'EPS', 'categorie' => 'sport']);
        $informatique = Matiere::create(['school_id' => $school->id, 'libelle' => 'Informatique', 'categorie' => 'scientifique']);

        // ─── 6. Profs ─────────────────────────────────────
        $prof1 = Prof::create(['school_id' => $school->id, 'nom' => 'Agbeko', 'prenom' => 'Kofi', 'email' => 'k.agbeko@college-sainte-marie.com', 'telephone' => '+228 90 12 34 56', 'code' => 'PROF-MATH', 'active' => true]);
        $prof2 = Prof::create(['school_id' => $school->id, 'nom' => 'Adjovi', 'prenom' => 'Marie', 'email' => 'm.adjovi@college-sainte-marie.com', 'telephone' => '+228 91 23 45 67', 'code' => 'PROF-FRAN', 'active' => true]);
        $prof3 = Prof::create(['school_id' => $school->id, 'nom' => 'Toure', 'prenom' => 'Ibrahim', 'email' => 'i.toure@college-sainte-marie.com', 'telephone' => '+228 92 34 56 78', 'code' => 'PROF-ANGL', 'active' => true]);
        $prof4 = Prof::create(['school_id' => $school->id, 'nom' => 'Gbeko', 'prenom' => 'Afi', 'email' => 'a.gbeko@college-sainte-marie.com', 'telephone' => '+228 93 45 67 89', 'code' => 'PROF-SCI', 'active' => true]);
        $prof5 = Prof::create(['school_id' => $school->id, 'nom' => 'Diallo', 'prenom' => 'Amadou', 'email' => 'a.diallo@college-sainte-marie.com', 'telephone' => '+228 94 56 78 90', 'code' => 'PROF-HIST', 'active' => true]);
        $prof6 = Prof::create(['school_id' => $school->id, 'nom' => 'Koudjo', 'prenom' => 'Essi', 'email' => 'e.koudjo@college-sainte-marie.com', 'telephone' => '+228 95 67 89 01', 'code' => 'PROF-INF', 'active' => true]);

        // Attach profs to school
        foreach ([$prof1, $prof2, $prof3, $prof4, $prof5, $prof6] as $prof) {
            $prof->schools()->attach($school->id, ['code' => $prof->code, 'code_used' => false]);
        }

        // ─── 7. Affectations ──────────────────────────────
        // 6ème A
        Affectation::create(['prof_id' => $prof1->id, 'matiere_id' => $maths->id, 'classe_id' => $classe6e->id, 'annee_scolaire_id' => $annee->id, 'coefficient' => 3]);
        Affectation::create(['prof_id' => $prof2->id, 'matiere_id' => $francais->id, 'classe_id' => $classe6e->id, 'annee_scolaire_id' => $annee->id, 'coefficient' => 3]);
        Affectation::create(['prof_id' => $prof3->id, 'matiere_id' => $anglais->id, 'classe_id' => $classe6e->id, 'annee_scolaire_id' => $annee->id, 'coefficient' => 2]);
        Affectation::create(['prof_id' => $prof4->id, 'matiere_id' => $sciences->id, 'classe_id' => $classe6e->id, 'annee_scolaire_id' => $annee->id, 'coefficient' => 2]);
        Affectation::create(['prof_id' => $prof5->id, 'matiere_id' => $histgeo->id, 'classe_id' => $classe6e->id, 'annee_scolaire_id' => $annee->id, 'coefficient' => 2]);
        Affectation::create(['prof_id' => $prof6->id, 'matiere_id' => $informatique->id, 'classe_id' => $classe6e->id, 'annee_scolaire_id' => $annee->id, 'coefficient' => 1]);

        // 5ème B
        Affectation::create(['prof_id' => $prof1->id, 'matiere_id' => $maths->id, 'classe_id' => $classe5e->id, 'annee_scolaire_id' => $annee->id, 'coefficient' => 3]);
        Affectation::create(['prof_id' => $prof2->id, 'matiere_id' => $francais->id, 'classe_id' => $classe5e->id, 'annee_scolaire_id' => $annee->id, 'coefficient' => 3]);
        Affectation::create(['prof_id' => $prof3->id, 'matiere_id' => $anglais->id, 'classe_id' => $classe5e->id, 'annee_scolaire_id' => $annee->id, 'coefficient' => 2]);

        // 4ème A
        Affectation::create(['prof_id' => $prof1->id, 'matiere_id' => $maths->id, 'classe_id' => $classe4e->id, 'annee_scolaire_id' => $annee->id, 'coefficient' => 3]);
        Affectation::create(['prof_id' => $prof4->id, 'matiere_id' => $sciences->id, 'classe_id' => $classe4e->id, 'annee_scolaire_id' => $annee->id, 'coefficient' => 2]);

        // ─── 8. Parents ───────────────────────────────────
        $parent1 = ParentModel::firstOrCreate(
            ['telephone' => '22890680185'],
            ['code' => 'PAR-80185', 'whatsapp_activated' => true, 'pin_hash' => Hash::make('1234')]
        );
        $parent2 = ParentModel::firstOrCreate(
            ['telephone' => '22899215580'],
            ['code' => 'PAR-15580', 'whatsapp_activated' => true, 'pin_hash' => Hash::make('1234')]
        );

        // ─── 9. Élèves ────────────────────────────────────
        $eleve1 = Eleve::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'nom' => 'AGBEKO', 'prenom' => 'Kwame', 'date_naissance' => '2012-03-15', 'sexe' => 'M', 'matricule' => 'CSM-2025-001', 'code' => 'ELEVE-001', 'active' => true]);
        $eleve2 = Eleve::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'nom' => 'AGBEKO', 'prenom' => 'Ama', 'date_naissance' => '2013-07-22', 'sexe' => 'F', 'matricule' => 'CSM-2025-002', 'code' => 'ELEVE-002', 'active' => true]);
        $eleve3 = Eleve::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'nom' => 'MENSAH', 'prenom' => 'Kofi', 'date_naissance' => '2012-11-08', 'sexe' => 'M', 'matricule' => 'CSM-2025-003', 'code' => 'ELEVE-003', 'active' => true]);
        $eleve4 = Eleve::create(['school_id' => $school->id, 'classe_id' => $classe5e->id, 'nom' => 'DIALLO', 'prenom' => 'Fatou', 'date_naissance' => '2011-05-30', 'sexe' => 'F', 'matricule' => 'CSM-2025-004', 'code' => 'ELEVE-004', 'active' => true]);
        $eleve5 = Eleve::create(['school_id' => $school->id, 'classe_id' => $classe5e->id, 'nom' => 'KOUADIO', 'prenom' => 'Yao', 'date_naissance' => '2011-09-12', 'sexe' => 'M', 'matricule' => 'CSM-2025-005', 'code' => 'ELEVE-005', 'active' => true]);
        $eleve6 = Eleve::create(['school_id' => $school->id, 'classe_id' => $classe4e->id, 'nom' => 'BONI', 'prenom' => 'Celestin', 'date_naissance' => '2010-01-25', 'sexe' => 'M', 'matricule' => 'CSM-2025-006', 'code' => 'ELEVE-006', 'active' => true]);
        $eleve7 = Eleve::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'nom' => 'TOURE', 'prenom' => 'Aya', 'date_naissance' => '2012-06-18', 'sexe' => 'F', 'matricule' => 'CSM-2025-007', 'code' => 'ELEVE-007', 'active' => true]);

        // ─── 10. Liens Parent-Élève ───────────────────────
        // Parent 22890680185 → Kwame AGBEKO + Ama AGBEKO
        $parent1->eleves()->attach([$eleve1->id, $eleve2->id]);
        // Parent 22899215580 → Fatou DIALLO + Yao KOUADIO + Celestin BONI + Kofi MENSAH + Aya TOURE
        $parent2->eleves()->attach([$eleve3->id, $eleve4->id, $eleve5->id, $eleve6->id, $eleve7->id]);

        // ─── 11. Subscriptions + EleveClasse ──────────────
        $allEleves = [$eleve1, $eleve2, $eleve3, $eleve4, $eleve5, $eleve6, $eleve7];
        foreach ($allEleves as $e) {
            Subscription::create([
                'eleve_id' => $e->id,
                'annee_scolaire_id' => $annee->id,
                'classe_id' => $e->classe_id,
                'inscrit' => true,
                'frais_paye' => ($e->id <= 4),
                'abonnement_paye' => true,
                'montant_mensuel' => 75000,
            ]);
            EleveClasse::create([
                'eleve_id' => $e->id,
                'classe_id' => $e->classe_id,
                'annee_scolaire_id' => $annee->id,
            ]);
        }

        // ─── 12. Frais ────────────────────────────────────
        $fraisInscription = Frais::create(['school_id' => $school->id, 'libelle' => 'Frais d\'inscription', 'type' => 'inscription', 'description' => 'Frais d\'inscription annuelle', 'montant' => 25000, 'actif' => true]);
        $fraisMinerval = Frais::create(['school_id' => $school->id, 'libelle' => 'Minerval (Mensuel)', 'type' => 'minerval', 'description' => 'Frais de scolarité mensuel', 'montant' => 75000, 'actif' => true]);
        $fraisUniforme = Frais::create(['school_id' => $school->id, 'libelle' => 'Uniforme scolaire', 'type' => 'annexe', 'description' => 'Kit uniforme complet', 'montant' => 35000, 'actif' => true]);
        $fraisTransport = Frais::create(['school_id' => $school->id, 'libelle' => 'Transport scolaire', 'type' => 'annexe', 'description' => 'Transport mensuel', 'montant' => 20000, 'actif' => true]);

        foreach ([$classe6e, $classe5e, $classe4e] as $cl) {
            \Illuminate\Support\Facades\DB::table('frais_classes')->insert([
                ['frais_id' => $fraisInscription->id, 'classe_id' => $cl->id],
                ['frais_id' => $fraisMinerval->id, 'classe_id' => $cl->id],
                ['frais_id' => $fraisUniforme->id, 'classe_id' => $cl->id],
                ['frais_id' => $fraisTransport->id, 'classe_id' => $cl->id],
            ]);
        }

        // ─── 13. Évaluations + Notes ──────────────────────
        // 6ème A - Maths
        $eval1 = Evaluation::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'matiere_id' => $maths->id, 'periode_id' => $periode1->id, 'annee_scolaire_id' => $annee->id, 'titre' => 'Interro Maths T1', 'type' => 'interrogation', 'date' => '2025-10-15', 'coefficient' => 1, 'note_sur' => 20]);
        $eval2 = Evaluation::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'matiere_id' => $maths->id, 'periode_id' => $periode1->id, 'annee_scolaire_id' => $annee->id, 'titre' => 'Devoir Maths T1', 'type' => 'devoir', 'date' => '2025-11-20', 'coefficient' => 2, 'note_sur' => 20]);
        $eval3 = Evaluation::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'matiere_id' => $maths->id, 'periode_id' => $periode2->id, 'annee_scolaire_id' => $annee->id, 'titre' => 'Composition Maths T2', 'type' => 'composition', 'date' => '2026-02-10', 'coefficient' => 3, 'note_sur' => 20]);

        // 6ème A - Français
        $eval4 = Evaluation::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'matiere_id' => $francais->id, 'periode_id' => $periode1->id, 'annee_scolaire_id' => $annee->id, 'titre' => 'Interro Français T1', 'type' => 'interrogation', 'date' => '2025-10-18', 'coefficient' => 1, 'note_sur' => 20]);
        $eval5 = Evaluation::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'matiere_id' => $francais->id, 'periode_id' => $periode1->id, 'annee_scolaire_id' => $annee->id, 'titre' => 'Devoir Français T1', 'type' => 'devoir', 'date' => '2025-11-22', 'coefficient' => 2, 'note_sur' => 20]);
        $eval6 = Evaluation::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'matiere_id' => $francais->id, 'periode_id' => $periode2->id, 'annee_scolaire_id' => $annee->id, 'titre' => 'Composition Français T2', 'type' => 'composition', 'date' => '2026-02-12', 'coefficient' => 3, 'note_sur' => 20]);

        // 6ème A - Anglais
        $eval7 = Evaluation::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'matiere_id' => $anglais->id, 'periode_id' => $periode1->id, 'annee_scolaire_id' => $annee->id, 'titre' => 'Interro Anglais T1', 'type' => 'interrogation', 'date' => '2025-10-20', 'coefficient' => 1, 'note_sur' => 20]);
        $eval8 = Evaluation::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'matiere_id' => $anglais->id, 'periode_id' => $periode2->id, 'annee_scolaire_id' => $annee->id, 'titre' => 'Devoir Anglais T2', 'type' => 'devoir', 'date' => '2026-01-15', 'coefficient' => 2, 'note_sur' => 20]);

        // 6ème A - Sciences
        $eval9 = Evaluation::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'matiere_id' => $sciences->id, 'periode_id' => $periode1->id, 'annee_scolaire_id' => $annee->id, 'titre' => 'Interro Sciences T1', 'type' => 'interrogation', 'date' => '2025-10-22', 'coefficient' => 1, 'note_sur' => 20]);
        $eval10 = Evaluation::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'matiere_id' => $sciences->id, 'periode_id' => $periode1->id, 'annee_scolaire_id' => $annee->id, 'titre' => 'Devoir Sciences T1', 'type' => 'devoir', 'date' => '2025-11-25', 'coefficient' => 2, 'note_sur' => 20]);
        $eval11 = Evaluation::create(['school_id' => $school->id, 'classe_id' => $classe6e->id, 'matiere_id' => $sciences->id, 'periode_id' => $periode2->id, 'annee_scolaire_id' => $annee->id, 'titre' => 'Composition Sciences T2', 'type' => 'composition', 'date' => '2026-02-14', 'coefficient' => 3, 'note_sur' => 20]);

        // Notes 6ème A
        $notesData = [
            // Kwame AGBEKO (eleve1)
            [$eval1->id, $eleve1->id, 15, 'Très bien'],
            [$eval2->id, $eleve1->id, 13, 'Bien'],
            [$eval3->id, $eleve1->id, 16, 'Excellent'],
            [$eval4->id, $eleve1->id, 14, 'Très bien'],
            [$eval5->id, $eleve1->id, 12, 'Assez bien'],
            [$eval6->id, $eleve1->id, 15, 'Très bien'],
            [$eval7->id, $eleve1->id, 10, 'Passable'],
            [$eval8->id, $eleve1->id, 11, 'Passable'],
            [$eval9->id, $eleve1->id, 16, 'Excellent'],
            [$eval10->id, $eleve1->id, 14, 'Très bien'],
            [$eval11->id, $eleve1->id, 17, 'Excellent'],

            // Ama AGBEKO (eleve2)
            [$eval1->id, $eleve2->id, 12, 'Assez bien'],
            [$eval2->id, $eleve2->id, 14, 'Très bien'],
            [$eval3->id, $eleve2->id, 13, 'Bien'],
            [$eval4->id, $eleve2->id, 16, 'Excellent'],
            [$eval5->id, $eleve2->id, 15, 'Très bien'],
            [$eval6->id, $eleve2->id, 14, 'Très bien'],
            [$eval7->id, $eleve2->id, 13, 'Bien'],
            [$eval8->id, $eleve2->id, 12, 'Assez bien'],
            [$eval9->id, $eleve2->id, 11, 'Passable'],
            [$eval10->id, $eleve2->id, 13, 'Bien'],
            [$eval11->id, $eleve2->id, 14, 'Très bien'],

            // Kofi MENSAH (eleve3)
            [$eval1->id, $eleve3->id, 8, 'Insuffisant'],
            [$eval2->id, $eleve3->id, 10, 'Passable'],
            [$eval3->id, $eleve3->id, 11, 'Passable'],
            [$eval4->id, $eleve3->id, 9, 'Insuffisant'],
            [$eval5->id, $eleve3->id, 11, 'Passable'],
            [$eval6->id, $eleve3->id, 10, 'Passable'],
            [$eval7->id, $eleve3->id, 7, 'Insuffisant'],
            [$eval8->id, $eleve3->id, 9, 'Insuffisant'],
            [$eval9->id, $eleve3->id, 12, 'Assez bien'],
            [$eval10->id, $eleve3->id, 10, 'Passable'],
            [$eval11->id, $eleve3->id, 11, 'Passable'],

            // Aya TOURE (eleve7)
            [$eval1->id, $eleve7->id, 14, 'Très bien'],
            [$eval2->id, $eleve7->id, 15, 'Très bien'],
            [$eval3->id, $eleve7->id, 13, 'Bien'],
            [$eval4->id, $eleve7->id, 11, 'Passable'],
            [$eval5->id, $eleve7->id, 12, 'Assez bien'],
            [$eval6->id, $eleve7->id, 10, 'Passable'],
            [$eval7->id, $eleve7->id, 14, 'Très bien'],
            [$eval8->id, $eleve7->id, 13, 'Bien'],
            [$eval9->id, $eleve7->id, 15, 'Très bien'],
            [$eval10->id, $eleve7->id, 16, 'Excellent'],
            [$eval11->id, $eleve7->id, 14, 'Très bien'],
        ];

        foreach ($notesData as [$evalId, $eleveId, $note, $appreciation]) {
            Note::create(['evaluation_id' => $evalId, 'eleve_id' => $eleveId, 'note' => $note, 'appreciation' => $appreciation]);
        }

        // ─── 14. Présences / Absences ─────────────────────
        $dates = ['2025-10-13', '2025-10-14', '2025-10-15', '2025-10-16', '2025-10-17',
                  '2025-10-20', '2025-10-21', '2025-10-22', '2025-10-23', '2025-10-24'];
        $matieres6e = [$maths, $francais, $anglais, $sciences, $histgeo];

        foreach ($dates as $i => $date) {
            foreach ([$eleve1, $eleve2, $eleve3, $eleve7] as $e) {
                $absent = ($e->id === $eleve3->id && in_array($i, [2, 5, 7])) ||
                          ($e->id === $eleve1->id && $i === 8);
                $matiere = $matieres6e[$i % 5];
                $prof = match($matiere->id) {
                    $maths->id => $prof1,
                    $francais->id => $prof2,
                    $anglais->id => $prof3,
                    $sciences->id => $prof4,
                    default => $prof5,
                };
                Presence::create([
                    'school_id' => $school->id,
                    'classe_id' => $classe6e->id,
                    'eleve_id' => $e->id,
                    'prof_id' => $prof->id,
                    'matiere_id' => $matiere->id,
                    'annee_scolaire_id' => $annee->id,
                    'date' => $date,
                    'heure_debut' => '08:00',
                    'heure_fin' => '09:00',
                    'est_present' => !$absent,
                    'remarque' => $absent ? 'Absence non justifiée' : null,
                ]);
            }
        }

        // ─── 15. Remarques des profs ──────────────────────
        Remarque::create(['eleve_id' => $eleve1->id, 'prof_id' => $prof1->id, 'school_id' => $school->id, 'classe_id' => $classe6e->id, 'type' => 'academique', 'contenu' => 'Kwame montre d\'excellents résultats en mathématiques. Il est très assidu et participatif en classe.', 'visible_parent' => true]);
        Remarque::create(['eleve_id' => $eleve1->id, 'prof_id' => $prof2->id, 'school_id' => $school->id, 'classe_id' => $classe6e->id, 'type' => 'comportement', 'contenu' => 'Bon comportement général. Kwame est respectueux envers les professeurs et ses camarades.', 'visible_parent' => true]);
        Remarque::create(['eleve_id' => $eleve1->id, 'prof_id' => $prof4->id, 'school_id' => $school->id, 'classe_id' => $classe6e->id, 'type' => 'academique', 'contenu' => 'Excellent travail en sciences. Kwame a obtenu la meilleure note de la classe au dernier devoir.', 'visible_parent' => true]);
        Remarque::create(['eleve_id' => $eleve2->id, 'prof_id' => $prof2->id, 'school_id' => $school->id, 'classe_id' => $classe6e->id, 'type' => 'academique', 'contenu' => 'Ama a une excellente maîtrise du français. Ses rédactions sont soignées et créatives.', 'visible_parent' => true]);
        Remarque::create(['eleve_id' => $eleve2->id, 'prof_id' => $prof3->id, 'school_id' => $school->id, 'classe_id' => $classe6e->id, 'type' => 'general', 'contenu' => 'Ama doit fournir plus d\'efforts en anglais. Elle doit réviser son vocabulaire régulièrement.', 'visible_parent' => true]);
        Remarque::create(['eleve_id' => $eleve3->id, 'prof_id' => $prof1->id, 'school_id' => $school->id, 'classe_id' => $classe6e->id, 'type' => 'academique', 'contenu' => 'Kofi a du mal avec les notions abstraites en mathématiques. Un soutien serait bénéfique.', 'visible_parent' => true]);
        Remarque::create(['eleve_id' => $eleve3->id, 'prof_id' => $prof4->id, 'school_id' => $school->id, 'classe_id' => $classe6e->id, 'type' => 'comportement', 'contenu' => 'Kofi est souvent bavard en cours de sciences. Il doit se concentrer davantage.', 'visible_parent' => true]);
        Remarque::create(['eleve_id' => $eleve4->id, 'prof_id' => $prof1->id, 'school_id' => $school->id, 'classe_id' => $classe5e->id, 'type' => 'academique', 'contenu' => 'Fatou est une élève sérieuse et motivée. Ses résultats sont en constante progression.', 'visible_parent' => true]);
        Remarque::create(['eleve_id' => $eleve5->id, 'prof_id' => $prof2->id, 'school_id' => $school->id, 'classe_id' => $classe5e->id, 'type' => 'general', 'contenu' => 'Yao participe activement en classe. Il est toujours prêt à aider ses camarades.', 'visible_parent' => true]);
        Remarque::create(['eleve_id' => $eleve7->id, 'prof_id' => $prof4->id, 'school_id' => $school->id, 'classe_id' => $classe6e->id, 'type' => 'academique', 'contenu' => 'Aya a obtenu le meilleur bulletin de la classe. Félicitations pour sa régularité !', 'visible_parent' => true]);

        // ─── 16. Annonces ─────────────────────────────────
        Annonce::create(['school_id' => $school->id, 'user_id' => $admin->id, 'titre' => 'Réunion parents-professeurs', 'contenu' => 'Une réunion parents-professeurs est prévée le samedi 15 novembre 2025 à 9h00 dans la salle de conférence. Votre présence est vivement souhaitée.', 'type' => 'info', 'publie' => true]);
        Annonce::create(['school_id' => $school->id, 'user_id' => $admin->id, 'titre' => 'Concours de mathématiques', 'contenu' => 'Le concours inter-écoles de mathématiques aura lieu le 20 décembre 2025. Les élèves intéressés sont invités à s\'inscrire auprès de leurs professeurs.', 'type' => 'info', 'publie' => true]);
        Annonce::create(['school_id' => $school->id, 'user_id' => $admin->id, 'titre' => 'Paie des frais de scolarité', 'contenu' => 'Rappel : Les frais de scolarité du mois de janvier doivent être réglés avant le 10 janvier 2026. Merci de vous conformer au règlement.', 'type' => 'alerte', 'publie' => true]);
        Annonce::create(['school_id' => $school->id, 'user_id' => $admin->id, 'titre' => 'Sortie scolaire - Musée national', 'contenu' => 'Une sortie scolaire au Musée national est organisée le 30 janvier 2026 pour les élèves de 6ème et 5ème. Cotisation : 5000 FCFA par élève.', 'type' => 'info', 'publie' => true]);

        echo "✅ École « Collège Sainte Marie » créée avec succès !\n";
        echo "   Admin: admin@college-sainte-marie.com / classinote2026\n";
        echo "   7 élèves, 6 profs, 3 classes, 11 évaluations, 44 notes\n";
        echo "   30 présences/absences, 10 remarques, 4 annonces\n";
    }
}
