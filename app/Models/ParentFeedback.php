<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParentFeedback extends Model
{
    use HasFactory;

    protected $table = 'parent_feedback';

    protected $fillable = [
        'parent_id',
        'type',
        'subject',
        'contenu',
        'lu',
    ];

    protected function casts(): array
    {
        return [
            'lu' => 'boolean',
        ];
    }

    public function parent()
    {
        return $this->belongsTo(ParentModel::class, 'parent_id');
    }
}
