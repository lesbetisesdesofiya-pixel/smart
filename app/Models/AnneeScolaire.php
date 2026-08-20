<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnneeScolaire extends Model
{
    use HasFactory;

    protected $table = 'annees_scolaires';

    protected $fillable = [
        'school_id',
        'libelle',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }

    public function getAnneeAttribute(): int
    {
        return (int) substr($this->libelle, 0, 4);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function classes()
    {
        return $this->hasMany(Classe::class);
    }

    public function periodes()
    {
        return $this->hasMany(Periode::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }

    public function affectations()
    {
        return $this->hasMany(Affectation::class);
    }

    public function emploiDuTemps()
    {
        return $this->hasMany(EmploiDuTemps::class);
    }

    public function presences()
    {
        return $this->hasMany(Presence::class);
    }

    public function eleveClasses()
    {
        return $this->hasMany(EleveClasse::class);
    }
}
