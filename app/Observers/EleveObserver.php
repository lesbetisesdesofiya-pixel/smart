<?php

namespace App\Observers;

use App\Models\Eleve;
use App\Models\EleveBlockHistory;
use Illuminate\Support\Facades\Auth;

class EleveObserver
{
    public function updated(Eleve $eleve): void
    {
        if (! $eleve->wasChanged('access_locked')) {
            return;
        }

        $now = now();

        if ($eleve->access_locked) {
            EleveBlockHistory::create([
                'eleve_id' => $eleve->id,
                'school_id' => $eleve->school_id,
                'blocked_at' => $now,
                'unblocked_at' => null,
                'reason' => $eleve->lock_message,
                'created_by' => Auth::id(),
            ]);
        } else {
            EleveBlockHistory::where('eleve_id', $eleve->id)
                ->whereNull('unblocked_at')
                ->update(['unblocked_at' => $now]);
        }
    }
}
