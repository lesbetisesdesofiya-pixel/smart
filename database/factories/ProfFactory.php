<?php

namespace Database\Factories;

use App\Models\Prof;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProfFactory extends Factory
{
    protected $model = Prof::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'email' => fake()->unique()->safeEmail(),
            'telephone' => '+225' . fake()->numerify('########'),
            'code' => strtoupper(Str::random(9)),
            'code_used' => false,
            'magic_token' => Str::random(64),
            'pin_hash' => null,
            'pin_must_change' => false,
            'active' => true,
        ];
    }

    public function withPin(string $pin = '1111'): static
    {
        return $this->state(fn () => [
            'pin_hash' => Hash::make($pin),
            'code_used' => true,
        ]);
    }
}
