<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsActivity;

class Subscription extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'eleve_id',
        'annee_scolaire_id',
        'classe_id',
        'inscrit',
        'montant_mensuel',
        'mois_payes',
    ];

    protected function casts(): array
    {
        return [
            'inscrit' => 'boolean',
            'frais_paye' => 'boolean',
            'abonnement_paye' => 'boolean',
            'mois_payes' => 'array',
            'access_locked' => 'boolean',
        ];
    }

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function anneeScolaire()
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }

    public function payments()
    {
        return $this->hasMany(SubscriptionPayment::class);
    }

    public function getMontantPayeAttribute(): float
    {
        return $this->payments->sum('montant');
    }
}
