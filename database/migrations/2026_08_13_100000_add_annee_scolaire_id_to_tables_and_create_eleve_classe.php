<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add annee_scolaire_id to evaluations
        if (!Schema::hasColumn('evaluations', 'annee_scolaire_id')) {
            Schema::table('evaluations', function (Blueprint $table) {
                $table->unsignedBigInteger('annee_scolaire_id')->nullable()->after('periode_id');
                $table->foreign('annee_scolaire_id')->references('id')->on('annees_scolaires')->nullOnDelete();
            });
        }

        // 2. Add annee_scolaire_id to affectations
        if (!Schema::hasColumn('affectations', 'annee_scolaire_id')) {
            Schema::table('affectations', function (Blueprint $table) {
                $table->unsignedBigInteger('annee_scolaire_id')->nullable()->after('classe_id');
                $table->foreign('annee_scolaire_id')->references('id')->on('annees_scolaires')->nullOnDelete();
            });
        }

        // 3. Add annee_scolaire_id to emploi_du_temps
        if (!Schema::hasColumn('emploi_du_temps', 'annee_scolaire_id')) {
            Schema::table('emploi_du_temps', function (Blueprint $table) {
                $table->unsignedBigInteger('annee_scolaire_id')->nullable()->after('classe_id');
                $table->foreign('annee_scolaire_id')->references('id')->on('annees_scolaires')->nullOnDelete();
            });
        }

        // 4. Add annee_scolaire_id to presences
        if (!Schema::hasColumn('presences', 'annee_scolaire_id')) {
            Schema::table('presences', function (Blueprint $table) {
                $table->unsignedBigInteger('annee_scolaire_id')->nullable()->after('classe_id');
                $table->foreign('annee_scolaire_id')->references('id')->on('annees_scolaires')->nullOnDelete();
            });
        }

        // 5. Create eleve_classe pivot table
        if (!Schema::hasTable('eleve_classe')) {
            Schema::create('eleve_classe', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('eleve_id');
                $table->unsignedBigInteger('classe_id');
                $table->unsignedBigInteger('annee_scolaire_id');
                $table->timestamps();

                $table->unique(['eleve_id', 'annee_scolaire_id']);

                $table->foreign('eleve_id')->references('id')->on('eleves')->cascadeOnDelete();
                $table->foreign('classe_id')->references('id')->on('classes')->cascadeOnDelete();
                $table->foreign('annee_scolaire_id')->references('id')->on('annees_scolaires')->cascadeOnDelete();
            });
        }

        // 6. Backfill eleve_classe from existing eleves
        DB::statement('
            INSERT IGNORE INTO eleve_classe (eleve_id, classe_id, annee_scolaire_id, created_at, updated_at)
            SELECT e.id, e.classe_id, c.annee_scolaire_id, NOW(), NOW()
            FROM eleves e
            JOIN classes c ON c.id = e.classe_id
        ');

        // 7. Backfill annee_scolaire_id on evaluations from their classe
        DB::statement('
            UPDATE evaluations ev
            JOIN classes c ON c.id = ev.classe_id
            SET ev.annee_scolaire_id = c.annee_scolaire_id
            WHERE ev.annee_scolaire_id IS NULL
        ');

        // 8. Backfill annee_scolaire_id on affectations from their classe
        DB::statement('
            UPDATE affectations a
            JOIN classes c ON c.id = a.classe_id
            SET a.annee_scolaire_id = c.annee_scolaire_id
            WHERE a.annee_scolaire_id IS NULL
        ');

        // 9. Backfill annee_scolaire_id on emploi_du_temps from their classe
        DB::statement('
            UPDATE emploi_du_temps edt
            JOIN classes c ON c.id = edt.classe_id
            SET edt.annee_scolaire_id = c.annee_scolaire_id
            WHERE edt.annee_scolaire_id IS NULL
        ');

        // 10. Backfill annee_scolaire_id on presences from their classe
        DB::statement('
            UPDATE presences p
            JOIN classes c ON c.id = p.classe_id
            SET p.annee_scolaire_id = c.annee_scolaire_id
            WHERE p.annee_scolaire_id IS NULL
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('eleve_classe');

        if (Schema::hasColumn('evaluations', 'annee_scolaire_id')) {
            Schema::table('evaluations', function (Blueprint $table) {
                $table->dropForeign(['annee_scolaire_id']);
                $table->dropColumn('annee_scolaire_id');
            });
        }

        if (Schema::hasColumn('affectations', 'annee_scolaire_id')) {
            Schema::table('affectations', function (Blueprint $table) {
                $table->dropForeign(['annee_scolaire_id']);
                $table->dropColumn('annee_scolaire_id');
            });
        }

        if (Schema::hasColumn('emploi_du_temps', 'annee_scolaire_id')) {
            Schema::table('emploi_du_temps', function (Blueprint $table) {
                $table->dropForeign(['annee_scolaire_id']);
                $table->dropColumn('annee_scolaire_id');
            });
        }

        if (Schema::hasColumn('presences', 'annee_scolaire_id')) {
            Schema::table('presences', function (Blueprint $table) {
                $table->dropForeign(['annee_scolaire_id']);
                $table->dropColumn('annee_scolaire_id');
            });
        }
    }
};
