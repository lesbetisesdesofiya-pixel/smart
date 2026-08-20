<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FraisClasse extends Model
{
    use HasFactory;

    protected $fillable = [
        'frais_id',
        'classe_id',
    ];

    public function frais()
    {
        return $this->belongsTo(Frais::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }
}
