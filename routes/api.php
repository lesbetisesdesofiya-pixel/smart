<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MagicLinkController;
use App\Http\Controllers\Api\Parent\ParentController;
use App\Http\Controllers\Api\SchoolAdmin\SchoolAdminController;
use App\Http\Controllers\Api\Superadmin\ActivityLogController;
use App\Http\Controllers\Api\Superadmin\FinancialReportController;
use App\Http\Controllers\Api\Superadmin\SettingsController;
use App\Http\Controllers\Api\Superadmin\SuperadminController;
use App\Http\Controllers\Api\Superadmin\SuperadminSchoolController;
use App\Http\Controllers\Api\Superadmin\GradeSubmissionController;
use App\Http\Controllers\Api\AnneeScolaireController;
use App\Http\Controllers\Api\SchoolAdmin\BulletinController;
use App\Http\Controllers\Api\SchoolAdmin\ComptabiliteController;
use App\Http\Controllers\Api\DeviceAuthController;
use App\Http\Controllers\Api\Teacher\TeacherController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MessagingController;
use App\Http\Controllers\Api\WhatsAppController;
use App\Http\Controllers\Api\ZernioWebhookController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ─── Auth ───────────────────────────────────────────
    Route::post('auth/login', [AuthController::class, 'loginGeneric'])
        ->middleware('throttle:5,1');

    // ─── Parent Activation ──────────────────────────────
    Route::post('parents/activate-step', [\App\Http\Controllers\Api\ParentActivationController::class, 'handleActivationStep']);
    Route::get('parents/activate-status', [\App\Http\Controllers\Api\ParentActivationController::class, 'checkStatus']);

    Route::post('auth/superadmin/login', [AuthController::class, 'loginSuperadmin'])
        ->middleware('throttle:5,1');
    Route::post('auth/admin/login', [AuthController::class, 'loginAdmin'])
        ->middleware('throttle:5,1');
    Route::post('auth/admin/pin/setup', [AuthController::class, 'setupAdminPin'])
        ->middleware('throttle:5,1');
    Route::post('auth/admin/pin/login', [AuthController::class, 'loginAdminPin'])
        ->middleware('throttle.pin');
    Route::post('auth/code/verify', [AuthController::class, 'verifyCode'])
        ->middleware('throttle:10,1');
    Route::post('auth/pin/setup', [AuthController::class, 'setupPin'])
        ->middleware('throttle:5,1');
    Route::post('auth/pin/login', [AuthController::class, 'loginPin'])
        ->middleware('throttle.pin');
    Route::post('auth/magic/activate', [AuthController::class, 'magicActivate'])
        ->middleware('throttle:10,1');
    Route::post('auth/admin/magic-link', [AuthController::class, 'adminMagicLink'])
        ->middleware('throttle:10,1');

    // Magic link consume
    Route::post('magic/consume', [MagicLinkController::class, 'consume']);

    // Auth check endpoint
    Route::get('auth/me', [MagicLinkController::class, 'me']);

    // Parent V3 dashboard (works with session auth from magic links)
    Route::get('parent/dashboard', [\App\Http\Controllers\Api\Parent\ParentDashboardController::class, 'dashboard']);

    // Device-based auth for prof/parent
    Route::post('auth/device/verify', [DeviceAuthController::class, 'verify'])
        ->middleware('throttle:10,1');
    Route::post('auth/device/register', [DeviceAuthController::class, 'register'])
        ->middleware('throttle:5,1');
    Route::post('auth/device/login', [DeviceAuthController::class, 'login'])
        ->middleware('throttle:5,1');
    Route::get('auth/device/check', [DeviceAuthController::class, 'check']);
    Route::post('auth/admin/pin/check', [AuthController::class, 'checkAdminPin'])
        ->middleware('throttle:10,1');

    // ─── SuperAdmin ─────────────────────────────────────
    Route::prefix('superadmin')->middleware(['auth:sanctum', 'role:superadmin'])->group(function () {
        Route::get('dashboard', [SuperadminController::class, 'dashboard']);
        Route::get('schools', [SuperadminController::class, 'schools']);
        Route::post('schools', [SuperadminController::class, 'storeSchool']);
        Route::put('schools/{school}', [SuperadminController::class, 'updateSchool']);
        Route::delete('schools/{school}', [SuperadminController::class, 'deleteSchool']);
        Route::post('schools/{school}/import', [SuperadminController::class, 'importSchoolData']);

        Route::post('admins/{user}/reset-password', [SuperadminController::class, 'resetAdminPassword']);
        Route::post('admins/{user}/reset-pin', [SuperadminController::class, 'resetAdminPin']);
        Route::post('admins/{user}/generate-link', [SuperadminController::class, 'generateAdminLink']);

        Route::post('schools/{school}/toggle-ai-notes', [SuperadminController::class, 'toggleAiNotes']);

        // School data access for admin view
        Route::get('schools/{school}/dashboard', [SuperadminSchoolController::class, 'dashboard']);
        Route::get('schools/{school}/classes', [SuperadminSchoolController::class, 'classes']);
        Route::get('schools/{school}/eleves', [SuperadminSchoolController::class, 'eleves']);
        Route::get('schools/{school}/profs', [SuperadminSchoolController::class, 'profs']);
        Route::get('schools/{school}/evaluations', [SuperadminSchoolController::class, 'evaluations']);
        Route::get('schools/{school}/matieres', [SuperadminSchoolController::class, 'matieres']);
        Route::get('schools/{school}/affectations', [SuperadminSchoolController::class, 'affectations']);
        Route::get('schools/{school}/emploi-du-temps', [SuperadminSchoolController::class, 'emploiDuTemps']);

        // Gestion des années scolaires (superadmin)
        Route::get('schools/{school}/annees-scolaires', [SuperadminSchoolController::class, 'anneesScolaires']);
        Route::post('schools/{school}/annees-scolaires', [SuperadminSchoolController::class, 'storeAnneeScolaire']);
        Route::post('schools/{school}/annees-scolaires/{annee}/activate', [SuperadminSchoolController::class, 'activateAnneeScolaire']);

        Route::get('ai-providers', [SuperadminController::class, 'aiProviders']);
        Route::post('ai-providers/{provider}/toggle', [SuperadminController::class, 'toggleAiProvider']);
        Route::post('ai-providers/{provider}/keys', [SuperadminController::class, 'updateAiProviderKeys']);
        Route::delete('ai-providers/{provider}/keys/{key}', [SuperadminController::class, 'deleteAiProviderKey']);

        Route::get('activity-logs', [ActivityLogController::class, 'index']);

        Route::get('settings', [SettingsController::class, 'index']);
        Route::put('settings/zernio-public-url', [SettingsController::class, 'updateZernioPublicUrl']);

        Route::get('financial-reports', [FinancialReportController::class, 'index']);

        Route::get('grade-submissions', [GradeSubmissionController::class, 'index']);
        Route::post('grade-submissions/{submission}/process', [GradeSubmissionController::class, 'process']);
        Route::get('financial-reports/export/pdf', [FinancialReportController::class, 'exportPdf']);
        Route::get('financial-reports/export/excel', [FinancialReportController::class, 'exportExcel']);
        Route::post('financial-reports/payments', [FinancialReportController::class, 'storePayment']);
        Route::post('financial-reports/payments/{payment}/cancel', [FinancialReportController::class, 'cancelPayment']);
    });

    // ─── School Admin ───────────────────────────────────
    Route::prefix('school-admin')->middleware(['auth:sanctum', 'role:admin', 'school'])->group(function () {
        Route::get('school-settings', [SchoolAdminController::class, 'schoolSettings']);

        // Gestion des années scolaires
        Route::get('annees-scolaires', [AnneeScolaireController::class, 'index']);
        Route::post('annees-scolaires', [AnneeScolaireController::class, 'store']);
        Route::post('annees-scolaires/{annee}/activate', [AnneeScolaireController::class, 'activate']);
        Route::delete('annees-scolaires/{annee}', [AnneeScolaireController::class, 'destroy']);

        Route::get('classes', [SchoolAdminController::class, 'classes']);
        Route::post('classes', [SchoolAdminController::class, 'storeClass']);
        Route::delete('classes/{classe}', [SchoolAdminController::class, 'destroyClass']);

        Route::get('matieres', [SchoolAdminController::class, 'matieres']);
        Route::post('matieres', [SchoolAdminController::class, 'storeMatiere']);
        Route::delete('matieres/{matiere}', [SchoolAdminController::class, 'destroyMatiere']);

        Route::get('profs', [SchoolAdminController::class, 'profs']);
        Route::post('profs', [SchoolAdminController::class, 'storeProf']);
        Route::delete('profs/{prof}', [SchoolAdminController::class, 'destroyProf']);
        Route::post('profs/{prof}/toggle', [SchoolAdminController::class, 'toggleProfAccess']);
        Route::post('profs/{prof}/reset-pin', [SchoolAdminController::class, 'resetProfPin']);

        Route::get('parents', [SchoolAdminController::class, 'parents']);
        Route::post('parents/{parent}/reset-pin', [SchoolAdminController::class, 'resetParentPin']);

        Route::get('eleves', [SchoolAdminController::class, 'eleves']);
        Route::get('eleves/filtered', [SchoolAdminController::class, 'elevesFiltered']);
        Route::get('eleves/{eleve}/progression', [SchoolAdminController::class, 'eleveProgression']);
        Route::post('eleves', [SchoolAdminController::class, 'storeEleve']);
        Route::put('eleves/{eleve}', [SchoolAdminController::class, 'updateEleve']);
        Route::delete('eleves/{eleve}', [SchoolAdminController::class, 'destroyEleve']);
        Route::post('eleves/{eleve}/toggle', [SchoolAdminController::class, 'toggleEleveAccess']);
        Route::post('eleves/bulk-lock', [SchoolAdminController::class, 'bulkToggleEleveLock']);
        Route::get('eleves/export/csv', [SchoolAdminController::class, 'exportElevesCsv']);

        Route::get('affectations', [SchoolAdminController::class, 'affectations']);
        Route::post('affectations', [SchoolAdminController::class, 'storeAffectation']);
        Route::delete('affectations/{affectation}', [SchoolAdminController::class, 'destroyAffectation']);
        Route::put('affectations/{affectation}/coefficient', [SchoolAdminController::class, 'updateCoefficient']);

        Route::get('frais', [SchoolAdminController::class, 'frais']);
        Route::post('frais', [SchoolAdminController::class, 'storeFrais']);
        Route::delete('frais/{frais}', [SchoolAdminController::class, 'destroyFrais']);

        Route::get('periodes', [SchoolAdminController::class, 'periodes']);
        Route::post('periodes', [SchoolAdminController::class, 'storePeriode']);
        Route::delete('periodes/{periode}', [SchoolAdminController::class, 'deletePeriode']);

        Route::get('evaluations', [SchoolAdminController::class, 'evaluations']);
        Route::get('evaluations/{evaluationId}/students', [SchoolAdminController::class, 'evaluationStudents']);
        Route::post('evaluations/grades', [SchoolAdminController::class, 'storeGrades']);
        Route::post('evaluation-groups', [SchoolAdminController::class, 'storeEvaluationGroup']);
        Route::put('evaluations/{evaluation}/schedule', [SchoolAdminController::class, 'updateEvaluationSchedule']);
        Route::delete('evaluations/{evaluation}', [SchoolAdminController::class, 'destroyEvaluation']);
        Route::post('evaluations', [SchoolAdminController::class, 'storeEvaluation']);

        Route::get('rapport-notes', [SchoolAdminController::class, 'rapportNotes']);

        Route::get('subscriptions', [SchoolAdminController::class, 'subscriptions']);
        Route::post('subscriptions', [SchoolAdminController::class, 'storeSubscription']);
        Route::post('subscriptions/{subscription}/pay', [SchoolAdminController::class, 'paySubscription']);
        Route::post('subscriptions/pay-by-eleve/{eleveId}', [SchoolAdminController::class, 'payByEleve']);
        Route::post('subscriptions/{subscription}/lock', [SchoolAdminController::class, 'toggleSubscriptionLock']);

        Route::get('emploi-du-temps', [SchoolAdminController::class, 'emploiDuTemps']);
        Route::post('emploi-du-temps', [SchoolAdminController::class, 'storeEmploiDuTemps']);

        Route::get('annonces', [SchoolAdminController::class, 'annonces']);
        Route::post('annonces', [SchoolAdminController::class, 'storeAnnonce']);

        Route::get('conversations', [SchoolAdminController::class, 'conversations']);

        // Parent feedback
        Route::get('parent-feedback', [SchoolAdminController::class, 'parentFeedback']);
        Route::post('parent-feedback/{id}/read', [SchoolAdminController::class, 'markFeedbackRead']);

        // Bulletins
        Route::get('bulletins/affectations', [BulletinController::class, 'affectations']);
        Route::get('bulletins/saisie', [BulletinController::class, 'saisieNotes']);
        Route::post('bulletins/saisie', [BulletinController::class, 'storeSaisieNotes']);
        Route::get('bulletins/classe', [BulletinController::class, 'bulletinsClasse']);
        Route::post('bulletins/generate', [BulletinController::class, 'generateBulletin']);
        Route::post('bulletins/generate-classe', [BulletinController::class, 'generateBulletinsClasse']);
        Route::get('bulletins/download/{bulletin}', [BulletinController::class, 'downloadBulletin']);
        Route::get('bulletins/search', [BulletinController::class, 'searchBulletins']);

        // Comptabilité
        Route::get('comptabilite/dashboard', [ComptabiliteController::class, 'dashboard']);
        Route::get('comptabilite/encaissements', [ComptabiliteController::class, 'encaissements']);
        Route::get('comptabilite/decaissements', [ComptabiliteController::class, 'decaissements']);
        Route::post('comptabilite/decaissements', [ComptabiliteController::class, 'storeDecaissement']);
        Route::delete('comptabilite/decaissements/{decaissement}', [ComptabiliteController::class, 'destroyDecaissement']);

        // Messaging
        Route::get('messaging', [MessagingController::class, 'adminConversations']);
        Route::get('messaging/{conversation}/messages', [MessagingController::class, 'adminMessages']);

        // Notifications push
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::post('test-notification', [NotificationController::class, 'testNotification']);

        // Demandes d'accès
        Route::get('demandes-acces', [SchoolAdminController::class, 'demandesAcces']);
        Route::put('demandes-acces/{demande}', [SchoolAdminController::class, 'updateDemandeAcces']);
    });

    // ─── Admin Device Token ─────────────────────────────
    Route::prefix('school-admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::post('device-token', [NotificationController::class, 'saveToken']);
        Route::delete('device-token', [NotificationController::class, 'removeToken']);
    });

    // ─── Teacher ────────────────────────────────────────
    Route::prefix('teacher')->middleware(['auth:sanctum', 'role:prof'])->group(function () {
        // Device token (no pin verification needed)
        Route::post('device-token', [NotificationController::class, 'saveToken']);
        Route::delete('device-token', [NotificationController::class, 'removeToken']);
    });

    Route::prefix('teacher')->middleware(['auth:sanctum', 'role:prof', 'pin.verified'])->group(function () {
        Route::get('dashboard', [TeacherController::class, 'dashboard']);
        Route::get('grades', [TeacherController::class, 'grades']);
        Route::post('grades', [TeacherController::class, 'storeGrades']);
        Route::get('evaluations', [TeacherController::class, 'evaluations']);
        Route::get('evaluations/{evaluationId}/students', [TeacherController::class, 'evaluationStudents']);
        Route::get('evaluations/{evaluationId}/notes', [TeacherController::class, 'evaluationNotes']);
        Route::get('classes/{classeId}/details', [TeacherController::class, 'classDetails']);
        Route::get('eleves/{eleveId}/evolution', [TeacherController::class, 'studentEvolution']);
        Route::post('link-by-code', [TeacherController::class, 'linkByCode']);

        // Multi-school
        Route::post('add-school', [TeacherController::class, 'addSchool']);
        Route::get('schools', [TeacherController::class, 'schools']);
        Route::post('select-school', [TeacherController::class, 'selectSchool']);

        // Quick interrogation
        Route::post('interrogation', [TeacherController::class, 'storeInterrogation']);

        // Attendance
        Route::get('presences', [TeacherController::class, 'presences']);
        Route::post('presences', [TeacherController::class, 'storePresences']);
        Route::get('emploi-du-temps', [TeacherController::class, 'emploiDuTemps']);

        // Messaging
        Route::get('messaging', [MessagingController::class, 'index']);
        Route::get('messaging/{conversation}/messages', [MessagingController::class, 'messages']);
        Route::post('messaging/{conversation}/send', [MessagingController::class, 'send']);
        Route::post('messaging/start', [MessagingController::class, 'startConversation']);

        // Remarques
        Route::post('remarques', [TeacherController::class, 'storeRemarque']);
        Route::get('remarques', [TeacherController::class, 'remarques']);

        // Notifications push
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::post('test-notification', [NotificationController::class, 'testNotification']);
    });

    // ─── Parent ─────────────────────────────────────────
    Route::prefix('parent')->middleware(['auth:sanctum', 'role:parent'])->group(function () {
        // Device token (no pin verification needed)
        Route::post('device-token', [NotificationController::class, 'saveToken']);
        Route::delete('device-token', [NotificationController::class, 'removeToken']);
    });

    Route::prefix('parent')->middleware(['auth:sanctum', 'role:parent', 'pin.verified'])->group(function () {
        Route::get('enfants', [ParentController::class, 'enfants']);
        Route::get('contacts', [ParentController::class, 'contacts']);
        Route::get('notes', [ParentController::class, 'notes']);
        Route::get('avis', [ParentController::class, 'avis']);
        Route::get('paiements', [ParentController::class, 'paiements']);
        Route::get('frais', [ParentController::class, 'frais']);
        Route::get('evaluations', [ParentController::class, 'evaluations']);
        Route::get('emploi-du-temps', [ParentController::class, 'emploiDuTemps']);
        Route::post('subscribe', [ParentController::class, 'subscribe']);
        Route::get('search-parent', [ParentController::class, 'searchParent']);

        // Messaging
        Route::get('messaging', [MessagingController::class, 'index']);
        Route::get('messaging/{conversation}/messages', [MessagingController::class, 'messages']);
        Route::post('messaging/{conversation}/send', [MessagingController::class, 'send']);
        Route::post('messaging/start', [MessagingController::class, 'startConversation']);

        // Remarques
        Route::get('remarques', [ParentController::class, 'remarques']);

        // Feedback
        Route::post('feedback', [ParentController::class, 'storeFeedback']);

        // Demandes d'accès
        Route::post('demandes-acces', [ParentController::class, 'storeDemandeAcces']);
        Route::get('demandes-acces', [ParentController::class, 'demandesAcces']);

        // Notifications push
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::post('test-notification', [NotificationController::class, 'testNotification']);
    });

    // ─── Shared Auth ────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/refresh', [AuthController::class, 'refresh']);
        Route::post('auth/pin/change', [AuthController::class, 'changePin']);
        Route::post('auth/admin/pin/change', [AuthController::class, 'changeAdminPin']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/unlock', [AuthController::class, 'unlock'])
            ->middleware('throttle.pin');
        Route::post('auth/force-password-reset', [SuperadminController::class, 'forcePasswordReset'])
            ->middleware('throttle:5,1');
    });

    // ─── AI ─────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'throttle:20,1'])->group(function () {
        Route::post('ai/extract-grades', [AiController::class, 'extractGrades']);
        Route::post('ai/student-summary', [AiController::class, 'studentSummary']);
        Route::post('ai/teacher-notes', [AiController::class, 'teacherNotes']);
        Route::post('ai/generate-notice', [AiController::class, 'generateNotice']);
        Route::post('ai/generate-notice-mistral', [AiController::class, 'generateNoticeMistral']);
    });

    // ─── WhatsApp (Zernio) ──────────────────────────────
    Route::prefix('whatsapp')->middleware(['auth:sanctum'])->group(function () {
        Route::get('conversations', [WhatsAppController::class, 'conversations']);
        Route::get('conversations/{conversation}/messages', [WhatsAppController::class, 'messages']);
        Route::post('conversations/{conversation}/messages', [WhatsAppController::class, 'sendMessage']);
    });

    // ─── Zernio Webhook (no auth) ───────────────────────
    Route::post('zernio/webhook', [ZernioWebhookController::class, 'handle']);

    // ─── Liens magiques WhatsApp (no auth, le token est l'authentification) ──
    Route::post('magic/consume', [MagicLinkController::class, 'consume'])
        ->middleware('throttle:10,1');
});
