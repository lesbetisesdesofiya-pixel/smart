<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->foreignId('frais_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('montant', 10, 2);
            $table->enum('type', ['scolarite', 'frais', 'abonnement']);
            $table->enum('methode_paiement', ['especes', 'wave', 'orange_money', 'mtn_momo', 'free_money', 'carte_bancaire']);
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
    }
};
