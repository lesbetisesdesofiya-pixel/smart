<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DemandeAcces extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id',
        'eleve_id',
        'school_id',
        'type',
        'raison',
        'statut',
        'reponse_admin',
    ];

    public function parent()
    {
        return $this->belongsTo(ParentModel::class, 'parent_id');
    }

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}
