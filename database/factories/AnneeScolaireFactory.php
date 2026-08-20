<?php

namespace Database\Factories;

use App\Models\AnneeScolaire;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnneeScolaireFactory extends Factory
{
    protected $model = AnneeScolaire::class;

    public function definition(): array
    {
        $year = fake()->year();
        return [
            'school_id' => School::factory(),
            'libelle' => $year . '-' . ($year + 1),
            'active' => true,
        ];
    }
}
