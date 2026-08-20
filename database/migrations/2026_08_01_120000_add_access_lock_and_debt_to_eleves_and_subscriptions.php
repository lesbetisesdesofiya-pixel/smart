<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('eleves', function (Blueprint $table) {
            $table->boolean('access_locked')->default(false)->after('active');
            $table->text('lock_message')->nullable()->after('access_locked');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->decimal('montant_mensuel', 10, 2)->default(0)->after('abonnement_paye');
            $table->json('mois_payes')->nullable()->after('montant_mensuel');
        });
    }

    public function down(): void
    {
        Schema::table('eleves', function (Blueprint $table) {
            $table->dropColumn(['access_locked', 'lock_message']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['montant_mensuel', 'mois_payes']);
        });
    }
};
