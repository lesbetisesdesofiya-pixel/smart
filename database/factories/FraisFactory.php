<?php

namespace Database\Factories;

use App\Models\Frais;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

class FraisFactory extends Factory
{
    protected $model = Frais::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'libelle' => fake()->randomElement(['Inscription', 'Minerval', 'Assurance', 'Uniforme', 'Cantine']),
            'description' => fake()->sentence(),
            'montant' => fake()->randomElement([5000, 10000, 25000, 50000, 100000]),
            'actif' => true,
        ];
    }
}
