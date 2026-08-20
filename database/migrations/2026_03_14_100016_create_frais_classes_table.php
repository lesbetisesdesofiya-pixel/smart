<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('frais_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('frais_id')->constrained()->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['frais_id', 'classe_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('frais_classes');
    }
};
