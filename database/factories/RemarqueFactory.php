<?php

namespace Database\Factories;

use App\Models\Remarque;
use App\Models\Eleve;
use App\Models\Prof;
use App\Models\School;
use App\Models\Classe;
use Illuminate\Database\Eloquent\Factories\Factory;

class RemarqueFactory extends Factory
{
    protected $model = Remarque::class;

    public function definition(): array
    {
        return [
            'eleve_id' => Eleve::factory(),
            'prof_id' => Prof::factory(),
            'school_id' => School::factory(),
            'classe_id' => Classe::factory(),
            'type' => fake()->randomElement(['comportement', 'academique', 'general']),
            'contenu' => fake()->sentence(),
            'visible_parent' => true,
        ];
    }
}
