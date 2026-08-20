<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TrustedDevice extends Model
{
    protected $fillable = [
        'device_token',
        'user_type',
        'user_id',
        'device_name',
        'ip_address',
        'user_agent',
        'last_used_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public static function generateToken(): string
    {
        return Str::random(64);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function markUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    public function user()
    {
        return $this->morphTo();
    }
}
