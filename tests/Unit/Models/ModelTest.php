<?php

namespace Tests\Unit\Models;

use App\Models\School;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Prof;
use App\Models\Note;
use App\Models\Evaluation;
use App\Models\Subscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_factory_creates_valid_model(): void
    {
        $school = School::factory()->create();

        $this->assertNotNull($school->id);
        $this->assertNotNull($school->nom);
        $this->assertTrue($school->active);
    }

    public function test_eleve_factory_creates_valid_model(): void
    {
        $eleve = Eleve::factory()->create();

        $this->assertNotNull($eleve->id);
        $this->assertNotNull($eleve->nom);
        $this->assertNotNull($eleve->prenom);
        $this->assertTrue($eleve->active);
    }

    public function test_eleve_nom_complet_attribute(): void
    {
        $eleve = Eleve::factory()->create(['prenom' => 'Jean', 'nom' => 'Dupont']);

        $this->assertEquals('Jean Dupont', $eleve->nom_complet);
    }

    public function test_prof_factory_creates_valid_model(): void
    {
        $prof = Prof::factory()->create();

        $this->assertNotNull($prof->id);
        $this->assertNotNull($prof->nom);
        $this->assertTrue($prof->active);
    }

    public function test_prof_has_pin_method(): void
    {
        $prof = Prof::factory()->create();
        $this->assertFalse($prof->hasPin());

        $profWithPin = Prof::factory()->withPin('1234')->create();
        $this->assertTrue($profWithPin->hasPin());
    }

    public function test_prof_verify_pin(): void
    {
        $prof = Prof::factory()->withPin('1234')->create();

        $this->assertTrue($prof->verifyPin('1234'));
        $this->assertFalse($prof->verifyPin('0000'));
    }

    public function test_prof_nom_complet_attribute(): void
    {
        $prof = Prof::factory()->create(['prenom' => 'Marie', 'nom' => 'Curie']);

        $this->assertEquals('Marie Curie', $prof->nom_complet);
    }

    public function test_subscription_factory_creates_valid_model(): void
    {
        $subscription = Subscription::factory()->create();

        $this->assertNotNull($subscription->id);
        $this->assertTrue($subscription->inscrit);
    }

    public function test_note_factory_creates_valid_model(): void
    {
        $note = Note::factory()->create(['note' => 15.5]);

        $this->assertNotNull($note->id);
        $this->assertEquals(15.5, $note->note);
    }

    public function test_classe_factory_creates_valid_model(): void
    {
        $classe = Classe::factory()->create();

        $this->assertNotNull($classe->id);
        $this->assertNotNull($classe->libelle);
    }
}
