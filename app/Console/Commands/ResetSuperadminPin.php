<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetSuperadminPin extends Command
{
    protected $signature = 'pin:reset-superadmin {--pin= : Nouveau PIN à 6 chiffres}';
    protected $description = 'Réinitialise le PIN du superadmin';

    public function handle(): int
    {
        $pin = $this->option('pin');

        if (!$pin) {
            $pin = $this->secret('Entrez le nouveau PIN (6 chiffres)');
        }

        if (strlen($pin) !== 6 || !is_numeric($pin)) {
            $this->error('Le PIN doit contenir exactement 6 chiffres.');
            return self::FAILURE;
        }

        $user = User::where('role', 'superadmin')->first();

        if (!$user) {
            $this->error('Aucun superadmin trouvé.');
            return self::FAILURE;
        }

        $user->forceFill([
            'pin_hash' => Hash::make($pin),
            'pin_must_change' => false,
        ])->save();

        $this->info("PIN du superadmin ({$user->email}) réinitialisé avec succès.");
        return self::SUCCESS;
    }
}
