<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function value(string $key, ?string $default = null): ?string
    {
        $setting = static::query()->where('key', $key)->value('value');

        return $setting ?? $default;
    }

    public static function set(string $key, ?string $value): self
    {
        return static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
