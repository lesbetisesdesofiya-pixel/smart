<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Eleves
        Schema::table('eleves', function (Blueprint $table) {
            $table->index('school_id', 'idx_eleve_school');
            $table->index('classe_id', 'idx_eleve_classe');
            $table->index(['school_id', 'classe_id'], 'idx_eleve_school_classe');
        });

        // Notes
        Schema::table('notes', function (Blueprint $table) {
            $table->index('eleve_id', 'idx_note_eleve');
            $table->index('evaluation_id', 'idx_note_evaluation');
        });

        // Evaluations
        Schema::table('evaluations', function (Blueprint $table) {
            $table->index('classe_id', 'idx_eval_classe');
            $table->index('school_id', 'idx_eval_school');
            $table->index('matiere_id', 'idx_eval_matiere');
            $table->index('annee_scolaire_id', 'idx_eval_annee');
            $table->index('date', 'idx_eval_date');
        });

        // Presences
        Schema::table('presences', function (Blueprint $table) {
            $table->index('eleve_id', 'idx_presence_eleve');
            $table->index('date', 'idx_presence_date');
            $table->index(['eleve_id', 'date'], 'idx_presence_eleve_date');
        });

        // WhatsApp Conversations
        Schema::table('whatsapp_conversations', function (Blueprint $table) {
            $table->index('participant_phone', 'idx_wa_phone');
            $table->index('state', 'idx_wa_state');
        });

        // WhatsApp Messages
        Schema::table('whatsapp_messages', function (Blueprint $table) {
            $table->index('conversation_id', 'idx_wa_msg_conv');
            $table->index('sent_at', 'idx_wa_msg_sent');
        });

        // Subscriptions
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->index('eleve_id', 'idx_sub_eleve');
            $table->index('annee_scolaire_id', 'idx_sub_annee');
        });

        // Remarques
        Schema::table('remarques', function (Blueprint $table) {
            $table->index('eleve_id', 'idx_rem_eleve');
            $table->index('prof_id', 'idx_rem_prof');
            $table->index('visible_parent', 'idx_rem_visible');
        });

        // Annonces
        Schema::table('annonces', function (Blueprint $table) {
            $table->index('school_id', 'idx_ann_school');
            $table->index('publie', 'idx_ann_publie');
        });

        // Parents
        Schema::table('parents', function (Blueprint $table) {
            $table->index('telephone', 'idx_parent_phone');
            $table->index('is_demo', 'idx_parent_demo');
        });
    }

    public function down(): void
    {
        Schema::table('eleves', function (Blueprint $table) {
            $table->dropIndex('idx_eleve_school');
            $table->dropIndex('idx_eleve_classe');
            $table->dropIndex('idx_eleve_school_classe');
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex('idx_note_eleve');
            $table->dropIndex('idx_note_evaluation');
        });

        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropIndex('idx_eval_classe');
            $table->dropIndex('idx_eval_school');
            $table->dropIndex('idx_eval_matiere');
            $table->dropIndex('idx_eval_annee');
            $table->dropIndex('idx_eval_date');
        });

        Schema::table('presences', function (Blueprint $table) {
            $table->dropIndex('idx_presence_eleve');
            $table->dropIndex('idx_presence_date');
            $table->dropIndex('idx_presence_eleve_date');
        });

        Schema::table('whatsapp_conversations', function (Blueprint $table) {
            $table->dropIndex('idx_wa_phone');
            $table->dropIndex('idx_wa_state');
        });

        Schema::table('whatsapp_messages', function (Blueprint $table) {
            $table->dropIndex('idx_wa_msg_conv');
            $table->dropIndex('idx_wa_msg_sent');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex('idx_sub_eleve');
            $table->dropIndex('idx_sub_annee');
        });

        Schema::table('remarques', function (Blueprint $table) {
            $table->dropIndex('idx_rem_eleve');
            $table->dropIndex('idx_rem_prof');
            $table->dropIndex('idx_rem_visible');
        });

        Schema::table('annonces', function (Blueprint $table) {
            $table->dropIndex('idx_ann_school');
            $table->dropIndex('idx_ann_publie');
        });

        Schema::table('parents', function (Blueprint $table) {
            $table->dropIndex('idx_parent_phone');
            $table->dropIndex('idx_parent_demo');
        });
    }
};
