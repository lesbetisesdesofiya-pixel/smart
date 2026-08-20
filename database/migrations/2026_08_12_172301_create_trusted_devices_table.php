<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trusted_devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_token', 64)->unique();
            $table->string('user_type'); // 'prof', 'parent', 'eleve'
            $table->unsignedBigInteger('user_id');
            $table->string('device_name')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->useCurrent();
            $table->timestamps();

            $table->index(['user_type', 'user_id']);
            $table->index('device_token');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trusted_devices');
    }
};
