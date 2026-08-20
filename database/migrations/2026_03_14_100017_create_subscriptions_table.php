<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('eleve_id');
            $table->unsignedBigInteger('annee_scolaire_id');
            $table->unsignedBigInteger('classe_id');
            $table->boolean('inscrit')->default(true);
            $table->boolean('frais_paye')->default(false);
            $table->boolean('abonnement_paye')->default(false);
            $table->boolean('access_locked')->default(false);
            $table->string('lock_message')->nullable();
            $table->timestamps();

            $table->foreign('eleve_id')->references('id')->on('eleves')->cascadeOnDelete();
            $table->foreign('annee_scolaire_id')->references('id')->on('annees_scolaires')->cascadeOnDelete();
            $table->foreign('classe_id')->references('id')->on('classes')->cascadeOnDelete();

            $table->unique(['eleve_id', 'annee_scolaire_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
