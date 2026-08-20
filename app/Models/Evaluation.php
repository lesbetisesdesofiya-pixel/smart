<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Traits\LogsActivity;

class Evaluation extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'school_id',
        'classe_id',
        'matiere_id',
        'periode_id',
        'annee_scolaire_id',
        'titre',
        'type',
        'date',
        'heure_debut',
        'heure_fin',
        'coefficient',
        'note_sur',
        'evaluation_group_id',
        'is_group_parent',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'coefficient' => 'float',
            'note_sur' => 'float',
            'is_group_parent' => 'boolean',
        ];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }

    public function matiere()
    {
        return $this->belongsTo(Matiere::class);
    }

    public function periode()
    {
        return $this->belongsTo(Periode::class);
    }

    public function anneeScolaire()
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function groupParent()
    {
        return $this->belongsTo(Evaluation::class, 'evaluation_group_id');
    }

    public function groupChildren()
    {
        return $this->hasMany(Evaluation::class, 'evaluation_group_id');
    }

    public function scopeForClass(Builder $query, int $classeId): Builder
    {
        return $query->where('classe_id', $classeId);
    }

    public function scopeNonParent(Builder $query): Builder
    {
        return $query->where('is_group_parent', false);
    }
}
