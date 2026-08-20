<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperadminSeeder extends Seeder
{
    public function run(): void
    {
        $password = \Illuminate\Support\Str::random(16);

        $user = User::firstOrCreate(
            ['email' => 'superadmin@classinote.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make($password),
                'role' => 'superadmin',
                'active' => true,
            ]
        );

        if ($user->wasRecentlyCreated) {
            $user->forceFill(['force_password_reset' => true])->save();
        }

        echo "Superadmin créé. Mot de passe temporaire: {$password}" . PHP_EOL;
        echo "IMPORTANT: Ce mot de passe doit être changé à la première connexion." . PHP_EOL;
    }
}
