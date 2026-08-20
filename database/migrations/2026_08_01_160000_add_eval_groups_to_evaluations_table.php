<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->enum('type', ['interrogation', 'devoir', 'devoir_surveille', 'composition', 'examen'])->change();
            $table->time('heure_debut')->nullable()->after('date');
            $table->time('heure_fin')->nullable()->after('heure_debut');
            $table->foreignId('evaluation_group_id')->nullable()->after('id')->constrained('evaluations')->nullOnDelete();
            $table->boolean('is_group_parent')->default(false)->after('evaluation_group_id');
        });
    }

    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropForeign(['evaluation_group_id']);
            $table->dropColumn(['heure_debut', 'heure_fin', 'evaluation_group_id', 'is_group_parent']);
            $table->enum('type', ['interrogation', 'devoir', 'composition'])->change();
        });
    }
};
