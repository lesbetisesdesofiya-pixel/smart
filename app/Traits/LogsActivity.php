<?php

namespace App\Traits;

use App\Models\ActivityLog;

trait LogsActivity
{
    private static array $sensitiveFields = [
        'pin_hash', 'code', 'api_keys', 'config', 'device_token',
        'password', 'magic_token', 'remember_token', 'token',
    ];

    protected static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            self::logActivity('created', $model);
        });

        static::updated(function ($model) {
            $dirty = $model->getDirty();
            $original = $model->getOriginal();
            $oldValues = [];
            $newValues = [];
            foreach ($dirty as $key => $value) {
                if (in_array($key, ['updated_at', 'created_at'])) continue;
                if (in_array($key, self::$sensitiveFields)) continue;
                $oldValues[$key] = $original[$key] ?? null;
                $newValues[$key] = $value;
            }
            if (!empty($newValues)) {
                self::logActivity('updated', $model, null, $oldValues, $newValues);
            }
        });

        static::deleted(function ($model) {
            self::logActivity('deleted', $model);
        });
    }

    protected static function logActivity(string $action, $model, ?string $description = null, ?array $oldValues = null, ?array $newValues = null): void
    {
        $user = auth()->user();
        $schoolId = null;

        if (in_array('school_id', $model->getFillable()) || method_exists($model, 'school')) {
            $schoolId = $model->school_id ?? null;
        }

        ActivityLog::log([
            'school_id' => $schoolId,
            'user_type' => $user ? get_class($user) : null,
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? $user?->email ?? 'System',
            'user_role' => $user?->role ?? 'unknown',
            'action' => $action,
            'subject_type' => get_class($model),
            'subject_id' => $model->getKey(),
            'description' => $description ?? static::class . ' ' . $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }
}
