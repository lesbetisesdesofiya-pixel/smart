<?php

namespace Database\Factories;

use App\Models\Subscription;
use App\Models\Eleve;
use App\Models\AnneeScolaire;
use App\Models\Classe;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubscriptionFactory extends Factory
{
    protected $model = Subscription::class;

    public function definition(): array
    {
        return [
            'eleve_id' => Eleve::factory(),
            'annee_scolaire_id' => AnneeScolaire::factory(),
            'classe_id' => Classe::factory(),
            'inscrit' => true,
            'frais_paye' => fake()->boolean(70),
            'abonnement_paye' => fake()->boolean(60),
            'montant_mensuel' => fake()->randomElement([1000, 2000, 3000, 5000]),
            'mois_payes' => [],
            'access_locked' => false,
            'lock_message' => null,
        ];
    }
}
