<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EleveBlockHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'eleve_id',
        'school_id',
        'blocked_at',
        'unblocked_at',
        'reason',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'blocked_at' => 'datetime',
            'unblocked_at' => 'datetime',
        ];
    }

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}
