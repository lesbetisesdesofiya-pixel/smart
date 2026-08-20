<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. schools
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('code')->nullable();
            $table->string('adresse');
            $table->string('telephone');
            $table->string('email');
            $table->string('ville');
            $table->string('pays')->default('Togo');
            $table->string('logo')->nullable();
            $table->string('devise')->default('FCFA');
            $table->boolean('active')->default(true);
            $table->boolean('ai_notes_enabled')->default(false);
            $table->timestamps();
        });

        // 2. users
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('role', ['superadmin', 'admin'])->default('admin');
            $table->boolean('active')->default(true);
            $table->boolean('force_password_reset')->default(false);
            $table->string('device_token')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('pin_hash')->nullable();
            $table->boolean('pin_must_change')->default(false);
            $table->rememberToken();
            $table->timestamps();
        });

        // 3. admin_school
        Schema::create('admin_school', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'school_id']);
        });

        // 4. annees_scolaires
        Schema::create('annees_scolaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('libelle');
            $table->boolean('active')->default(false);
            $table->timestamps();
            $table->unique(['school_id', 'libelle']);
        });

        // 5. sections
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('libelle');
            $table->timestamps();
            $table->unique(['school_id', 'libelle']);
        });

        // 6. classes
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('section_id')->constrained('sections')->cascadeOnDelete();
            $table->foreignId('annee_scolaire_id')->constrained('annees_scolaires')->cascadeOnDelete();
            $table->string('libelle');
            $table->decimal('ecolage', 12, 2)->default(0);
            $table->timestamps();
            $table->unique(['school_id', 'section_id', 'annee_scolaire_id', 'libelle']);
        });

        // 7. matieres
        Schema::create('matieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('libelle');
            $table->string('categorie')->nullable();
            $table->timestamps();
            $table->unique(['school_id', 'libelle']);
        });

        // 8. profs
        Schema::create('profs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('nom');
            $table->string('prenom');
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->string('code', 9)->unique();
            $table->string('magic_token', 36)->nullable()->unique();
            $table->boolean('code_used')->default(false);
            $table->string('pin_hash')->nullable();
            $table->boolean('pin_must_change')->default(false);
            $table->string('device_token')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // 9. prof_school
        Schema::create('prof_school', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prof_id')->constrained('profs')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('code', 20)->nullable();
            $table->boolean('code_used')->default(false);
            $table->timestamps();
            $table->unique(['prof_id', 'school_id']);
        });

        // 10. eleves
        Schema::create('eleves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->string('nom');
            $table->string('prenom');
            $table->date('date_naissance')->nullable();
            $table->string('matricule')->nullable();
            $table->string('code', 9)->nullable()->unique();
            $table->boolean('code_used')->default(false);
            $table->string('sexe')->nullable();
            $table->boolean('active')->default(true);
            $table->boolean('access_locked')->default(false);
            $table->text('lock_message')->nullable();
            $table->timestamps();
            $table->unique(['school_id', 'matricule']);
        });

        // 11. parents
        Schema::create('parents', function (Blueprint $table) {
            $table->id();
            $table->string('telephone')->unique();
            $table->string('code', 9)->unique();
            $table->string('magic_token', 36)->nullable()->unique();
            $table->boolean('code_used')->default(false);
            $table->string('pin_hash')->nullable();
            $table->boolean('pin_must_change')->default(false);
            $table->string('device_token')->nullable();
            $table->boolean('active')->default(true);
            $table->boolean('whatsapp_activated')->default(false);
            $table->boolean('is_demo')->default(false);
            $table->timestamp('demo_expires_at')->nullable();
            $table->timestamps();
        });

        // 12. parent_eleve
        Schema::create('parent_eleve', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('parents')->cascadeOnDelete();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['parent_id', 'eleve_id']);
        });

        // 13. affectations
        Schema::create('affectations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prof_id')->constrained('profs')->cascadeOnDelete();
            $table->foreignId('matiere_id')->constrained('matieres')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('annee_scolaire_id')->nullable()->constrained('annees_scolaires')->nullOnDelete();
            $table->integer('coefficient')->default(2);
            $table->timestamps();
            $table->unique(['prof_id', 'matiere_id', 'classe_id']);
        });

        // 14. periodes
        Schema::create('periodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('annee_scolaire_id')->constrained('annees_scolaires')->cascadeOnDelete();
            $table->string('libelle');
            $table->string('type')->default('trimestre');
            $table->unsignedInteger('numero');
            $table->timestamps();
            $table->unique(['school_id', 'annee_scolaire_id', 'libelle']);
        });

        // 15. evaluations
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_group_id')->nullable()->constrained('evaluations')->nullOnDelete();
            $table->boolean('is_group_parent')->default(false);
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('matiere_id')->constrained('matieres')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periodes')->cascadeOnDelete();
            $table->foreignId('annee_scolaire_id')->nullable()->constrained('annees_scolaires')->nullOnDelete();
            $table->string('titre');
            $table->enum('type', ['interrogation', 'devoir', 'devoir_surveille', 'composition', 'examen']);
            $table->date('date')->nullable();
            $table->time('heure_debut')->nullable();
            $table->time('heure_fin')->nullable();
            $table->double('coefficient')->default(1);
            $table->double('note_sur')->default(20);
            $table->timestamps();
        });

        // 16. notes
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_id')->constrained('evaluations')->cascadeOnDelete();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->double('note')->nullable();
            $table->text('appreciation')->nullable();
            $table->timestamps();
            $table->unique(['evaluation_id', 'eleve_id']);
        });

        // 17. eleve_classe
        Schema::create('eleve_classe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('annee_scolaire_id')->constrained('annees_scolaires')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['eleve_id', 'annee_scolaire_id']);
        });

        // 18. frais
        Schema::create('frais', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('libelle');
            $table->string('type')->default('annexe');
            $table->text('description')->nullable();
            $table->decimal('montant', 10, 2);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        // 19. frais_classes
        Schema::create('frais_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('frais_id')->constrained('frais')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['frais_id', 'classe_id']);
        });

        // 20. subscriptions
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->foreignId('annee_scolaire_id')->constrained('annees_scolaires')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->boolean('inscrit')->default(true);
            $table->boolean('frais_paye')->default(false);
            $table->boolean('abonnement_paye')->default(false);
            $table->decimal('montant_mensuel', 10, 2)->default(0);
            $table->json('mois_payes')->nullable();
            $table->boolean('access_locked')->default(false);
            $table->string('lock_message')->nullable();
            $table->timestamps();
            $table->unique(['eleve_id', 'annee_scolaire_id']);
        });

        // 21. subscription_payments
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained('subscriptions')->cascadeOnDelete();
            $table->foreignId('frais_id')->nullable()->constrained('frais')->nullOnDelete();
            $table->decimal('montant', 10, 2);
            $table->enum('type', ['scolarite', 'frais', 'abonnement']);
            $table->enum('methode_paiement', ['especes', 'wave', 'orange_money', 'mtn_momo', 'free_money', 'carte_bancaire']);
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 22. emploi_du_temps
        Schema::create('emploi_du_temps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('annee_scolaire_id')->nullable()->constrained('annees_scolaires')->nullOnDelete();
            $table->foreignId('matiere_id')->nullable()->constrained('matieres')->nullOnDelete();
            $table->foreignId('prof_id')->nullable()->constrained('profs')->nullOnDelete();
            $table->enum('jour', ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']);
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->string('type_cours')->default('cours');
            $table->timestamps();
        });

        // 23. annonces
        Schema::create('annonces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('classe_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->string('titre');
            $table->text('contenu');
            $table->enum('type', ['info', 'alerte', 'urgent'])->default('info');
            $table->boolean('publie')->default(true);
            $table->timestamps();
        });

        // 24. conversations
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('type');
            $table->string('subject')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
            $table->foreignId('eleve_id')->nullable()->constrained('eleves')->nullOnDelete();
            $table->foreignId('prof_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
        });

        // 25. messages
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->string('sender_type');
            $table->bigInteger('sender_id');
            $table->text('contenu');
            $table->string('fichier')->nullable();
            $table->boolean('lu')->default(false);
            $table->timestamps();
            $table->index(['sender_type', 'sender_id']);
        });

        // 26. notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('notifiable_type');
            $table->bigInteger('notifiable_id');
            $table->string('titre');
            $table->text('contenu');
            $table->string('type')->default('info');
            $table->boolean('lu')->default(false);
            $table->json('data')->nullable();
            $table->timestamps();
            $table->index(['notifiable_type', 'notifiable_id']);
        });

        // 27. remarques
        Schema::create('remarques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->foreignId('prof_id')->constrained('profs')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->enum('type', ['comportement', 'academique', 'general'])->default('general');
            $table->text('contenu');
            $table->boolean('visible_parent')->default(true);
            $table->timestamps();
        });

        // 28. presences
        Schema::create('presences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools');
            $table->foreignId('classe_id')->constrained('classes');
            $table->foreignId('annee_scolaire_id')->nullable()->constrained('annees_scolaires')->nullOnDelete();
            $table->foreignId('eleve_id')->constrained('eleves');
            $table->foreignId('prof_id')->nullable()->constrained('profs')->nullOnDelete();
            $table->foreignId('matiere_id')->nullable()->constrained('matieres')->nullOnDelete();
            $table->date('date');
            $table->string('heure_debut', 5)->nullable();
            $table->string('heure_fin', 5)->nullable();
            $table->boolean('est_present')->default(true);
            $table->text('remarque')->nullable();
            $table->timestamps();
            $table->unique(['classe_id', 'eleve_id', 'date', 'heure_debut'], 'presence_unique');
        });

        // 29. bulletins
        Schema::create('bulletins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periodes')->cascadeOnDelete();
            $table->foreignId('annee_scolaire_id')->constrained('annees_scolaires')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('fichier_path')->nullable();
            $table->boolean('downloaded')->default(false);
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
            $table->unique(['eleve_id', 'periode_id', 'annee_scolaire_id']);
        });

        // 30. decaissements
        Schema::create('decaissements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('libelle');
            $table->string('categorie')->default('autre');
            $table->decimal('montant', 12, 2);
            $table->date('date');
            $table->string('beneficiaire')->nullable();
            $table->string('methode_paiement')->default('especes');
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 31. demandes_acces
        Schema::create('demandes_acces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('parents')->cascadeOnDelete();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->enum('type', ['unlock_access', 'view_grades', 'view_notes'])->default('unlock_access');
            $table->text('raison')->nullable();
            $table->enum('statut', ['en_attente', 'approuve', 'rejete'])->default('en_attente');
            $table->text('reponse_admin')->nullable();
            $table->timestamps();
        });

        // 32. eleve_block_histories
        Schema::create('eleve_block_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->timestamp('blocked_at')->useCurrent();
            $table->timestamp('unblocked_at')->nullable();
            $table->text('reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 33. parent_feedback
        Schema::create('parent_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('parents')->cascadeOnDelete();
            $table->string('type');
            $table->string('subject')->nullable();
            $table->text('contenu');
            $table->boolean('lu')->default(false);
            $table->timestamps();
        });

        // 34. school_payments
        Schema::create('school_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->decimal('montant', 12, 2);
            $table->date('date_paiement');
            $table->date('periode_debut')->nullable();
            $table->date('periode_fin')->nullable();
            $table->json('mois_couverts')->nullable();
            $table->string('methode_paiement')->default('virement');
            $table->string('reference')->nullable();
            $table->text('commentaire')->nullable();
            $table->boolean('annule')->default(false);
            $table->timestamp('annule_at')->nullable();
            $table->foreignId('annule_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 35. ai_providers
        Schema::create('ai_providers', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('slug')->unique();
            $table->boolean('actif')->default(false);
            $table->enum('scope', ['global', 'ecole'])->default('ecole');
            $table->json('api_keys')->nullable();
            $table->json('config')->nullable();
            $table->timestamps();
        });

        // 36. activity_logs
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->string('user_type')->nullable();
            $table->bigInteger('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('user_role')->nullable();
            $table->string('action');
            $table->string('subject_type')->nullable();
            $table->bigInteger('subject_id')->nullable();
            $table->string('description')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
            $table->index(['school_id', 'created_at']);
            $table->index(['user_type', 'user_id']);
            $table->index('action');
        });

        // 37. settings
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // 38. magic_links
        Schema::create('magic_links', function (Blueprint $table) {
            $table->id();
            $table->string('token_hash', 64)->unique();
            $table->string('purpose', 20);
            $table->foreignId('parent_id')->constrained('parents')->cascadeOnDelete();
            $table->foreignId('eleve_id')->nullable()->constrained('eleves')->cascadeOnDelete();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->index(['purpose', 'expires_at']);
        });

        // 39. whatsapp_conversations
        Schema::create('whatsapp_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('zernio_conversation_id')->unique();
            $table->string('account_id');
            $table->string('participant_phone');
            $table->string('participant_name')->nullable();
            $table->text('last_message')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->boolean('can_reply')->default(false);
            $table->string('state')->nullable();
            $table->json('state_data')->nullable();
            $table->timestamps();
            $table->index('participant_phone');
            $table->index('can_reply');
        });

        // 40. whatsapp_messages
        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('whatsapp_conversations')->cascadeOnDelete();
            $table->string('zernio_message_id')->nullable()->unique();
            $table->enum('direction', ['incoming', 'outgoing']);
            $table->text('message')->nullable();
            $table->string('attachment_url')->nullable();
            $table->enum('status', ['sent', 'delivered', 'read', 'failed'])->default('sent');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->index('direction');
            $table->index('sent_at');
        });

        // 41. trusted_devices
        Schema::create('trusted_devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_token', 64)->unique();
            $table->string('user_type');
            $table->bigInteger('user_id');
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

        // 42. grade_submissions
        Schema::create('grade_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prof_id')->constrained('profs')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('matiere_id')->nullable()->constrained('matieres')->nullOnDelete();
            $table->string('zernio_message_id')->nullable();
            $table->string('image_url')->nullable();
            $table->enum('status', ['pending', 'processed'])->default('pending');
            $table->json('json_data')->nullable();
            $table->timestamps();
        });

        // 43. cache
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
            $table->index('expiration');
        });

        // 44. cache_locks
        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
            $table->index('expiration');
        });

        // 45. jobs
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue');
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
            $table->index('queue');
        });

        // 46. job_batches
        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        // 47. failed_jobs
        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        // 48. sessions
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->bigInteger('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // 49. password_reset_tokens
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // 50. personal_access_tokens
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('tokenable_type');
            $table->bigInteger('tokenable_id');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->index(['tokenable_type', 'tokenable_id']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('grade_submissions');
        Schema::dropIfExists('trusted_devices');
        Schema::dropIfExists('whatsapp_messages');
        Schema::dropIfExists('whatsapp_conversations');
        Schema::dropIfExists('magic_links');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('ai_providers');
        Schema::dropIfExists('school_payments');
        Schema::dropIfExists('parent_feedback');
        Schema::dropIfExists('eleve_block_histories');
        Schema::dropIfExists('demandes_acces');
        Schema::dropIfExists('decaissements');
        Schema::dropIfExists('bulletins');
        Schema::dropIfExists('presences');
        Schema::dropIfExists('remarques');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('annonces');
        Schema::dropIfExists('emploi_du_temps');
        Schema::dropIfExists('subscription_payments');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('frais_classes');
        Schema::dropIfExists('frais');
        Schema::dropIfExists('eleve_classe');
        Schema::dropIfExists('notes');
        Schema::dropIfExists('evaluations');
        Schema::dropIfExists('periodes');
        Schema::dropIfExists('affectations');
        Schema::dropIfExists('parent_eleve');
        Schema::dropIfExists('parents');
        Schema::dropIfExists('eleves');
        Schema::dropIfExists('prof_school');
        Schema::dropIfExists('profs');
        Schema::dropIfExists('matieres');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('sections');
        Schema::dropIfExists('annees_scolaires');
        Schema::dropIfExists('admin_school');
        Schema::dropIfExists('users');
        Schema::dropIfExists('schools');
    }
};
