<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\LogsActivity;

class ParentModel extends Authenticatable
{
    use HasApiTokens, HasFactory, LogsActivity, Notifiable;

    protected $table = 'parents';

    protected $fillable = [
        'telephone',
        'code',
        'active',
        'whatsapp_activated',
        'is_demo',
        'demo_expires_at',
    ];

    protected $hidden = [
        'pin_hash',
        'device_token',
        'magic_token',
        'code',
        'code_used',
    ];

    protected function casts(): array
    {
        return [
            'code_used' => 'boolean',
            'active' => 'boolean',
            'pin_must_change' => 'boolean',
            'whatsapp_activated' => 'boolean',
            'is_demo' => 'boolean',
            'demo_expires_at' => 'datetime',
        ];
    }

    public function eleves()
    {
        return $this->belongsToMany(Eleve::class, 'parent_eleve', 'parent_id', 'eleve_id');
    }

    public function getRoleAttribute(): string
    {
        return 'parent';
    }

    public function hasPin(): bool
    {
        return !is_null($this->pin_hash);
    }

    public function verifyPin(string $pin): bool
    {
        return \Hash::check($pin, $this->pin_hash);
    }

    public function setPin(string $pin): void
    {
        $this->forceFill(['pin_hash' => \Hash::make($pin)])->save();
    }

    public function getEnfantsInfo(): array
    {
        return $this->eleves()->with('classe.section')->get()->map(fn($eleve) => [
            'id' => $eleve->id,
            'nom' => $eleve->nom,
            'prenom' => $eleve->prenom,
            'classe' => $eleve->classe->libelle,
            'section' => $eleve->classe->section->libelle ?? null,
        ])->toArray();
    }
}
