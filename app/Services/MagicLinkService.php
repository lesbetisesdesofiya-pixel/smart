<?php

namespace App\Services;

use App\Models\MagicLink;
use App\Models\ParentModel;
use App\Models\Setting;

class MagicLinkService
{
    public const TTL_MINUTES = 10;

    public const PURPOSES = [
        'dashboard', 'news', 'notes', 'absences', 'frais',
        'emploi', 'annonces', 'profs', 'paiements', 'examens', 'remarques',
    ];

    public const PURPOSE_TO_TAB = [
        'dashboard' => 'accueil',
        'news'      => 'nouveautes',
        'notes'     => 'notes',
        'absences'  => 'notes',
        'frais'     => 'paiements',
        'emploi'    => 'schedule',
        'annonces'  => 'nouveautes',
        'profs'     => 'team',
        'paiements' => 'paiements',
        'examens'   => 'examens',
        'remarques' => 'nouveautes',
    ];

    public function baseUrl(): string
    {
        return config('zernio.public_url', 'https://classinote.sofiya.cc');
    }

    public function create(ParentModel $parent, string $purpose, ?int $eleveId = null): string
    {
        $token = bin2hex(random_bytes(32));

        MagicLink::create([
            'token_hash' => hash('sha256', $token),
            'purpose' => $purpose,
            'user_type' => 'parent',
            'parent_id' => $parent->id,
            'eleve_id' => $eleveId,
            'expires_at' => now()->addMinutes(self::TTL_MINUTES),
        ]);

        return $token;
    }

    public function consume(string $token, string $purpose): ?MagicLink
    {
        $link = MagicLink::where('token_hash', hash('sha256', $token))
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$link) {
            return null;
        }

        $link->update(['used_at' => now()]);

        return $link;
    }

    public function generateUrl(ParentModel $parent, string $purpose, ?int $eleveId = null): string
    {
        $token = $this->create($parent, $purpose, $eleveId);

        return $this->baseUrl() . "/magic?t={$token}";
    }

    public function getTabForPurpose(string $purpose): string
    {
        return self::PURPOSE_TO_TAB[$purpose] ?? 'accueil';
    }
}
