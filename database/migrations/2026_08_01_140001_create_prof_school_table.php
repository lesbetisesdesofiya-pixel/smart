<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prof_school', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prof_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20)->nullable();
            $table->boolean('code_used')->default(false);
            $table->timestamps();

            $table->unique(['prof_id', 'school_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prof_school');
    }
};
