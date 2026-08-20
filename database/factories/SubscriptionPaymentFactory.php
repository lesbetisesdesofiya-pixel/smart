<?php

namespace Database\Factories;

use App\Models\SubscriptionPayment;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubscriptionPaymentFactory extends Factory
{
    protected $model = SubscriptionPayment::class;

    public function definition(): array
    {
        return [
            'subscription_id' => Subscription::factory(),
            'frais_id' => null,
            'montant' => fake()->randomElement([1000, 2000, 3000, 5000]),
            'type' => fake()->randomElement(['scolarite', 'frais', 'abonnement']),
            'methode_paiement' => fake()->randomElement(['especes', 'wave', 'orange_money', 'mtn_momo']),
            'reference' => null,
            'notes' => null,
        ];
    }
}
