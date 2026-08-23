<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profs', function (Blueprint $table) {
            $table->rememberToken();
        });

        Schema::table('parents', function (Blueprint $table) {
            $table->rememberToken();
        });
    }

    public function down(): void
    {
        Schema::table('profs', function (Blueprint $table) {
            $table->dropRememberToken();
        });

        Schema::table('parents', function (Blueprint $table) {
            $table->dropRememberToken();
        });
    }
};
