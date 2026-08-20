<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsActivity;

class Classe extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'school_id',
        'section_id',
        'annee_scolaire_id',
        'libelle',
        'ecolage',
    ];

    protected function casts(): array
    {
        return [
            'ecolage' => 'decimal:2',
        ];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function anneeScolaire()
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    public function eleves()
    {
        return $this->hasMany(Eleve::class);
    }

    public function affectations()
    {
        return $this->hasMany(Affectation::class);
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }

    public function emploiDuTemps()
    {
        return $this->hasMany(EmploiDuTemps::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function fraisClasses()
    {
        return $this->hasMany(FraisClasse::class);
    }
}
