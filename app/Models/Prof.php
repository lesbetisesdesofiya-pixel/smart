<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\LogsActivity;

class Prof extends Model
{
    use HasApiTokens, HasFactory, LogsActivity;

    protected $fillable = [
        'school_id',
        'nom',
        'prenom',
        'email',
        'telephone',
        'active',
    ];

    protected $hidden = [
        'pin_hash',
        'device_token',
        'magic_token',
        'code',
        'code_used',
    ];

    protected function casts(): array
    {
        return [
            'code_used' => 'boolean',
            'active' => 'boolean',
            'pin_must_change' => 'boolean',
        ];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function schools()
    {
        return $this->belongsToMany(School::class, 'prof_school')
            ->withPivot('code', 'code_used')
            ->withTimestamps();
    }

    public function affectations()
    {
        return $this->hasMany(Affectation::class);
    }

    public function getAffectationsForSchool(int $schoolId)
    {
        return $this->affectations()
            ->whereHas('classe', fn($q) => $q->where('school_id', $schoolId))
            ->get();
    }

    public function getRoleAttribute(): string
    {
        return 'prof';
    }

    public function hasPin(): bool
    {
        return !is_null($this->pin_hash);
    }

    public function verifyPin(string $pin): bool
    {
        return \Hash::check($pin, $this->pin_hash);
    }

    public function getNomCompletAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }
}
