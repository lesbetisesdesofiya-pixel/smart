<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'notifiable_type',
        'notifiable_id',
        'titre',
        'contenu',
        'type',
        'lu',
        'data',
    ];

    protected function casts(): array
    {
        return [
            'lu' => 'boolean',
            'data' => 'array',
        ];
    }

    public function notifiable()
    {
        return $this->morphTo();
    }
}
