<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_payments', function (Blueprint $table) {
            $table->json('mois_couverts')->nullable()->after('periode_fin');
        });
    }

    public function down(): void
    {
        Schema::table('school_payments', function (Blueprint $table) {
            $table->dropColumn('mois_couverts');
        });
    }
};
