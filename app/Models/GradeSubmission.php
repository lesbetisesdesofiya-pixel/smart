<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeSubmission extends Model
{
    protected $fillable = [
        'prof_id',
        'school_id',
        'classe_id',
        'matiere_id',
        'zernio_message_id',
        'image_url',
        'status',
        'json_data',
    ];

    protected function casts(): array
    {
        return [
            'json_data' => 'array',
        ];
    }

    public function prof()
    {
        return $this->belongsTo(Prof::class);
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
}
