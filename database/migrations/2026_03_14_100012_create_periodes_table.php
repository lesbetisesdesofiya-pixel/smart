<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periodes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('annee_scolaire_id');
            $table->string('libelle');
            $table->string('type')->default('trimestre');
            $table->unsignedInteger('numero');
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('annee_scolaire_id')->references('id')->on('annees_scolaires')->cascadeOnDelete();

            $table->unique(['school_id', 'annee_scolaire_id', 'libelle']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periodes');
    }
};
