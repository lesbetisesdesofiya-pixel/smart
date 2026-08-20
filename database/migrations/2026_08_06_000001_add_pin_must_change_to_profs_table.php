<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profs', function (Blueprint $table) {
            $table->boolean('pin_must_change')->default(false)->after('pin_hash');
        });
    }

    public function down(): void
    {
        Schema::table('profs', function (Blueprint $table) {
            $table->dropColumn('pin_must_change');
        });
    }
};
