<?php

namespace Database\Factories;

use App\Models\Presence;
use App\Models\School;
use App\Models\Classe;
use App\Models\Eleve;
use Illuminate\Database\Eloquent\Factories\Factory;

class PresenceFactory extends Factory
{
    protected $model = Presence::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'classe_id' => Classe::factory(),
            'eleve_id' => Eleve::factory(),
            'prof_id' => null,
            'matiere_id' => null,
            'date' => fake()->dateTimeBetween('-1 month', 'now'),
            'heure_debut' => fake()->randomElement(['08:00', '09:00', '10:00', '14:00']),
            'heure_fin' => fake()->randomElement(['09:00', '10:00', '11:00', '15:00']),
            'est_present' => fake()->boolean(85),
            'remarque' => null,
        ];
    }
}
