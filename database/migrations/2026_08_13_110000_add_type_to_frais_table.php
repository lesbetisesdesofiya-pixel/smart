<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('frais', function (Blueprint $table) {
            $table->string('type')->default('annexe')->after('libelle');
        });
    }

    public function down(): void
    {
        Schema::table('frais', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
