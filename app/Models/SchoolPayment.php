<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'created_by',
        'montant',
        'date_paiement',
        'periode_debut',
        'periode_fin',
        'mois_couverts',
        'methode_paiement',
        'reference',
        'commentaire',
        'annule',
        'annule_at',
        'annule_par',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_paiement' => 'date',
            'periode_debut' => 'date',
            'periode_fin' => 'date',
            'mois_couverts' => 'array',
            'annule' => 'boolean',
            'annule_at' => 'datetime',
        ];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
