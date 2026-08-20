<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Traits\LogsActivity;

class School extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'nom',
        'adresse',
        'telephone',
        'email',
        'ville',
        'pays',
        'logo',
        'devise',
        'active',
        'ai_notes_enabled',
    ];

    public function admins(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'admin_school');
    }

    public function anneesScolaires(): HasMany
    {
        return $this->hasMany(AnneeScolaire::class);
    }

    public function activeAnneeScolaire(): HasOne
    {
        return $this->hasOne(AnneeScolaire::class)->where('active', true);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(Classe::class);
    }

    public function matieres(): HasMany
    {
        return $this->hasMany(Matiere::class);
    }

    public function profs(): HasMany
    {
        return $this->hasMany(Prof::class);
    }

    public function eleves(): HasMany
    {
        return $this->hasMany(Eleve::class);
    }

    public function frais(): HasMany
    {
        return $this->hasMany(Frais::class);
    }

    public function periodes(): HasMany
    {
        return $this->hasMany(Periode::class);
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class);
    }

    public function emploiDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class);
    }

    public function annonces(): HasMany
    {
        return $this->hasMany(Annonce::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }
}
