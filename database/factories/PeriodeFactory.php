<?php

namespace Database\Factories;

use App\Models\Periode;
use App\Models\School;
use App\Models\AnneeScolaire;
use Illuminate\Database\Eloquent\Factories\Factory;

class PeriodeFactory extends Factory
{
    protected $model = Periode::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'annee_scolaire_id' => AnneeScolaire::factory(),
            'libelle' => fake()->randomElement(['Trimestre 1', 'Trimestre 2', 'Trimestre 3']),
            'type' => fake()->randomElement(['trimestre', 'semestre']),
            'numero' => fake()->numberBetween(1, 3),
        ];
    }
}
