<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsActivity;

class Eleve extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'school_id',
        'classe_id',
        'nom',
        'prenom',
        'date_naissance',
        'matricule',
        'sexe',
        'access_locked',
        'lock_message',
    ];

    protected $hidden = [
        'code',
        'code_used',
    ];

    protected function casts(): array
    {
        return [
            'date_naissance' => 'date',
            'code_used' => 'boolean',
            'active' => 'boolean',
            'access_locked' => 'boolean',
        ];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }

    public function parents()
    {
        return $this->belongsToMany(ParentModel::class, 'parent_eleve', 'eleve_id', 'parent_id');
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function eleveClasses()
    {
        return $this->hasMany(EleveClasse::class);
    }

    public function classeForAnnee($anneeScolaireId)
    {
        $ec = $this->eleveClasses()->where('annee_scolaire_id', $anneeScolaireId)->first();
        return $ec ? $ec->classe : $this->classe;
    }

    public function getNomCompletAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }
}
