<?php

namespace App\Providers;

use App\Models\Eleve;
use App\Observers\EleveObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Eleve::observe(EleveObserver::class);
    }
}
