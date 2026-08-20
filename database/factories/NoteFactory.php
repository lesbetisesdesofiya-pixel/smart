<?php

namespace Database\Factories;

use App\Models\Note;
use App\Models\Evaluation;
use App\Models\Eleve;
use Illuminate\Database\Eloquent\Factories\Factory;

class NoteFactory extends Factory
{
    protected $model = Note::class;

    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'eleve_id' => Eleve::factory(),
            'note' => fake()->randomFloat(1, 0, 20),
            'appreciation' => fake()->optional(0.3)->sentence(),
        ];
    }
}
