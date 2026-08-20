<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('zernio_conversation_id')->unique();
            $table->string('account_id');
            $table->string('participant_phone');
            $table->string('participant_name')->nullable();
            $table->text('last_message')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->boolean('can_reply')->default(false);
            $table->timestamps();

            $table->index('participant_phone');
            $table->index('can_reply');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_conversations');
    }
};
