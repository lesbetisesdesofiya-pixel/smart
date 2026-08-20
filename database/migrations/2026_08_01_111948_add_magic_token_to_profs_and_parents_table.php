<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profs', function (Blueprint $table) {
            $table->string('magic_token', 36)->nullable()->unique()->after('code');
        });

        Schema::table('parents', function (Blueprint $table) {
            $table->string('magic_token', 36)->nullable()->unique()->after('code');
        });

        // Generate magic tokens for existing records
        foreach (DB::table('profs')->get() as $prof) {
            DB::table('profs')->where('id', $prof->id)->update(['magic_token' => Str::uuid()->toString()]);
        }
        foreach (DB::table('parents')->get() as $parent) {
            DB::table('parents')->where('id', $parent->id)->update(['magic_token' => Str::uuid()->toString()]);
        }
    }

    public function down(): void
    {
        Schema::table('profs', function (Blueprint $table) {
            $table->dropColumn('magic_token');
        });

        Schema::table('parents', function (Blueprint $table) {
            $table->dropColumn('magic_token');
        });
    }
};
