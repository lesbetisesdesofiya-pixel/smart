<?php

namespace App\Services;

class CodeGenerator
{
    private const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    public static function generate(): string
    {
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            $code .= self::CHARS[random_int(0, strlen(self::CHARS) - 1)];
        }
        return substr($code, 0, 4) . '-' . substr($code, 4, 4);
    }

    public static function isValid(string $code): bool
    {
        $pattern = '/^[A-Z2-9]{4}-[A-Z2-9]{4}$/';
        return (bool) preg_match($pattern, $code);
    }
}
