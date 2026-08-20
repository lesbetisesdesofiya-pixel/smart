<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Matiere extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'libelle',
        'categorie',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
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
}
