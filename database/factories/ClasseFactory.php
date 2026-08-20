<?php

namespace Database\Factories;

use App\Models\Classe;
use App\Models\School;
use App\Models\Section;
use App\Models\AnneeScolaire;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClasseFactory extends Factory
{
    protected $model = Classe::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'section_id' => Section::factory(),
            'annee_scolaire_id' => AnneeScolaire::factory(),
            'libelle' => fake()->randomElement(['6ème A', '5ème B', '4ème C', '3ème A', '2nde D', '1ère S', 'Terminale C']),
        ];
    }
}
