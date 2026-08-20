<?php

namespace Database\Factories;

use App\Models\Matiere;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

class MatiereFactory extends Factory
{
    protected $model = Matiere::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'libelle' => fake()->randomElement(['Mathématiques', 'Français', 'Anglais', 'Histoire-Géographie', 'Sciences', 'Physique-Chimie', 'EPS', 'Informatique']),
            'categorie' => fake()->randomElement(['scientifique', 'littéraire', 'technique']),
        ];
    }
}
