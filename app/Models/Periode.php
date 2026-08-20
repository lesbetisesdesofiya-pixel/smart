<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Periode extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'annee_scolaire_id',
        'libelle',
        'type',
        'numero',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function anneeScolaire()
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }
}
