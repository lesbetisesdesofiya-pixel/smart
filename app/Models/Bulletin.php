<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bulletin extends Model
{
    protected $fillable = [
        'eleve_id',
        'classe_id',
        'periode_id',
        'annee_scolaire_id',
        'school_id',
        'fichier_path',
        'downloaded',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'downloaded' => 'boolean',
            'generated_at' => 'datetime',
        ];
    }

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }

    public function periode()
    {
        return $this->belongsTo(Periode::class);
    }

    public function anneeScolaire()
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}
