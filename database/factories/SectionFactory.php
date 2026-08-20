<?php

namespace Database\Factories;

use App\Models\Section;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

class SectionFactory extends Factory
{
    protected $model = Section::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'libelle' => fake()->randomElement(['Primaire', 'Collège', 'Lycée', 'Maternelle']),
        ];
    }
}
