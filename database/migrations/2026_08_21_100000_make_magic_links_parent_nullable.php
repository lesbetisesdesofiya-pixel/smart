<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('magic_links', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('magic_links', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable(false)->change();
        });
    }
};
