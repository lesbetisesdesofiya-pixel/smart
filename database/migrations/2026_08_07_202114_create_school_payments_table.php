<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->decimal('montant', 12, 2);
            $table->date('date_paiement');
            $table->date('periode_debut')->nullable();
            $table->date('periode_fin')->nullable();
            $table->string('methode_paiement')->default('virement');
            $table->string('reference')->nullable();
            $table->text('commentaire')->nullable();
            $table->boolean('annule')->default(false);
            $table->timestamp('annule_at')->nullable();
            $table->foreignId('annule_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_payments');
    }
};
