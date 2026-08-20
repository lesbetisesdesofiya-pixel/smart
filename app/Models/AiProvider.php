<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiProvider extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'slug',
        'actif',
        'scope',
    ];

    protected $hidden = [
        'api_keys',
        'config',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
            'api_keys' => 'encrypted:array',
            'config' => 'encrypted:array',
        ];
    }
}
