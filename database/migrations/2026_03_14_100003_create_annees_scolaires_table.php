<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('annees_scolaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('libelle');
            $table->boolean('active')->default(false);
            $table->timestamps();

            $table->unique(['school_id', 'libelle']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('annees_scolaires');
    }
};
