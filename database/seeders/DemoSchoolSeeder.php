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
use App\Models\Periode;
use App\Models\Affectation;
use App\Models\EleveClasse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSchoolSeeder extends Seeder
{
    public function run(): void
    {
        // === ÉCOLE 1 : Collège Sainte Marie ===
        $school1 = School::firstOrCreate(
            ['code' => 'CSM'],
            ['nom' => 'Collège Sainte Marie', 'adresse' => '123 Rue de Lomé', 'telephone' => '+228900000001', 'email' => 'contact@csm.tg', 'active' => true]
        );

        // === ÉCOLE 2 : Lycée Moderne ===
        $school2 = School::firstOrCreate(
            ['code' => 'LYMOD'],
            ['nom' => 'Lycée Moderne', 'adresse' => '456 Avenue du Togo', 'telephone' => '+228900000002', 'email' => 'contact@lymod.tg', 'active' => true]
        );

        // === ADMIN ===
        $admin1 = User::firstOrCreate(['email' => 'admin@csm.tg'], ['name' => 'Admin CSM', 'password' => Hash::make('admin123'), 'role' => 'admin']);
        $school1->admins()->syncWithoutDetaching([$admin1->id]);

        $admin2 = User::firstOrCreate(['email' => 'admin@lymod.tg'], ['name' => 'Admin Lycée', 'password' => Hash::make('admin123'), 'role' => 'admin']);
        $school2->admins()->syncWithoutDetaching([$admin2->id]);

        // === ANNÉES SCOLAIRES ===
        $annee1 = AnneeScolaire::firstOrCreate(['school_id' => $school1->id, 'libelle' => '2025-2026'], ['active' => true, 'date_debut' => '2025-09-01', 'date_fin' => '2026-06-30']);
        $annee2 = AnneeScolaire::firstOrCreate(['school_id' => $school2->id, 'libelle' => '2025-2026'], ['active' => true, 'date_debut' => '2025-09-01', 'date_fin' => '2026-06-30']);

        // === SECTIONS ===
        $sec1 = Section::firstOrCreate(['school_id' => $school1->id, 'nom' => 'Collège']);
        $sec2 = Section::firstOrCreate(['school_id' => $school2->id, 'nom' => 'Lycée']);

        // === CLASSES ÉCOLE 1 (3 classes) ===
        $c1_6A = Classe::firstOrCreate(['school_id' => $school1->id, 'section_id' => $sec1->id, 'libelle' => '6ème A', 'annee_scolaire_id' => $annee1->id]);
        $c1_5B = Classe::firstOrCreate(['school_id' => $school1->id, 'section_id' => $sec1->id, 'libelle' => '5ème B', 'annee_scolaire_id' => $annee1->id]);
        $c1_4A = Classe::firstOrCreate(['school_id' => $school1->id, 'section_id' => $sec1->id, 'libelle' => '4ème A', 'annee_scolaire_id' => $annee1->id]);

        // === CLASSES ÉCOLE 2 (3 classes) ===
        $c2_2nde = Classe::firstOrCreate(['school_id' => $school2->id, 'section_id' => $sec2->id, 'libelle' => '2nde A', 'annee_scolaire_id' => $annee2->id]);
        $c2_1ere = Classe::firstOrCreate(['school_id' => $school2->id, 'section_id' => $sec2->id, 'libelle' => '1ère C', 'annee_scolaire_id' => $annee2->id]);
        $c2_tale = Classe::firstOrCreate(['school_id' => $school2->id, 'section_id' => $sec2->id, 'libelle' => 'Terminale D', 'annee_scolaire_id' => $annee2->id]);

        // === MATIÈRES ===
        $matMath = Matiere::firstOrCreate(['school_id' => $school1->id, 'libelle' => 'Mathématiques']);
        $matFr = Matiere::firstOrCreate(['school_id' => $school1->id, 'libelle' => 'Français']);
        $matAngl = Matiere::firstOrCreate(['school_id' => $school1->id, 'libelle' => 'Anglais']);
        $matMath2 = Matiere::firstOrCreate(['school_id' => $school2->id, 'libelle' => 'Mathématiques']);
        $matPhys = Matiere::firstOrCreate(['school_id' => $school2->id, 'libelle' => 'Physique-Chimie']);
        $matSVT = Matiere::firstOrCreate(['school_id' => $school2->id, 'libelle' => 'SVT']);

        // === PROF KOFI (+22890680185) — dans les 2 écoles, 3 classes chacune ===
        $profKofi = Prof::firstOrCreate(['telephone' => '+22890680185'], [
            'school_id' => $school1->id, 'nom' => 'Agbeko', 'prenom' => 'Kofi', 'email' => 'kofi@ecole.tg', 'active' => true
        ]);
        $profKofi->schools()->syncWithoutDetaching([$school1->id, $school2->id]);

        // Affectations École 1
        Affectation::firstOrCreate(['prof_id' => $profKofi->id, 'classe_id' => $c1_6A->id, 'matiere_id' => $matMath->id, 'annee_scolaire_id' => $annee1->id, 'school_id' => $school1->id]);
        Affectation::firstOrCreate(['prof_id' => $profKofi->id, 'classe_id' => $c1_5B->id, 'matiere_id' => $matMath->id, 'annee_scolaire_id' => $annee1->id, 'school_id' => $school1->id]);
        Affectation::firstOrCreate(['prof_id' => $profKofi->id, 'classe_id' => $c1_4A->id, 'matiere_id' => $matMath->id, 'annee_scolaire_id' => $annee1->id, 'school_id' => $school1->id]);

        // Affectations École 2
        Affectation::firstOrCreate(['prof_id' => $profKofi->id, 'classe_id' => $c2_2nde->id, 'matiere_id' => $matMath2->id, 'annee_scolaire_id' => $annee2->id, 'school_id' => $school2->id]);
        Affectation::firstOrCreate(['prof_id' => $profKofi->id, 'classe_id' => $c2_1ere->id, 'matiere_id' => $matMath2->id, 'annee_scolaire_id' => $annee2->id, 'school_id' => $school2->id]);
        Affectation::firstOrCreate(['prof_id' => $profKofi->id, 'classe_id' => $c2_tale->id, 'matiere_id' => $matMath2->id, 'annee_scolaire_id' => $annee2->id, 'school_id' => $school2->id]);

        // === PARENT SOFIYA (+22899215580) — 2 enfants dans des écoles différentes ===
        $parentSofiya = ParentModel::firstOrCreate(['telephone' => '+22899215580'], [
            'code' => strtoupper(Str::random(4) . '-' . Str::random(4)), 'active' => true, 'whatsapp_activated' => true
        ]);

        // Enfant 1 : École 1
        $eleve1 = Eleve::firstOrCreate(['school_id' => $school1->id, 'nom' => 'Dupont', 'prenom' => 'Amina'], [
            'classe_id' => $c1_6A->id, 'date_naissance' => '2014-03-15', 'matricule' => 'ELV-' . strtoupper(Str::random(6)), 'sexe' => 'F', 'active' => true
        ]);
        $eleve1->parents()->syncWithoutDetaching([$parentSofiya->id]);
        EleveClasse::firstOrCreate(['eleve_id' => $eleve1->id, 'annee_scolaire_id' => $annee1->id], ['classe_id' => $c1_6A->id]);

        // Enfant 2 : École 2
        $eleve2 = Eleve::firstOrCreate(['school_id' => $school2->id, 'nom' => 'Dupont', 'prenom' => 'Kofi'], [
            'classe_id' => $c2_2nde->id, 'date_naissance' => '2010-07-22', 'matricule' => 'ELV-' . strtoupper(Str::random(6)), 'sexe' => 'M', 'active' => true
        ]);
        $eleve2->parents()->syncWithoutDetaching([$parentSofiya->id]);
        EleveClasse::firstOrCreate(['eleve_id' => $eleve2->id, 'annee_scolaire_id' => $annee2->id], ['classe_id' => $c2_2nde->id]);

        // === SUBSCRIPTIONS ===
        $sub1 = Subscription::firstOrCreate(['eleve_id' => $eleve1->id, 'annee_scolaire_id' => $annee1->id], ['classe_id' => $c1_6A->id, 'inscrit' => true, 'montant_mensuel' => 25000]);
        $sub2 = Subscription::firstOrCreate(['eleve_id' => $eleve2->id, 'annee_scolaire_id' => $annee2->id], ['classe_id' => $c2_2nde->id, 'inscrit' => true, 'montant_mensuel' => 30000]);

        // === NOTES pour Amina (École 1) ===
        $periode1 = $annee1->periodes()->first();
        $matieres1 = [$matMath, $matFr, $matAngl];
        $types = [
            ['type' => 'composition', 'titre' => 'Composition du 1er trimestre'],
            ['type' => 'interrogation', 'titre' => 'Interrogation'],
            ['type' => 'devoir_surveille', 'titre' => 'Devoir surveillé'],
        ];
        foreach ($matieres1 as $i => $mat) {
            $t = $types[$i % 3];
            $eval = Evaluation::firstOrCreate(['school_id' => $school1->id, 'classe_id' => $c1_6A->id, 'matiere_id' => $mat->id, 'titre' => $t['titre'] . ' en ' . $mat->libelle], [
                'periode_id' => $periode1?->id, 'annee_scolaire_id' => $annee1->id, 'type' => $t['type'], 'date' => now()->subDays(rand(5, 40))->toDateString(), 'coefficient' => rand(1, 3), 'note_sur' => 20
            ]);
            Note::firstOrCreate(['evaluation_id' => $eval->id, 'eleve_id' => $eleve1->id], ['note' => rand(80, 180) / 10, 'appreciation' => ['Très bien', 'Bien', 'Passable'][rand(0, 2)]]);
        }

        // Examens à venir Amina
        Evaluation::firstOrCreate(['school_id' => $school1->id, 'classe_id' => $c1_6A->id, 'matiere_id' => $matMath->id, 'titre' => 'Composition du 3ème trimestre en Maths'], [
            'periode_id' => $periode1?->id, 'annee_scolaire_id' => $annee1->id, 'type' => 'composition', 'date' => now()->addDays(10)->toDateString(), 'coefficient' => 2, 'note_sur' => 20
        ]);

        // === NOTES pour Kofi (École 2) ===
        $periode2 = $annee2->periodes()->first();
        $matieres2 = [$matMath2, $matPhys, $matSVT];
        foreach ($matieres2 as $i => $mat) {
            $t = $types[$i % 3];
            $eval = Evaluation::firstOrCreate(['school_id' => $school2->id, 'classe_id' => $c2_2nde->id, 'matiere_id' => $mat->id, 'titre' => $t['titre'] . ' en ' . $mat->libelle], [
                'periode_id' => $periode2?->id, 'annee_scolaire_id' => $annee2->id, 'type' => $t['type'], 'date' => now()->subDays(rand(5, 40))->toDateString(), 'coefficient' => rand(1, 3), 'note_sur' => 20
            ]);
            Note::firstOrCreate(['evaluation_id' => $eval->id, 'eleve_id' => $eleve2->id], ['note' => rand(80, 180) / 10, 'appreciation' => ['Très bien', 'Bien', 'Passable'][rand(0, 2)]]);
        }

        // Examens à venir Kofi
        Evaluation::firstOrCreate(['school_id' => $school2->id, 'classe_id' => $c2_2nde->id, 'matiere_id' => $matMath2->id, 'titre' => 'Interrogation en Maths'], [
            'periode_id' => $periode2?->id, 'annee_scolaire_id' => $annee2->id, 'type' => 'interrogation', 'date' => now()->addDays(5)->toDateString(), 'coefficient' => 1, 'note_sur' => 20
        ]);

        // === ABSENCES ===
        foreach ([$eleve1, $eleve2] as $eleve) {
            $schoolId = $eleve->school_id;
            $classeId = $eleve->classe_id;
            $anneeId = $schoolId === $school1->id ? $annee1->id : $annee2->id;
            for ($i = 0; $i < 3; $i++) {
                Presence::create(['school_id' => $schoolId, 'classe_id' => $classeId, 'eleve_id' => $eleve->id, 'annee_scolaire_id' => $anneeId, 'date' => now()->subDays(rand(1, 30))->toDateString(), 'est_present' => false, 'remarque' => ['Absence non justifiée', 'Absence justifiée', 'Retard'][rand(0, 2)]]);
            }
        }

        // === REMARQUES ===
        Remarque::create(['eleve_id' => $eleve1->id, 'prof_id' => $profKofi->id, 'school_id' => $school1->id, 'classe_id' => $c1_6A->id, 'type' => 'comportement', 'contenu' => 'Amina est une élève sérieuse et attentive.', 'visible_parent' => true]);
        Remarque::create(['eleve_id' => $eleve2->id, 'prof_id' => $profKofi->id, 'school_id' => $school2->id, 'classe_id' => $c2_2nde->id, 'type' => 'academique', 'contenu' => 'Kofi doit fournir plus d\'efforts en maths.', 'visible_parent' => true]);

        // === FRAIS + PAIEMENTS ===
        foreach ([[$eleve1, $sub1, $c1_6A, $school1, $annee1], [$eleve2, $sub2, $c2_2nde, $school2, $annee2]] as [$eleve, $sub, $classe, $school, $annee]) {
            $fraisItems = [
                ['libelle' => 'Scolarité', 'type' => 'scolarite', 'montant' => 75000],
                ['libelle' => 'Frais d\'inscription', 'type' => 'inscription', 'montant' => 15000],
                ['libelle' => 'Assurance scolaire', 'type' => 'assurance', 'montant' => 5000],
                ['libelle' => 'Uniforme scolaire', 'type' => 'tenue', 'montant' => 12000],
            ];
            $createdFrais = [];
            foreach ($fraisItems as $fd) {
                $f = Frais::firstOrCreate(['school_id' => $school->id, 'libelle' => $fd['libelle']], ['type' => $fd['type'], 'montant' => $fd['montant'], 'actif' => true]);
                $f->classes()->syncWithoutDetaching([$classe->id]);
                $createdFrais[] = $f;
            }
            foreach ([['frais_index' => 0, 'montant' => 50000], ['frais_index' => 0, 'montant' => 25000], ['frais_index' => 1, 'montant' => 15000]] as $p) {
                $f = $createdFrais[$p['frais_index']] ?? null;
                if ($f) SubscriptionPayment::firstOrCreate(['subscription_id' => $sub->id, 'frais_id' => $f->id, 'montant' => $p['montant']], ['type' => 'frais', 'methode_paiement' => 'especes']);
            }
        }

        // === ANNONCES ===
        Annonce::firstOrCreate(['school_id' => $school1->id, 'titre' => 'Réunion parents-professeurs'], ['user_id' => $admin1->id, 'contenu' => 'Réunion le 25 août à 15h.', 'type' => 'info', 'publie' => true]);
        Annonce::firstOrCreate(['school_id' => $school2->id, 'titre' => 'Sortie scolaire'], ['user_id' => $admin2->id, 'contenu' => 'Sortie au musée le 30 janvier.', 'type' => 'evenement', 'publie' => true]);

        // === PÉRIODES ===
        foreach ([[$school1, $annee1], [$school2, $annee2]] as [$s, $a]) {
            Periode::firstOrCreate(['school_id' => $s->id, 'annee_scolaire_id' => $a->id, 'libelle' => '1er Trimestre'], ['date_debut' => '2025-09-01', 'date_fin' => '2025-12-31']);
            Periode::firstOrCreate(['school_id' => $s->id, 'annee_scolaire_id' => $a->id, 'libelle' => '2ème Trimestre'], ['date_debut' => '2026-01-01', 'date_fin' => '2026-03-31']);
            Periode::firstOrCreate(['school_id' => $s->id, 'annee_scolaire_id' => $a->id, 'libelle' => '3ème Trimestre'], ['date_debut' => '2026-04-01', 'date_fin' => '2026-06-30']);
        }

        $this->command->info('✅ Données créées !');
        $this->command->info('');
        $this->command->info('📱 Numéros de test :');
        $this->command->info('  Parent (2 enfants, 2 écoles) : +22899215580');
        $this->command->info('  Prof Kofi (2 écoles, 6 classes) : +22890680185');
        $this->command->info('  Superadmin : +22870077539');
        $this->command->info('');
        $this->command->info('🏫 Écoles :');
        $this->command->info('  Collège Sainte Marie : 6ème A, 5ème B, 4ème A');
        $this->command->info('  Lycée Moderne : 2nde A, 1ère C, Terminale D');
    }
}
