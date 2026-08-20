<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Decaissement extends Model
{
    protected $fillable = [
        'school_id',
        'libelle',
        'categorie',
        'montant',
        'date',
        'beneficiaire',
        'methode_paiement',
        'reference',
        'notes',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'float',
            'date' => 'date',
        ];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
