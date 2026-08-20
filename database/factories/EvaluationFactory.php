<?php

namespace Database\Factories;

use App\Models\Evaluation;
use App\Models\School;
use App\Models\Classe;
use App\Models\Matiere;
use App\Models\Periode;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvaluationFactory extends Factory
{
    protected $model = Evaluation::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'classe_id' => Classe::factory(),
            'matiere_id' => Matiere::factory(),
            'periode_id' => Periode::factory(),
            'titre' => fake()->sentence(3),
            'type' => fake()->randomElement(['interrogation', 'devoir', 'devoir_surveille', 'composition', 'examen']),
            'date' => fake()->dateTimeBetween('-3 months', 'now'),
            'coefficient' => fake()->randomFloat(1, 1, 4),
            'note_sur' => 20,
            'is_group_parent' => false,
        ];
    }
}
