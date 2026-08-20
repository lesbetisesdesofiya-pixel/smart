<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_conversations', function (Blueprint $table) {
            $table->string('state')->nullable()->after('can_reply');
            $table->json('state_data')->nullable()->after('state');
        });

        Schema::table('parents', function (Blueprint $table) {
            $table->boolean('whatsapp_activated')->default(false)->after('active');
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_conversations', function (Blueprint $table) {
            $table->dropColumn(['state', 'state_data']);
        });

        Schema::table('parents', function (Blueprint $table) {
            $table->dropColumn('whatsapp_activated');
        });
    }
};
