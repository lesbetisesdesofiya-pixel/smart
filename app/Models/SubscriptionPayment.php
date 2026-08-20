<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubscriptionPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'subscription_id',
        'frais_id',
        'montant',
        'type',
        'methode_paiement',
        'reference',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'float',
        ];
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public function frais()
    {
        return $this->belongsTo(Frais::class);
    }
}
