<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Remarque extends Model
{
    use HasFactory;

    protected $fillable = [
        'eleve_id',
        'prof_id',
        'school_id',
        'classe_id',
        'type',
        'contenu',
        'visible_parent',
    ];

    protected function casts(): array
    {
        return [
            'visible_parent' => 'boolean',
        ];
    }

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function prof()
    {
        return $this->belongsTo(Prof::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }
}
