<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Frais extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'libelle',
        'type',
        'description',
        'montant',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'float',
            'actif' => 'boolean',
        ];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function classes()
    {
        return $this->belongsToMany(Classe::class, 'frais_classes');
    }

    public function subscriptionPayments()
    {
        return $this->hasMany(SubscriptionPayment::class);
    }
}
