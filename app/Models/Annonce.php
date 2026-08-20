<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Annonce extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'user_id',
        'classe_id',
        'titre',
        'contenu',
        'type',
        'publie',
    ];

    protected function casts(): array
    {
        return [
            'publie' => 'boolean',
        ];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }
}
