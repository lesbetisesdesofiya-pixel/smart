<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('sender_type'); // App\Models\User, App\Models\Prof, App\Models\Parent
            $table->unsignedBigInteger('sender_id');
            $table->text('contenu');
            $table->string('fichier')->nullable();
            $table->boolean('lu')->default(false);
            $table->timestamps();

            $table->index(['sender_type', 'sender_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
