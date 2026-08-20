<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained();
            $table->foreignId('classe_id')->constrained();
            $table->foreignId('eleve_id')->constrained();
            $table->foreignId('prof_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('matiere_id')->nullable()->constrained()->nullOnDelete();
            $table->date('date');
            $table->string('heure_debut', 5)->nullable();
            $table->string('heure_fin', 5)->nullable();
            $table->boolean('est_present')->default(true);
            $table->text('remarque')->nullable();
            $table->timestamps();

            $table->unique(['classe_id', 'eleve_id', 'date', 'heure_debut'], 'presence_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presences');
    }
};
