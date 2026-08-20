<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->foreignId('eleve_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('prof_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('subject')->nullable()->after('type');
            $table->timestamp('last_message_at')->nullable()->after('subject');
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeign(['eleve_id']);
            $table->dropForeign(['prof_id']);
            $table->dropForeign(['parent_id']);
            $table->dropColumns(['eleve_id', 'prof_id', 'parent_id', 'subject', 'last_message_at']);
        });
    }
};
