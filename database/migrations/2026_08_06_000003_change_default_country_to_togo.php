<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('schools')->where('pays', "Côte d'Ivoire")->update(['pays' => 'Togo']);

        Schema::table('schools', function (Blueprint $table) {
            $table->string('pays')->default('Togo')->change();
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('pays')->default("Côte d'Ivoire")->change();
        });
    }
};
