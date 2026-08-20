<?php

namespace Database\Factories;

use App\Models\Eleve;
use App\Models\School;
use App\Models\Classe;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class EleveFactory extends Factory
{
    protected $model = Eleve::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'classe_id' => Classe::factory(),
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'date_naissance' => fake()->dateTimeBetween('-15 years', '-6 years'),
            'matricule' => strtoupper(Str::random(8)),
            'code' => strtoupper(Str::random(9)),
            'code_used' => false,
            'sexe' => fake()->randomElement(['M', 'F']),
            'active' => true,
            'access_locked' => false,
            'lock_message' => null,
        ];
    }
}
