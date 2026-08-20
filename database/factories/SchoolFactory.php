<?php

namespace Database\Factories;

use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

class SchoolFactory extends Factory
{
    protected $model = School::class;

    public function definition(): array
    {
        return [
            'nom' => fake()->company(),
            'code' => strtoupper(fake()->lexify('??????')),
            'adresse' => fake()->address(),
            'telephone' => '+225' . fake()->numerify('########'),
            'email' => fake()->unique()->safeEmail(),
            'ville' => fake()->city(),
            'pays' => 'Togo',
            'devise' => 'FCFA',
            'active' => true,
            'ai_notes_enabled' => false,
        ];
    }
}
