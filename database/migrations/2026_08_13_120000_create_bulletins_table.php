<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bulletins', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('eleve_id');
            $table->unsignedBigInteger('classe_id');
            $table->unsignedBigInteger('periode_id');
            $table->unsignedBigInteger('annee_scolaire_id');
            $table->unsignedBigInteger('school_id');
            $table->string('fichier_path')->nullable();
            $table->boolean('downloaded')->default(false);
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            $table->unique(['eleve_id', 'periode_id', 'annee_scolaire_id']);

            $table->foreign('eleve_id')->references('id')->on('eleves')->cascadeOnDelete();
            $table->foreign('classe_id')->references('id')->on('classes')->cascadeOnDelete();
            $table->foreign('periode_id')->references('id')->on('periodes')->cascadeOnDelete();
            $table->foreign('annee_scolaire_id')->references('id')->on('annees_scolaires')->cascadeOnDelete();
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulletins');
    }
};
