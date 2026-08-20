<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parent_eleve', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained()->cascadeOnDelete();
            $table->foreignId('eleve_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['parent_id', 'eleve_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_eleve');
    }
};
