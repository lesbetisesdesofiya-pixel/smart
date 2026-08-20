<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emploi_du_temps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('matiere_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('prof_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('jour', ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']);
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->string('type_cours')->default('cours'); // cours, recreation, pause
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emploi_du_temps');
    }
};
