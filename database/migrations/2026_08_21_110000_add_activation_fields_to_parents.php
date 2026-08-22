<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parents', function (Blueprint $table) {
            $table->string('activation_token', 64)->nullable()->unique()->after('whatsapp_activated');
            $table->boolean('pwa_installed')->default(false)->after('activation_token');
            $table->boolean('notifications_enabled')->default(false)->after('pwa_installed');
        });
    }

    public function down(): void
    {
        Schema::table('parents', function (Blueprint $table) {
            $table->dropColumn(['activation_token', 'pwa_installed', 'notifications_enabled']);
        });
    }
};
