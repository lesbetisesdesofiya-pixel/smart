<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Presence extends Model
{
    protected $fillable = [
        'school_id',
        'classe_id',
        'eleve_id',
        'prof_id',
        'matiere_id',
        'annee_scolaire_id',
        'date',
        'heure_debut',
        'heure_fin',
        'est_present',
        'remarque',
    ];

    protected $casts = [
        'est_present' => 'boolean',
    ];

    public function school(): BelongsTo { return $this->belongsTo(School::class); }
    public function classe(): BelongsTo { return $this->belongsTo(Classe::class); }
    public function eleve(): BelongsTo { return $this->belongsTo(Eleve::class); }
    public function prof(): BelongsTo { return $this->belongsTo(Prof::class); }
    public function matiere(): BelongsTo { return $this->belongsTo(Matiere::class); }
    public function anneeScolaire(): BelongsTo { return $this->belongsTo(AnneeScolaire::class); }
}
