<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendZernioMessage;
use App\Models\Annonce;
use App\Models\Eleve;
use App\Models\EleveClasse;
use App\Models\EmploiDuTemps;
use App\Models\Evaluation;
use App\Models\Frais;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\ParentModel;
use App\Models\Presence;
use App\Models\Remarque;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\WhatsAppConversation;
use App\Models\WhatsAppMessage;
use App\Services\MagicLinkService;
use App\Services\RekaService;
use App\Services\ZernioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ZernioWebhookController extends Controller
{
 public function __construct(
 private ZernioService $zernio,
 private RekaService $reka
 ) {}

 private bool $workerSpawned = false;

 public function handle(Request $request): JsonResponse
 {
 $signature = $request->header('X-Zernio-Signature');
 $payload = $request->getContent();

 if ($signature && !$this->zernio->verifyWebhookSignature($payload, $signature)) {
 Log::warning('Zernio: signature webhook invalide');
 return response()->json(['error' => 'Invalid signature'], 401);
 }

 $event = $request->input('event');

 Log::info('Zernio webhook reçu', ['event' => $event]);

 return match ($event) {
 'message.received' => $this->handleMessageReceived($request->all()),
 'conversation.started' => $this->handleConversationStarted($request->all()),
 'message.delivered' => $this->handleMessageStatus($request->all(), 'delivered'),
 'message.read' => $this->handleMessageStatus($request->all(), 'read'),
 'message.failed' => $this->handleMessageFailed($request->all()),
 default => response()->json(['success' => true]),
 };
 }
 
 private function handleMessageReceived(array $payload): JsonResponse
 {
 $message = $payload['message'] ?? [];
 $conversation = $payload['conversation'] ?? [];
 $account = $payload['account'] ?? [];

 $conversationId = $conversation['id'] ?? null;
 $accountId = $account['accountId'] ?? $account['id'] ?? null;
 $platform = $message['platform'] ?? $payload['platform'] ?? null;

 if ($platform !== 'whatsapp' || !$conversationId) {
 return response()->json(['success' => true]);
 }

 $sender = $message['sender'] ?? [];
 $phoneNumber = $sender['phoneNumber'] ?? $sender['id'] ?? '';

 $conv = WhatsAppConversation::firstOrCreate(
 ['zernio_conversation_id' => $conversationId],
 [
 'account_id' => $accountId,
 'participant_phone' => $phoneNumber ?: ($conversation['participantId'] ?? ''),
 'participant_name' => $sender['name'] ?? null,
 ]
 );

 $conv->markCanReply();

 $this->zernio->sendTypingIndicator($conversationId, $accountId);

 $zernioMessageId = $message['id'] ?? null;

 if ($zernioMessageId) {
 $exists = WhatsAppMessage::where('zernio_message_id', $zernioMessageId)->exists();

 if (!$exists) {
 $text = $message['text'] ?? null;
 $interactiveId = $this->extractInteractiveId($message, $payload);
                $displayText = $this->extractDisplayText($message);
                $attachmentUrls = [];

                if (!empty($message['attachments'])) {
                    foreach ($message['attachments'] as $att) {
                        if (!empty($att['url'])) {
                            $attachmentUrls[] = $att['url'];
                        }
                    }
                }
                $attachmentUrl = $attachmentUrls[0] ?? null;

 WhatsAppMessage::create([
 'conversation_id' => $conv->id,
 'zernio_message_id' => $zernioMessageId,
 'direction' => 'incoming',
 'message' => $text ?? $displayText ?? '[média]',
 'attachment_url' => $attachmentUrl,
 'status' => 'sent',
 'sent_at' => now(),
 ]);

 $conv->update([
 'last_message' => $text ?? $displayText ?? '[média]',
 'last_message_at' => now(),
 ]);

 $input = $interactiveId ?? $text;

                // Detect image attachment for prof grade submission
                if (!empty($attachmentUrls) && !$interactiveId) {
                    $convState = $conv->fresh()->state;
                    $stateData = $conv->fresh()->state_data ?? [];
                    if ($convState === 'awaiting_prof_image' && ($stateData['type'] ?? '') === 'notes') {
                        $profId = $stateData['prof_id'] ?? null;
                        $classeId = $stateData['classe_id'] ?? null;
                        $matiereId = $stateData['matiere_id'] ?? null;
                        $prof = $profId ? \App\Models\Prof::find($profId) : null;
                        if ($prof) {
                            $zernioAccountId = $payload['account']['id'] ?? null;
                            $count = 0;
                            foreach ($attachmentUrls as $attUrl) {
                                $imageUrl = $attUrl;
                                if ($zernioAccountId && $zernioMessageId) {
                                    $imageUrl = config('zernio.base_url') . '/whatsapp/media/' . $zernioMessageId . '?accountId=' . $zernioAccountId;
                                }
                                \App\Models\GradeSubmission::create([
                                    'prof_id' => $prof->id,
                                    'school_id' => $prof->school_id,
                                    'classe_id' => $classeId ?? $prof->affectations()->first()?->classe_id,
                                    'matiere_id' => $matiereId ?? $prof->affectations()->first()?->matiere_id,
                                    'zernio_message_id' => $zernioMessageId,
                                    'image_url' => $imageUrl,
                                    'status' => 'pending',
                                ]);
                                $count++;
                            }
                            $classe = $classeId ? \App\Models\Classe::find($classeId) : null;
                            $matiere = $matiereId ? \App\Models\Matiere::find($matiereId) : null;
                            $classeName = $classe?->libelle ?? 'votre classe';
                            $matiereName = $matiere?->libelle ?? '';
                            $this->sendText($conv, "✅ *{$count} image(s) bien reçue(s) !*\n\n📚 Classe : {$classeName}\n📚 Matière : {$matiereName}\n\n📸 Envoyez d'autres photos ou cliquez Terminé.", [
                                ['title' => '✅ Terminé', 'payload' => 'prof_done'],
                                ['title' => '📸 Autre photo', 'payload' => 'prof_notes'],
                            ]);
                            return response()->json(['success' => true]);
                        }
                    }
                }

 $this->autoReply($conv, [$phoneNumber, $conv->participant_phone, $conversation['participantId'] ?? null, $sender['id'] ?? null], $input);
 }
 }

 return response()->json(['success' => true]);
 }

 private function extractInteractiveId(array $message, array $fullPayload = []): ?string
 {
 $interactive = $message['interactive'] ?? [];

 foreach (['list_reply', 'button_reply', 'cta_url_reply'] as $type) {
 if (isset($interactive[$type]['id'])) {
 return (string) $interactive[$type]['id'];
 }
 }

 foreach (['listReply', 'buttonReply', 'response'] as $type) {
 if (isset($interactive[$type]['id'])) {
 return (string) $interactive[$type]['id'];
 }
 }

 if (isset($interactive['id'])) {
 return (string) $interactive['id'];
 }

 if (isset($message['response']['id'])) {
 return (string) $message['response']['id'];
 }

 $metadata = $fullPayload['metadata'] ?? [];
 if (isset($metadata['interactiveId'])) {
 return (string) $metadata['interactiveId'];
 }

 return null;
 }

 private function extractDisplayText(array $message): ?string
 {
 $interactive = $message['interactive'] ?? [];

 foreach (['list_reply', 'button_reply', 'cta_url_reply'] as $type) {
 if (isset($interactive[$type]['title'])) {
 return (string) $interactive[$type]['title'];
 }
 }

 if (isset($message['response']['title'])) {
 return (string) $message['response']['title'];
 }

 return null;
 }
 private function autoReply(WhatsAppConversation $conv, array $phoneCandidates, ?string $text): void
 {
 $norm = $this->normalizeText($text);
 $state = $conv->state;

 // --- Normal parent flow ---------------------------
 $parent = $this->findParentByPhone($phoneCandidates);
 $prof = $this->findProfByPhone($phoneCandidates);

 // --- Rate limiting (10 messages/minute) -----------
 $recentMessages = WhatsAppMessage::where('conversation_id', $conv->id)
 ->where('direction', 'incoming')
 ->where('sent_at', '>=', now()->subMinute())
 ->count();

 if ($recentMessages > 10) {
 return;
 }

 // --- Prof + Parent dual role ----------------------
 $role = $conv->state_data['role'] ?? null;

 if ($state === 'awaiting_role_selection' || $state === 'awaiting_prof_action' || $state === 'awaiting_prof_image') {
 if ($prof) {
 $this->handleProfFlow($conv, $prof, $norm, $state);
 return;
 }
 }

 if ($prof && !$parent) {
 $this->handleProfFlow($conv, $prof, $norm, $state);
 return;
 }

 if ($prof && $parent && $role !== 'parent') {
 if ($role === 'prof') {
 $this->handleProfFlow($conv, $prof, $norm, $state);
 return;
 }
 if ($state !== 'awaiting_role_selection') {
 $this->askRoleSelection($conv, $parent, $prof);
 }
 return;
 }

 if (!$parent) {
 Log::info('Zernio: parent introuvable pour la conversation', [
 'conversation_id' => $conv->zernio_conversation_id,
 'candidates' => $phoneCandidates,
 ]);

 if ($norm === 'contacter_ecole' || preg_match('/contacter|ecole|école|administration/i', $norm)) {
 $message = "📧 *Contactez l'administration de votre école*\n\n";
 $message .= "Pour que l'école de votre enfant adopte *ClassiNote*, nous vous invitons à en parler directement à l'administration.\n\n";
 $message .= "💡 Vous pouvez aussi leur envoyer ce message :";
 $url = 'whatsapp://send?text=' . rawurlencode("Bonjour, je souhaiterais que l'école utilise ClassiNote afin de faciliter le suivi scolaire et la communication entre les parents et l'établissement.\n\nhttps://classinote.com");
 $this->sendText($conv, $message, [], [
 'type' => 'cta_url',
 'body' => ['text' => $message],
 'action' => [
 'name' => 'cta_url',
 'parameters' => [
 'display_text' => 'Envoyer le message',
 'url' => $url,
 ],
 ],
 ]);
 $conv->resetState();
 return;
 }

 if ($state === 'awaiting_demo_confirm' || $norm === 'tester_demo' || preg_match('/tester|test|essai|demo/i', $norm)) {
 if ($state === 'awaiting_demo_confirm' && !$this->isYes($norm) && !$this->isNo($norm) && $norm !== 'tester_demo') {
 $this->sendText($conv, "Veuillez choisir une option :", [
 ['title' => '✅ Oui, j\'essaie', 'payload' => 'demo_confirm'],
 ['title' => '❌ Non, merci', 'payload' => 'demo_cancel'],
 ]);
 return;
 }
 $this->handleDemoRequest($conv, $norm, $state);
 return;
 }

 $this->sendMarketingMessage($conv);
 return;
 }

 if (!$this->isParentActivated($parent)) {
 $this->handleActivation($conv, $parent, $norm, $state);
 return;
 }

 if ($state === 'awaiting_menu_child') {
 $this->handleMenuChildSelection($conv, $parent, $norm);
 return;
 }

 if ($state === 'awaiting_menu_action') {
 $this->handleMenuAction($conv, $parent, $norm);
 return;
 }

 if ($state === 'awaiting_child') {
 $this->handleChildSelection($conv, $parent, $norm);
 return;
 }

 if ($state === 'awaiting_demo_feedback') {
 $this->handleDemoFeedback($conv, $parent, $norm, $state);
 return;
 }

 if ($norm === 'menu' || $norm === 'accueil' || $norm === 'retour') {
 $this->startRichMenu($conv, $parent);
 return;
 }

 $action = $this->matchAction($norm);

 if ($action === 'dashboard') {
 $this->sendDashboardMagicLink($conv, $parent);
 return;
 }

 if ($action === 'nouveautes') {
 $this->handleNewsRequest($conv, $parent);
 return;
 }

 if ($action) {
 $children = $this->getUnlockedChildren($parent);

 if ($children->count() > 1) {
 $this->askChildSelection($conv, $parent, $action);
 $conv->setState('awaiting_child', ['action' => $action]);
 } else {
 $this->replyAction($conv, $parent, $action, $children->first()?->id);
 }
 } else {
 $children = $this->getUnlockedChildren($parent);

 // Check if parent mentions a different child name
 if ($children->count() > 1) {
 $mentionedChild = $this->findChildByNameInMessage($children, $text);
 if ($mentionedChild) {
 $this->sendRichMenu($conv, $parent, $mentionedChild);
 return;
 }
 }

 $this->startRichMenu($conv, $parent);
 }
 }

 private function isParentActivated(ParentModel $parent): bool
 {
 return $parent->whatsapp_activated || !is_null($parent->pin_hash);
 }

 private function handleActivation(WhatsAppConversation $conv, ParentModel $parent, string $norm, ?string $state): void
 {
 $children = $this->getUnlockedChildren($parent);

 if ($children->isEmpty()) {
 $this->sendText($conv, "👋 Bonjour !\n\nVotre numéro n'est pas encore associé à un enfant dans notre système.\n\nMerci de contacter l'administration de l'école pour ajouter vos enfants à votre compte.");
 $conv->resetState();
 return;
 }

 if ($state === 'awaiting_activation_confirm') {
 if ($this->isYes($norm)) {
 $parent->update(['whatsapp_activated' => true]);
 Log::info('Zernio: compte parent activé via WhatsApp', ['parent_id' => $parent->id]);
 $this->sendText($conv, "🎉 *Votre compte est activé !*\n\nRavi de vous accueillir sur ClassiNote.");
 $this->sendRichMenu($conv, $parent, $children->first());
 $conv->resetState();
 return;
 }

 if ($this->isNo($norm)) {
 $this->sendText($conv, "D'accord, pas de souci 🙏\n\nVous pourrez activer votre compte plus tard en répondant *OUI*.");
 $conv->resetState();
 return;
 }

 $this->offerActivation($conv, $parent);
 $conv->setState('awaiting_activation_confirm');
 return;
 }

 if ($state === 'activation_declined') {
 if ($this->isYes($norm)) {
 $this->offerActivation($conv, $parent);
 $conv->setState('awaiting_activation_confirm');
 } else {
 $this->sendText($conv, "Pas de souci 👍\n\nRépondez *OUI* quand vous voudrez activer votre compte.");
 }
 return;
 }

 $this->offerActivation($conv, $parent);
 $conv->setState('awaiting_activation_confirm');
 }

    private function offerActivation(WhatsAppConversation $conv, ParentModel $parent): void
    {
        $children = $this->getUnlockedChildren($parent);

        if (!$parent->activation_token) {
            $parent->update(['activation_token' => bin2hex(random_bytes(32))]);
        }

        $url = config('zernio.public_url') . '/app/activate/?token=' . $parent->activation_token;

        $lines = ["👋 *Bienvenue sur ClassiNote !*\n"];
        $lines[] = "Nous avons trouvé les enfants suivants associés à votre numéro :";

        foreach ($children as $child) {
            $classe = $child->classe?->libelle ?? '—';
            $lines[] = "\n👦 *{$child->nom_complet}*\n   Classe : {$classe}";
        }

        $lines[] = "\n📲 Pour activer votre compte et suivre leur scolarité, installez l'application :";

        $conv->setState('awaiting_activation_confirm');

        $this->sendText($conv, implode("\n", $lines), [], [
            'type' => 'cta_url',
            'body' => ['text' => implode("\n", $lines)],
            'action' => [
                'name' => 'cta_url',
                'parameters' => [
                    'display_text' => 'Activer ClassiNote',
                    'url' => $url,
                ],
            ],
        ]);
    }

 private function activationButtons(): array
 {
 return [
 ['title' => 'Oui, je confirme', 'payload' => 'confirm'],
 ['title' => 'Non, pas mes enfants', 'payload' => 'reject'],
 ];
 }

 private function handleChildSelection(WhatsAppConversation $conv, ParentModel $parent, string $norm): void
 {
 $data = $conv->state_data ?? [];
 $action = $data['action'] ?? null;

 $child = $this->findChildByMessage($parent, $norm);

 if ($child && $action) {
 if ($action === 'nouveautes') {
 $this->sendNewsMagicLink($conv, $parent, $child);
 } else {
 $this->replyAction($conv, $parent, $action, $child->id);
 }
 $conv->resetState();
 } else {
 if (!$child && !preg_match('/eleve[:\s]+(\d+)/i', $norm) && $action) {
 $conv->resetState();
 $this->sendMenu($conv);
 return;
 }
 $this->askChildSelection($conv, $parent, $action);
 }
 }

 private function askChildSelection(WhatsAppConversation $conv, ParentModel $parent, ?string $action): void
 {
 $children = $this->getUnlockedChildren($parent);

 $labels = [
 'notes' => 'les notes',
 'emploi' => "l'emploi du temps",
 'absences' => 'les absences',
 'annonce' => 'les annonces',
 'msg_prof' => 'les enseignants',
 'frais' => 'les frais',
 'paiement' => 'les paiements',
 'support' => 'l’aide',
 'nouveautes' => 'les nouveautés',
 ];

 $what = $labels[$action] ?? 'les informations';

 $buttons = $children->take(13)->map(function ($child) use ($children) {
 $prenom = $child->prenom;
 $dupes = $children->take(13)->filter(fn($c) => $c->prenom === $prenom);
 if ($dupes->count() > 1) {
 $prenom = $prenom . ' #' . $child->id;
 }
 return [
 'title' => mb_substr($prenom, 0, 20),
 'payload' => 'eleve:' . $child->id,
 ];
 })->values()->toArray();

 $this->sendText($conv, "Bien sûr ! Pour quel enfant souhaitez-vous consulter {$what} ?", $buttons);
 }

 private function handleNewsRequest(WhatsAppConversation $conv, ParentModel $parent): void
 {
 $children = $this->getUnlockedChildren($parent);

 if ($children->isEmpty()) {
 $this->sendText($conv, "Aucun enfant n'est actuellement rattaché à votre compte. Merci de contacter l'administration de l'école pour vérifier vos informations.");
 return;
 }

 if ($children->count() >= 4) {
 $this->sendChildList($conv, $children);
 } else {
 $this->askChildSelection($conv, $parent, 'nouveautes');
 }

 $conv->setState('awaiting_child', ['action' => 'nouveautes']);
 }

 private function sendChildList(WhatsAppConversation $conv, Collection $children): void
 {
 $rows = $children->take(10)->map(function ($child) use ($children) {
 $prenom = $child->prenom;
 $dupes = $children->take(10)->filter(fn($c) => $c->prenom === $prenom);
 if ($dupes->count() > 1) {
 $prenom = $prenom . ' #' . $child->id;
 }
 return [
 'id' => 'eleve:' . $child->id,
 'title' => mb_substr($prenom, 0, 24),
 'description' => $child->classe?->libelle ?? '—',
 ];
 })->values()->toArray();

 $this->sendText($conv, 'Pour quel enfant souhaitez-vous voir les nouveautés ?', [], [
 'type' => 'list',
 'body' => ['text' => 'Pour quel enfant souhaitez-vous voir les nouveautés ?'],
 'action' => [
 'name' => 'single_select',
 'button' => 'Choisir',
 'sections' => [
 ['title' => 'Vos enfants', 'rows' => $rows],
 ],
 ],
 ]);
 }

 private function sendNewsMagicLink(WhatsAppConversation $conv, ParentModel $parent, Eleve $child): void
 {
 $conv->setState('awaiting_menu_action', ['eleve_id' => $child->id, 'last_news_seen_at' => now()->toDateTimeString()]);

 $url = app(MagicLinkService::class)->generateUrl($parent, 'news', $child->id);

 $message = "🔔 *Nouveautés pour {$child->nom_complet}*\n\n"
 . "Cliquez ci-dessous pour découvrir les dernières *notes*, *absences*, *examens*, *remarques* et *avis* de votre enfant.\n\n"
 . "⏰ Ce lien sécurisé expire dans 10 minutes.";

 $this->sendText($conv, $message, [], [
 'type' => 'cta_url',
 'body' => ['text' => $message],
 'action' => [
 'name' => 'cta_url',
 'parameters' => [
 'display_text' => 'Voir les nouveautés',
 'url' => $url,
 ],
 ],
 ]);
 }

 private function sendDashboardMagicLink(WhatsAppConversation $conv, ParentModel $parent): void
 {
 $url = app(MagicLinkService::class)->generateUrl($parent, 'dashboard');

 $message = "📊 *Votre tableau de bord ClassiNote*\n\n"
 . "Cliquez ci-dessous pour accéder directement à votre espace personnel.\n\n"
 . "⏰ Ce lien sécurisé expire dans 10 minutes.";

 $this->sendText($conv, $message, [], [
 'type' => 'cta_url',
 'body' => ['text' => $message],
 'action' => [
 'name' => 'cta_url',
 'parameters' => [
 'display_text' => 'Mon tableau de bord',
 'url' => $url,
 ],
 ],
 ]);
 }

 private function findChildByMessage(ParentModel $parent, string $norm): ?Eleve
 {
 $children = $this->getUnlockedChildren($parent);

 if (preg_match('/\beleve\s*[:]?\s*(\d+)/i', $norm, $m)) {
 return $children->firstWhere('id', (int) $m[1]) ?: null;
 }

 foreach ($children as $child) {
 $prenom = $this->normalizeText($child->prenom);
 $nom = $this->normalizeText($child->nom);
 $name = $this->normalizeText($child->nom_complet);

 if ($prenom !== '' && $prenom === $norm) return $child;
 if ($name !== '' && (str_contains($norm, $name) || str_contains($name, $norm))) return $child;
 if ($prenom !== '' && (str_contains($norm, $prenom) || str_contains($prenom, $norm))) return $child;
 if ($nom !== '' && $nom === $norm) return $child;
 }

 return null;
 }

 private function findChildByNameInMessage(Collection $children, string $text): ?Eleve
 {
 $norm = $this->normalizeText($text);

 foreach ($children as $child) {
 $prenom = $this->normalizeText($child->prenom);
 if ($prenom !== '' && str_contains($norm, $prenom)) {
 return $child;
 }
 }

 return null;
 }

 private function getUnlockedChildren(ParentModel $parent): Collection
 {
 return $parent->eleves()
 ->where('access_locked', false)
 ->with('classe')
 ->get();
 }

 private function getUnlockedEleveIds(ParentModel $parent, ?int $eleveId = null): array
 {
 $ids = $this->getUnlockedChildren($parent)->pluck('id')->toArray();

 if ($eleveId) {
 return in_array($eleveId, $ids) ? [$eleveId] : [];
 }

 return $ids;
 }

    private function getAnneeActive(ParentModel $parent): ?\App\Models\AnneeScolaire
    {
        $schoolId = $parent->eleves()->first()?->school_id;

        if (!$schoolId) {
            return null;
        }

        return \Illuminate\Support\Facades\Cache::remember("annee_active_{$schoolId}", 3600, function () use ($schoolId) {
            return \App\Models\AnneeScolaire::where('school_id', $schoolId)->where('active', true)->first();
        });
    }

    private function getAnneeActiveForSchool(int $schoolId): ?\App\Models\AnneeScolaire
    {
        return \Illuminate\Support\Facades\Cache::remember("annee_active_{$schoolId}", 3600, function () use ($schoolId) {
            return \App\Models\AnneeScolaire::where('school_id', $schoolId)->where('active', true)->first();
        });
    }

 private function replyAction(WhatsAppConversation $conv, ParentModel $parent, string $action, ?int $eleveId = null): void
 {
 $message = $this->formatForAction($parent, $action, $eleveId);

 if ($message === null || $message === '') {
 $this->sendMenu($conv);
 return;
 }

 $quickReplies = [
 ['title' => '🔙 Retour au menu', 'payload' => 'retour_menu'],
 ];

 if ($this->getUnlockedChildren($parent)->count() > 1) {
 $quickReplies[] = ['title' => '👶 Changer enfant', 'payload' => 'changer enfant'];
 }

 $result = $this->zernio->sendMessage($conv->zernio_conversation_id, $conv->account_id, $message, null, [
 'quickReplies' => $quickReplies,
 ]);

 if (!empty($result['success'])) {
 WhatsAppMessage::create([
 'conversation_id' => $conv->id,
 'zernio_message_id' => $result['data']['messageId'] ?? null,
 'direction' => 'outgoing',
 'message' => $message,
 'status' => 'sent',
 'sent_at' => now(),
 ]);
 } elseif (!empty($result['error'])) {
 Log::error('Zernio: échec envoi réponse action parent', [
 'action' => $action,
 'result' => $result,
 ]);
 }
 }

 private function formatForAction(ParentModel $parent, string $action, ?int $eleveId = null): ?string
 {
 return match ($action) {
 'notes' => $this->formatNotes($parent, $eleveId),
 'emploi' => $this->formatEmploiDuTemps($parent, $eleveId),
 'absences' => $this->formatAbsences($parent, $eleveId),
 'msg_prof' => $this->formatProfs($parent, $eleveId),
 'annonce' => $this->formatAnnonces($parent, $eleveId),
 'frais' => $this->formatFrais($parent, $eleveId),
 'paiement' => $this->formatPaiements($parent, $eleveId),
 'remarques' => $this->formatRemarques($parent, $eleveId),
 'examens' => $this->formatExamens($parent, $eleveId),
 'support' => "🛟 *Besoin d'aide ?*\n\nRépondez « menu » pour revenir au menu principal.\nPour toute autre question, l'administration de l'école se fera un plaisir de vous aider.",
 default => null,
 };
 }

 private function sendMenu(WhatsAppConversation $conv): void
 {
 $this->queueSend(
 $conv,
 'Que puis-je faire pour vous aujourd\'hui ?',
 [
 ['title' => '🔔 Nouveautés', 'payload' => 'nouveautes'],
 ['title' => '📊 Tableau de bord', 'payload' => 'dashboard'],
 ]
 );
 }

 // ─── MENU RICHE ─────────────────────────────────────────────

 private function startRichMenu(WhatsAppConversation $conv, ParentModel $parent): void
 {
 $children = $this->getUnlockedChildren($parent);

 if ($children->isEmpty()) {
 $this->sendText($conv, "Aucun enfant n'est actuellement rattaché à votre compte. Contactez l'administration de l'école si cela vous semble anormal.");
 return;
 }

 $conv->setState('awaiting_menu_child', ['role' => 'parent']);

 if ($children->count() === 1) {
 $this->sendRichMenu($conv, $parent, $children->first());
 return;
 }

 $rows = $children->take(10)->map(function ($child) use ($children) {
 $prenom = $child->prenom;
 $dupes = $children->take(10)->filter(fn($c) => $c->prenom === $prenom);
 if ($dupes->count() > 1) {
 $prenom = $prenom . ' #' . $child->id;
 }
 return [
 'id' => 'menu_enfant:' . $child->id,
 'title' => mb_substr($prenom, 0, 24),
 'description' => $child->classe?->libelle ?? '',
 ];
 })->values()->toArray();

 $prof = $this->findProfByPhone([$conv->participant_phone]);
 if ($prof) {
 $rows[] = [
 'id' => 'role_prof',
 'title' => '👨‍🏫 Mode Professeur',
 'description' => 'Passer en mode enseignant',
 ];
 }

 $this->sendText($conv, "👶 Pour quel enfant souhaitez-vous consulter les informations ?", [], [
 'type' => 'list',
 'body' => ['text' => "👶 Pour quel enfant souhaitez-vous consulter les informations ?"],
 'action' => [
 'name' => 'single_select',
 'button' => 'Choisir',
 'sections' => [
 ['title' => 'Enfants', 'rows' => $rows],
 ],
 ],
 ]);
 }

 private function handleMenuChildSelection(WhatsAppConversation $conv, ParentModel $parent, string $norm): void
 {
 if ($norm === 'role_prof' || $norm === 'role prof' || preg_match('/mode.*prof|professeur/i', $norm)) {
 $prof = $this->findProfByPhone([$conv->participant_phone]);
 if ($prof) {
 $this->sendProfMenu($conv, $prof);
 return;
 }
 }

 $conv->resetState();

 $eleveId = null;

 if (preg_match('/menu[_\s]enfant[:\s]+(\d+)/i', $norm, $m)) {
 $eleveId = (int) $m[1];
 } else {
 $child = $this->findChildByMessage($parent, $norm);
 $eleveId = $child?->id;
 }

 if (!$eleveId) {
 $this->sendText($conv, "Je n'ai pas trouvé cet enfant. Veuillez choisir dans la liste :", [], [
 'type' => 'list',
 'body' => ['text' => 'Choisissez votre enfant :'],
 'action' => [
 'name' => 'single_select',
 'button' => 'Choisir',
 'sections' => [
 ['title' => 'Enfants', 'rows' => array_map(fn($c) => [
 'id' => 'menu_enfant:' . $c->id,
 'title' => mb_substr($c->prenom, 0, 24),
 'description' => $c->classe?->libelle ?? '',
 ], $this->getUnlockedChildren($parent)->take(10)->all())],
 ],
 ],
 ]);
 $conv->setState('awaiting_menu_child', ['role' => 'parent']);
 return;
 }

 $eleve = Eleve::with('classe')->find($eleveId);
 if (!$eleve) {
 $this->startRichMenu($conv, $parent);
 return;
 }

 $this->sendRichMenu($conv, $parent, $eleve);
 }

 private function sendRichMenu(WhatsAppConversation $conv, ParentModel $parent, Eleve $eleve): void
 {
 $conv->setState('awaiting_menu_action', ['eleve_id' => $eleve->id]);

 $rows = [];
 $prof = $this->findProfByPhone([$conv->participant_phone]);
 if ($prof) {
 $rows[] = ['id' => 'role_prof', 'title' => '👨‍🏫 Mode Professeur', 'description' => 'Passer en mode enseignant'];
 }

 $this->sendText($conv, "Que souhaitez-vous consulter pour *{$eleve->prenom}* ?", [], [
 'type' => 'list',
 'body' => ['text' => "Que souhaitez-vous consulter pour *{$eleve->prenom}* ?"],
 'action' => [
 'name' => 'single_select',
 'button' => 'Voir les options',
 'sections' => [
 [
 'title' => 'Principal',
 'rows' => array_values(array_merge(
 $prof ? [['id' => 'role_prof', 'title' => '👨‍🏫 Mode Professeur', 'description' => 'Passer en mode enseignant']] : [],
 [
 ['id' => 'action:nouveautes', 'title' => '🔔 Nouveautés', 'description' => 'Tout ce qui est nouveau'],
 ['id' => 'action:dashboard', 'title' => '🏠 Dashboard', 'description' => 'Ouvrir l\'application'],
 ]
 )),
 ],
 [
 'title' => 'Scolarité',
 'rows' => [
 ['id' => 'action:notes', 'title' => '📝 Notes', 'description' => 'Voir les dernières notes'],
 ['id' => 'action:absences', 'title' => '⏰ Absences', 'description' => 'Voir les absences'],
 ['id' => 'action:examens', 'title' => '📋 Examens', 'description' => 'Examens à venir'],
 ['id' => 'action:frais', 'title' => '💰 Frais', 'description' => 'Frais scolaires et paiements'],
 ],
 ],
 [
 'title' => 'Informations',
 'rows' => [
 ['id' => 'action:remarques', 'title' => '📝 Remarques', 'description' => 'Dernières remarques des profs'],
 ['id' => 'action:annonces', 'title' => '📢 Annonces', 'description' => 'Avis et annonces'],
 ['id' => 'action:paiements', 'title' => '💳 Paiements', 'description' => 'Historique des paiements'],
 ],
 ],
 ],
 ],
 ]);
 }

 private function handleMenuAction(WhatsAppConversation $conv, ParentModel $parent, string $norm): void
 {
 $data = $conv->state_data ?? [];
 $eleveId = $data['eleve_id'] ?? null;

 if ($norm === 'role_prof' || $norm === 'role prof' || preg_match('/mode.*prof|professeur/i', $norm)) {
 $prof = $this->findProfByPhone([$conv->participant_phone]);
 if ($prof) {
 $conv->resetState();
 $this->sendProfMenu($conv, $prof);
 return;
 }
 }

 if ($norm === 'retour_menu' || $norm === 'retour menu' || $norm === 'retour' || $norm === 'retour au menu' || $norm === 'menu') {
 $eleve = $eleveId ? Eleve::with('classe')->find($eleveId) : null;
 if ($eleve) {
 $this->sendRichMenu($conv, $parent, $eleve);
 } else {
 $conv->resetState();
 $this->startRichMenu($conv, $parent);
 }
 return;
 }

 if (preg_match('/changer.*enfant|autre.*enfant|change.*child/i', $norm)) {
 $conv->resetState();
 $this->startRichMenu($conv, $parent);
 return;
 }

 $action = null;

 if (preg_match('/^action[:\s]+(\w+)$/i', $norm, $m)) {
 $action = $m[1];
 }

 if (!$action) {
 $eleve = $eleveId ? Eleve::with('classe')->find($eleveId) : null;
 if ($eleve) {
 $this->sendRichMenu($conv, $parent, $eleve);
 } else {
 $conv->resetState();
 $this->startRichMenu($conv, $parent);
 }
 return;
 }

 $eleve = $eleveId ? Eleve::with('classe')->find($eleveId) : null;
 if (!$eleve) {
 $conv->resetState();
 $this->startRichMenu($conv, $parent);
 return;
 }

 if ($action === 'dashboard') {
 $conv->resetState();
 $this->sendDashboardMagicLink($conv, $parent);
 return;
 }
 $this->sendActionPreview($conv, $parent, $eleve, $action);
 }

 private function sendActionPreview(WhatsAppConversation $conv, ParentModel $parent, Eleve $eleve, string $action): void
 {
 $anneeActive = $this->getAnneeActive($parent);
 $magic = app(MagicLinkService::class);

 $preview = match ($action) {
 'notes' => $this->buildNotesPreview($eleve, $anneeActive),
 'absences' => $this->buildAbsencesPreview($eleve),
 'frais' => $this->buildFraisPreview($eleve),
 'emploi' => $this->buildEmploiPreview($eleve, $anneeActive),
 'nouveautes' => $this->buildNouveautesPreview($eleve, $anneeActive),
 'profs' => $this->buildProfsPreview($eleve),
 'annonces' => $this->buildAnnoncesPreview($eleve),
 'paiements'=> $this->buildPaiementsPreview($eleve),
 'remarques'=> $this->buildRemarquesPreview($eleve),
 'examens' => $this->buildExamensPreview($eleve, $anneeActive),
 default => null,
 };

 if (!$preview) {
 $quickReplies = [
 ['title' => '🔙 Retour au menu', 'payload' => 'retour_menu'],
 ];
 if ($this->getUnlockedChildren($parent)->count() > 1) {
 $quickReplies[] = ['title' => '👶 Changer enfant', 'payload' => 'changer enfant'];
 }
 $this->sendText($conv, "Aucune donnée n'est disponible pour le moment.", $quickReplies);
 return;
 }

 $finalText = $preview['text'];

 if ($action === 'nouveautes') {
 $data = $conv->state_data ?? [];
 $conv->setState($conv->state, array_merge($data, ['last_news_seen_at' => now()->toDateTimeString()]));
 }

 $url = $magic->generateUrl($parent, $action === 'nouveautes' ? 'news' : $action, $eleve->id);

 $this->sendText($conv, $finalText, [], [
 'type' => 'cta_url',
 'body' => ['text' => $finalText],
 'action' => [
 'name' => 'cta_url',
 'parameters' => [
 'display_text' => $preview['btn_label'],
 'url' => $url,
 ],
 ],
 ]);

 $afterButtons = [
 ['title' => '🔙 Retour au menu', 'payload' => 'retour_menu'],
 ];

 if ($this->getUnlockedChildren($parent)->count() > 1) {
 $afterButtons[] = ['title' => '👶 Changer enfant', 'payload' => 'changer enfant'];
 }

 $prof = $this->findProfByPhone([$conv->participant_phone]);
 if ($prof && count($afterButtons) < 3) {
 $afterButtons[] = ['title' => '👨‍🏫 Mode Prof', 'payload' => 'role_prof'];
 }

 $this->queueSend($conv, "Que faire d'autre pour *{$eleve->prenom}* ?", $afterButtons);
 }

 private function buildNotesPreview(Eleve $eleve, ?\App\Models\AnneeScolaire $anneeActive): ?array
 {
 $notes = Note::where('eleve_id', $eleve->id)
            ->when($anneeActive, fn($q) => $q->whereHas('evaluation', fn($eq) => $eq->where('annee_scolaire_id', $anneeActive->id)))
            ->with('evaluation.matiere', 'evaluation.periode')
            ->latest('id')
            ->limit(6)
            ->get();

 if ($notes->isEmpty()) return null;

 $lines = ["📝 *Dernières notes de {$eleve->prenom}* :\n"];

 foreach ($notes as $note) {
 $matiere = $note->evaluation?->matiere?->libelle ?? '—';
 $type = $note->evaluation?->type ?? '';
 $titre = $note->evaluation?->titre ?? '';
 $noteSur = $note->evaluation?->note_sur ?? 20;
 $date = $note->evaluation?->date
 ? \Illuminate\Support\Carbon::parse($note->evaluation->date)->format('d/m/Y')
 : '';
 $appreciation = $note->appreciation ? "\n _{$note->appreciation}_" : '';

 $label = $titre ?: ucfirst(str_replace('_', ' ', $type)) . ' en ' . $matiere;
 $lines[] = "• *{$label}*";
 if ($date) $lines[count($lines) - 1] .= ", le {$date}";
 $lines[] = " Note : {$note->note}/{$noteSur}";
 if ($appreciation) $lines[] = $appreciation;
 }

 $lines[] = "\n💡 Cliquez ci-dessous pour consulter toutes les notes.";

 $raw = $notes->map(fn ($n) => [
 'matiere' => $n->evaluation?->matiere?->libelle ?? '—',
 'type' => $n->evaluation?->type ?? '',
 'titre' => $n->evaluation?->titre ?? '',
 'note' => $n->note,
 'sur' => $n->evaluation?->note_sur ?? 20,
 'date' => $n->evaluation?->date ?? '',
 'appreciation' => $n->appreciation,
 ])->toArray();

 return [
 'text' => implode("\n", $lines),
 'btn_label' => 'Notes',
 'raw' => $raw,
 ];
 }

 private function buildAbsencesPreview(Eleve $eleve): ?array
 {
 $absences = Presence::where('eleve_id', $eleve->id)
 ->where('est_present', false)
 ->latest('date')
 ->limit(3)
 ->get();

 if ($absences->isEmpty()) {
 return [
 'text' => "✅ *Absences de {$eleve->prenom}*\n\nAucune absence enregistrée. Bravo, votre enfant est assidu !",
 'btn_label' => 'Voir absences',
 ];
 }

 $lines = ["⏰ *Dernières absences de {$eleve->prenom}* :\n"];

 foreach ($absences as $abs) {
 $date = is_string($abs->date)
 ? \Illuminate\Support\Carbon::parse($abs->date)->format('d/m/Y')
 : ($abs->date?->format('d/m/Y') ?? '');
 $heure = $abs->heure_debut ? " à " . substr($abs->heure_debut, 0, 5) : '';
 $remarque = $abs->remarque ? " — {$abs->remarque}" : '';

 $lines[] = "• Le *{$date}*{$heure}{$remarque}";
 }

 $lines[] = "\n💡 Cliquez ci-dessous pour consulter l'historique complet.";

 $raw = $absences->map(fn ($a) => [
 'date' => is_string($a->date) ? \Illuminate\Support\Carbon::parse($a->date)->format('d/m/Y') : ($a->date?->format('d/m/Y') ?? ''),
 'heure' => substr($a->heure_debut ?? '', 0, 5),
 'remarque' => $a->remarque,
 ])->toArray();

 return [
 'text' => implode("\n", $lines),
 'btn_label' => 'Absences',
 'raw' => $raw,
 ];
 }

 private function buildFraisPreview(Eleve $eleve): ?array
 {
 $subscription = Subscription::where('eleve_id', $eleve->id)
 ->whereHas('anneeScolaire', fn($q) => $q->where('active', true))
 ->with('payments')
 ->first();

 if (!$subscription) return null;

 $frais = $subscription->classe?->fraisClasses?->pluck('frais') ?? collect();
 $ecolage = $subscription->montant_mensuel ?? 0;
 $scolaritePaye = $subscription->payments->where('type', 'scolarite')->sum('montant');
 $resteEcolage = max(0, $ecolage - $scolaritePaye);

 $lines = ["💰 *Frais de {$eleve->prenom}* :\n"];

 // Ecolage
 $lines[] = "🎓 *Écolage (scolarité) :*";
 $lines[] = "• Montant : *" . number_format($ecolage, 0, ',', ' ') . " FCFA*";
 $lines[] = "• Payé : " . number_format($scolaritePaye, 0, ',', ' ') . " FCFA — reste : " . ($resteEcolage <= 0 ? '✅' : number_format($resteEcolage, 0, ',', ' ') . " FCFA");

 // Frais annexes
 if ($frais->isNotEmpty()) {
 $lines[] = "\n📋 *Frais de l'établissement :*";
 $totalFraisPaye = 0;
 foreach ($frais->take(5) as $f) {
 $paye = $subscription->payments->where('type', 'frais')->where('frais_id', $f->id)->sum('montant');
 $totalFraisPaye += $paye;
 $reste = max(0, $f->montant - $paye);
 $statut = $reste <= 0 ? '✅' : number_format($reste, 0, ',', ' ') . " FCFA";
 $lines[] = "• {$f->libelle} : *" . number_format($f->montant, 0, ',', ' ') . " FCFA* (payé : " . number_format($paye, 0, ',', ' ') . " FCFA — reste : {$statut})";
 }
 $totalFrais = $frais->sum('montant');
 $resteFrais = max(0, $totalFrais - $totalFraisPaye);
 $lines[] = "\n💵 Total frais payé : *" . number_format($totalFraisPaye, 0, ',', ' ') . " FCFA*";
 $lines[] = "💵 Total frais restant : *" . number_format($resteFrais, 0, ',', ' ') . " FCFA*";
 }

 $totalRestant = $resteEcolage + ($frais->isNotEmpty() ? max(0, $frais->sum('montant') - $subscription->payments->where('type', 'frais')->sum('montant')) : 0);
 $lines[] = "\n💳 *Total restant à payer : " . number_format($totalRestant, 0, ',', ' ') . " FCFA*";

 $lines[] = "\n💡 Cliquez ci-dessous pour voir le détail complet.";

 $raw = [
 'ecolage' => $ecolage,
 'ecolage_paye' => $scolaritePaye,
 'ecolage_reste' => $resteEcolage,
 ];

 return [
 'text' => implode("\n", $lines),
 'btn_label' => 'Frais',
 'raw' => $raw,
 ];
 }

 private function buildEmploiPreview(Eleve $eleve, ?\App\Models\AnneeScolaire $anneeActive): ?array
 {
 $jourActuel = \Illuminate\Support\Carbon::now()->locale('fr')->isoFormat('dddd');
 $jourActuel = strtolower($jourActuel);

 $edt = EmploiDuTemps::where('classe_id', $eleve->classe_id)
 ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
 ->whereRaw("LOWER(jour) = ?", [$jourActuel])
 ->with('matiere')
 ->orderBy('heure_debut')
 ->limit(5)
 ->get();

 if ($edt->isEmpty()) {
 $raw = ['jour' => $jourActuel, 'cours' => []];
 return [
 'text' => "📅 *Emploi du temps de {$eleve->prenom}*\n\nPas de cours prévu aujourd'hui ({$jourActuel}).",
 'btn_label' => "Emploi du temps",
 'raw' => $raw,
 ];
 }

 $lines = ["📅 *Aujourd'hui ({$jourActuel}) — {$eleve->prenom}* :\n"];
 $rawCours = [];

 foreach ($edt as $cours) {
 $matiere = $cours->matiere?->libelle ?? '—';
 $heure = $cours->heure_debut ? substr($cours->heure_debut, 0, 5) : '';
 $lines[] = "• {$heure} — *{$matiere}*";
 $rawCours[] = ['heure' => $heure, 'matiere' => $matiere];
 }

 $lines[] = "\n💡 Cliquez ci-dessous pour voir l'emploi complet de la semaine.";

 return [
 'text' => implode("\n", $lines),
 'btn_label' => "Emploi complet",
 'raw' => ['jour' => $jourActuel, 'cours' => $rawCours],
 ];
 }

 private function buildNouveautesPreview(Eleve $eleve, ?\App\Models\AnneeScolaire $anneeActive): ?array
 {
 $school = $eleve->school;
 $eleveClasse = $eleve->eleveClasses()->where('annee_scolaire_id', $anneeActive?->id)->first();
 $classeId = $eleveClasse?->classe_id;

 $since = now()->subDays(30);

 $nbNotes = Note::where('eleve_id', $eleve->id)
 ->when($anneeActive, fn($q) => $q->whereHas('evaluation', fn($eq) => $eq->where('annee_scolaire_id', $anneeActive->id)))
 ->where('created_at', '>=', $since)
 ->count();

 $nbAbsences = Presence::where('eleve_id', $eleve->id)
 ->where('est_present', false)
 ->where('date', '>=', $since->toDateString())
 ->count();

 $nbAnnonces = Annonce::where('school_id', $school->id)
 ->where('publie', true)
 ->when($classeId, fn($q) => $q->where(fn($q2) => $q2->where('classe_id', $classeId)->orWhereNull('classe_id')))
 ->where('created_at', '>=', $since)
 ->count();

 $nbMessages = Message::whereHas('conversation', fn($q) => $q->where('eleve_id', $eleve->id))
 ->where('lu', false)
 ->count();

 $nbExamens = Evaluation::where('classe_id', $eleve->classe_id)
 ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
 ->where('date', '>=', now()->toDateString())
 ->where('created_at', '>=', $since)
 ->count();

 $nbRemarques = Remarque::where('eleve_id', $eleve->id)
 ->where('visible_parent', true)
 ->where('created_at', '>=', $since)
 ->count();

 $nbPaiements = SubscriptionPayment::whereHas('subscription', fn($q) => $q->where('eleve_id', $eleve->id))
 ->where('created_at', '>=', $since)
 ->count();

 $totalNew = $nbNotes + $nbAbsences + $nbAnnonces + $nbMessages + $nbExamens + $nbRemarques + $nbPaiements;

 if ($totalNew === 0) {
 return [
 'text' => "🔔 *Nouveautés de {$eleve->prenom}*\n\nRien de nouveau ces 30 derniers jours.",
 'btn_label' => 'Nouveautes',
 'raw' => [],
 ];
 }

 $lines = ["🔔 *Nouveautés — {$eleve->prenom}* :\n"];

 if ($nbNotes > 0) {
 $lastNote = Note::where('eleve_id', $eleve->id)
 ->when($anneeActive, fn($q) => $q->whereHas('evaluation', fn($eq) => $eq->where('annee_scolaire_id', $anneeActive->id)))
 ->with('evaluation.matiere')
 ->latest('id')
 ->first();
 $matiere = $lastNote?->evaluation?->matiere?->libelle ?? '';
 $lines[] = "📝 *{$nbNotes}* nouvelle(s) note(s)";
 if ($matiere) $lines[] = " Dernière : {$matiere} — {$lastNote->note}/" . ($lastNote->evaluation?->note_sur ?? 20);
 }

 if ($nbAbsences > 0) {
 $lines[] = "⏰ *{$nbAbsences}* absence(s) récente(s)";
 }

 if ($nbExamens > 0) {
 $nextExam = Evaluation::where('classe_id', $eleve->classe_id)
 ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
 ->where('date', '>=', now()->toDateString())
 ->with('matiere')
 ->orderBy('date')
 ->first();
 $lines[] = "📋 *{$nbExamens}* examen(s) à venir";
 if ($nextExam) {
 $date = \Carbon\Carbon::parse($nextExam->date)->format('d/m');
 $matiere = $nextExam->matiere?->libelle ?? '';
 $lines[] = " Prochain : {$nextExam->titre} ({$matiere}) — {$date}";
 }
 }

 if ($nbAnnonces > 0) {
 $lines[] = "📢 *{$nbAnnonces}* annonce(s) de l'administration";
 }

 if ($nbRemarques > 0) {
 $lines[] = "📝 *{$nbRemarques}* remarque(s) de professeur(s)";
 }

 if ($nbPaiements > 0) {
 $lines[] = "💳 *{$nbPaiements}* paiement(s) enregistré(s)";
 }

 if ($nbMessages > 0) {
 $lines[] = "💬 *{$nbMessages}* message(s) non lu(s)";
 }

 $lines[] = "\n💡 Cliquez ci-dessous pour tout voir.";

 $raw = [
 'nb_notes' => $nbNotes,
 'nb_absences' => $nbAbsences,
 'nb_examens' => $nbExamens,
 'nb_annonces' => $nbAnnonces,
 'nb_remarques' => $nbRemarques,
 'nb_paiements' => $nbPaiements,
 'nb_messages' => $nbMessages,
 ];

 return [
 'text' => implode("\n", $lines),
 'btn_label' => 'Nouveautes',
 'raw' => $raw,
 ];
 }

 private function buildProfsPreview(Eleve $eleve): ?array
 {
 $profs = \App\Models\Prof::whereHas('affectations', fn($q) => $q->where('classe_id', $eleve->classe_id))
 ->with('affectations.matiere')
 ->limit(5)
 ->get();

 if ($profs->isEmpty()) return null;

 $lines = ["👨‍🏫 *Enseignants de {$eleve->prenom}* :\n"];
 $rawProfs = [];

 foreach ($profs as $prof) {
 $matieres = $prof->affectations->pluck('matiere.libelle')->filter()->implode(', ');
 $nom = trim($prof->prenom . ' ' . $prof->nom);
 $lines[] = "• *{$nom}*";
 if ($matieres) $lines[] = " {$matieres}";
 $rawProfs[] = ['nom' => $nom, 'matieres' => $matieres];
 }

 $lines[] = "\n💡 Cliquez ci-dessous pour voir tous les enseignants.";

 return [
 'text' => implode("\n", $lines),
 'btn_label' => 'Enseignants',
 'raw' => $rawProfs,
 ];
 }

 private function buildAnnoncesPreview(Eleve $eleve): ?array
 {
 $annonces = Annonce::where('school_id', $eleve->school_id)
 ->where('publie', true)
 ->where(function ($q) use ($eleve) {
 $q->whereNull('classe_id')->orWhere('classe_id', $eleve->classe_id);
 })
 ->latest()
 ->limit(3)
 ->get();

 if ($annonces->isEmpty()) {
 return [
 'text' => "📢 *Annonces*\n\nAucune annonce publiée pour le moment.",
 'btn_label' => 'Annonces',
 'raw' => [],
 ];
 }

 $lines = ["📢 *Dernières annonces* :\n"];
 $rawAnnonces = [];

 foreach ($annonces as $annonce) {
 $date = $annonce->created_at?->format('d/m');
 $lines[] = "• *{$annonce->titre}*";
 if ($date) $lines[] = " {$date}";
 $rawAnnonces[] = ['titre' => $annonce->titre, 'date' => $date];
 }

 $lines[] = "\n💡 Cliquez ci-dessous pour tout consulter.";

 return [
 'text' => implode("\n", $lines),
 'btn_label' => 'Annonces',
 'raw' => $rawAnnonces,
 ];
 }

 private function buildPaiementsPreview(Eleve $eleve): ?array
 {
 $subscription = Subscription::where('eleve_id', $eleve->id)
 ->whereHas('anneeScolaire', fn($q) => $q->where('active', true))
 ->first();

 $payments = SubscriptionPayment::where('subscription_id', $subscription?->id ?? 0)
 ->with('frais')
 ->latest()
 ->limit(3)
 ->get();

 if ($payments->isEmpty()) {
 return [
 'text' => "💳 *Paiements de {$eleve->prenom}*\n\nAucun paiement enregistré pour le moment.",
 'btn_label' => 'Paiements',
 'raw' => [],
 ];
 }

 $lines = ["💳 *Derniers paiements de {$eleve->prenom}* :\n"];
 $rawPaiements = [];

 foreach ($payments as $p) {
 $label = match($p->type) {
 'scolarite' => 'Écolage',
 'frais' => $p->frais?->libelle ?? 'Frais',
 'abonnement' => 'Abonnement',
 default => $p->type ?? '',
 };
 $lines[] = "• *" . number_format($p->montant, 0, ',', ' ') . " FCFA* — {$label}";
 $lines[] = " {$p->created_at?->format('d/m/Y')}";
 $rawPaiements[] = ['montant' => $p->montant, 'frais' => $label, 'date' => $p->created_at?->format('d/m/Y')];
 }

 $lines[] = "\n💡 Cliquez ci-dessous pour voir l'historique complet.";

 return [
 'text' => implode("\n", $lines),
 'btn_label' => 'Paiements',
 'raw' => $rawPaiements,
 ];
 }

 private function buildRemarquesPreview(Eleve $eleve): ?array
 {
 $remarques = Remarque::where('eleve_id', $eleve->id)
 ->where('visible_parent', true)
 ->with('prof')
 ->latest('id')
 ->limit(3)
 ->get();

 if ($remarques->isEmpty()) {
 return [
 'text' => "📝 *Remarques de {$eleve->prenom}*\n\nAucune remarque pour le moment.",
 'btn_label' => 'Remarques',
 'raw' => [],
 ];
 }
 $lines = ["📝 *Dernières remarques de {$eleve->prenom}* :\n"];

 foreach ($remarques as $r) {
 $prof = $r->prof;
 $profNom = $prof ? "{$prof->prenom} {$prof->nom}" : '—';
 $date = $r->created_at->format('d/m');
 $lines[] = "• *{$profNom}* ({$date})";
 $lines[] = " {$r->contenu}";
 }

 $lines[] = "\n💡 Cliquez ci-dessous pour voir toutes les remarques.";

 return [
 'text' => implode("\n", $lines),
 'btn_label' => 'Remarques',
 'raw' => [],
 ];
 }

 private function buildExamensPreview(Eleve $eleve, ?\App\Models\AnneeScolaire $anneeActive): ?array
 {
 $examens = Evaluation::where('classe_id', $eleve->classe_id)
 ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
 ->where('date', '>=', now()->toDateString())
 ->with('matiere')
 ->orderBy('date')
 ->limit(3)
 ->get();

 if ($examens->isEmpty()) {
 return [
 'text' => "📋 *Examens de {$eleve->prenom}*\n\nAucun examen prévu pour le moment.",
 'btn_label' => 'Examens',
 'raw' => [],
 ];
 }

 $lines = ["📋 *Examens à venir — {$eleve->prenom}* :\n"];

 foreach ($examens as $exam) {
 $matiere = $exam->matiere?->libelle ?? '—';
 $date = \Carbon\Carbon::parse($exam->date)->format('d/m');
 $type = ucfirst(str_replace('_', ' ', $exam->type));
 $lines[] = "• *{$exam->titre}* ({$type})";
 $lines[] = " 📚 {$matiere} — 📅 {$date}";
 }

 $lines[] = "\n💡 Cliquez ci-dessous pour voir tous les examens.";

 return [
 'text' => implode("\n", $lines),
 'btn_label' => 'Examens',
 'raw' => [],
 ];
 }

 private function sendText(WhatsAppConversation $conv, string $message, array $quickReplies = [], ?array $interactive = null): void
 {
 $this->queueSend($conv, $message, $quickReplies, $interactive);
 }

 private function queueSend(WhatsAppConversation $conv, string $message, array $quickReplies = [], ?array $interactive = null): void
 {
 SendZernioMessage::dispatch(
 $conv->id,
 $conv->zernio_conversation_id,
 $conv->account_id,
 $message,
 $quickReplies,
 $interactive
 );

 $this->spawnWorkerOnce();
 }

 private function sendMarketingMessage(WhatsAppConversation $conv): void
 {
 $message = "👋 Bonjour, et merci de nous avoir contactés !\n\n";
 $message .= "Il semble que l'école de votre enfant n'utilise pas encore *ClassiNote*.\n\n";
 $message .= "Avec *ClassiNote*, les parents peuvent facilement :\n";
 $message .= "📊 Consulter les notes\n";
 $message .= "📅 Voir l'emploi du temps\n";
 $message .= "⏰ Suivre les absences et retards\n";
 $message .= "💬 Échanger avec les enseignants\n";
 $message .= "💰 Suivre les paiements scolaires\n\n";
 $message .= "💵 *Tarif :* seulement *1 000 FCFA / mois* par enfant\n\n";
 $message .= "💡 Vous aimeriez que l'école de votre enfant propose ce service aux parents ?";

 $this->sendText($conv, $message, [
 ['title' => '🧪 Tester ClassiNote', 'payload' => 'tester_demo'],
 ['title' => '📩 Contacter l\'école', 'payload' => 'contacter_ecole'],
 ]);

 $conv->setState('pending_marketing_reply');
 }

 private function handleDemoRequest(WhatsAppConversation $conv, string $norm, ?string $state): void
 {
 if ($state === 'awaiting_demo_confirm') {
 if ($this->isYes($norm)) {
 $this->createDemoAccount($conv);
 $conv->resetState();
 return;
 }
 if ($this->isNo($norm)) {
 $this->sendText($conv, "Pas de souci 👍\n\nN'hésitez pas à revenir si vous changer d'avis !");
 $conv->resetState();
 return;
 }
 }

 $message = "🧪 *Testez ClassiNote avec des données fictives*\n\n";
 $message .= "Vous pouvez découvrirComment ClassiNote fonctionne avec un compte de démonstration.\n\n";
 $message .= "📋 *Ce que vous verrez :*\n";
 $message .= "• Notes de 3 matières\n";
 $message .= "• Emploi du temps\n";
 $message .= "• Absences fictives\n";
 $message .= "• Frais scolaires\n\n";
 $message .= "⏰ *Important :* Ce compte et toutes les données seront automatiquement supprimés dans *1 heure*.\n\n";
 $message .= "Voulez-vous essayer ?";

 $this->sendText($conv, $message, [
 ['title' => '✅ Oui, j\'essaie', 'payload' => 'demo_confirm'],
 ['title' => '❌ Non, merci', 'payload' => 'demo_cancel'],
 ]);

 $conv->setState('awaiting_demo_confirm');
 }

 private function handleDemoFeedback(WhatsAppConversation $conv, ParentModel $parent, string $norm, ?string $state): void
 {
 if ($norm === 'demo_feedback_positive' || preg_match('/aimé|bien|super|top|génial|parfait|excellent/i', $norm)) {
 $url = 'whatsapp://send?text=' . rawurlencode(
 "Bonjour, je souhaiterais que l'école utilise ClassiNote afin de faciliter le suivi scolaire et la communication entre les parents et l'établissement.\n\nhttps://classinote.com"
 );

 $message = "🎉 *Merci pour votre retour positif !*\n\n";
 $message .= "N'hésitez pas à en parler à l'administration de l'école de votre enfant.\n\n";
 $message .= "Vous pouvez aussi leur envoyer ce message directement :";

 $this->sendText($conv, $message, [], [
 'type' => 'cta_url',
 'body' => ['text' => $message],
 'action' => [
 'name' => 'cta_url',
 'parameters' => [
 'display_text' => 'Envoyer à l\'école',
 'url' => $url,
 ],
 ],
 ]);

 \App\Jobs\CleanExpiredDemo::dispatch($parent->id)->delay(now()->addMinutes(5));
 $conv->resetState();
 return;
 }

 if ($norm === 'demo_feedback_comment' || $norm === 'retour_menu') {
 $message = "💬 *Merci pour votre retour !*\n\n";
 $message .= "Votre avis est important pour nous. N'hésitez pas à nous faire part de vos remarques ou suggestions.\n\n";
 $message .= "Nous vous répondrons dans les plus brefs délais.";

 $this->sendText($conv, $message);
 \App\Jobs\CleanExpiredDemo::dispatch($parent->id)->delay(now()->addMinutes(5));
 $conv->resetState();
 return;
 }

 $message = "Merci pour votre message ! Votre retour est important pour nous.\n\n";
 $message .= "Si vous avez des questions ou des remarques, n'hésitez pas à les écrire ici.";

 $this->sendText($conv, $message);
 $conv->resetState();
 }

 private function createDemoAccount(WhatsAppConversation $conv): void
 {
 try {
 $this->doCreateDemoAccount($conv);
 } catch (\Throwable $e) {
 Log::error('Zernio: erreur création compte démo', [
 'message' => $e->getMessage(),
 'file' => $e->getFile(),
 'line' => $e->getLine(),
 ]);
 $this->sendText($conv, "❌ Une erreur est survenue lors de la création du compte démo.", [
 ['title' => '🔄 Réessayer', 'payload' => 'tester_demo'],
 ['title' => '📩 Contacter le support', 'payload' => 'contacter_ecole'],
 ]);
 $conv->resetState();
 }
 }

 private function doCreateDemoAccount(WhatsAppConversation $conv): void
 {
 $school = \App\Models\School::first();
 if (!$school) {
 $this->sendText($conv, "❌ Erreur lors de la création du compte démo.");
 return;
 }

 $annee = $school->anneesScolaires()->where('active', true)->first();
 if (!$annee) {
 $this->sendText($conv, "❌ Aucune année scolaire active.");
 return;
 }

 $classes = $school->classes()->where('annee_scolaire_id', $annee->id)->take(2)->get();
 if ($classes->isEmpty()) {
 $this->sendText($conv, "❌ Aucune classe disponible.");
 return;
 }

 $classe1 = $classes[0];
 $classe2 = $classes[1] ?? $classes[0];

 $phone = $conv->participant_phone ?? 'demo_' . time();
 $code = strtoupper(Str::random(4) . '-' . Str::random(4));

 $parent = ParentModel::create([
 'telephone' => $phone,
 'code' => $code,
 'active' => true,
 'whatsapp_activated' => true,
 'is_demo' => true,
 'demo_expires_at' => now()->addHour(),
 ]);

 $enfants = [
 ['nom' => 'Dupont', 'prenom' => 'Amina', 'sexe' => 'F', 'age' => 12, 'classe' => $classe1],
 ['nom' => 'Dupont', 'prenom' => 'Kofi', 'sexe' => 'M', 'age' => 10, 'classe' => $classe2],
 ];

 $matieres = $school->matieres()->take(5)->get();
 $periode = $annee->periodes()->first();
 $admin = $school->admins()->first();
 $profs = $school->profs()->take(2)->get();

 $evalTypes = [
 ['type' => 'composition', 'titre' => 'Composition du 1er trimestre'],
 ['type' => 'interrogation', 'titre' => 'Interrogation'],
 ['type' => 'devoir_surveille', 'titre' => 'Devoir surveillé du 1er semestre'],
 ['type' => 'composition', 'titre' => 'Composition du 2ème trimestre'],
 ['type' => 'interrogation', 'titre' => 'Interrogation surprise'],
 ];

 foreach ($enfants as $enfant) {
 $classe = $enfant['classe'];

 $eleve = Eleve::create([
 'school_id' => $school->id,
 'classe_id' => $classe->id,
 'nom' => $enfant['nom'],
 'prenom' => $enfant['prenom'],
 'date_naissance' => now()->subYears($enfant['age'])->toDateString(),
 'matricule' => 'DEMO-' . strtoupper(Str::random(6)),
 'sexe' => $enfant['sexe'],
 'active' => true,
 ]);

 $eleve->parents()->attach($parent->id);

 \App\Models\EleveClasse::updateOrCreate(
 ['eleve_id' => $eleve->id, 'annee_scolaire_id' => $annee->id],
 ['classe_id' => $classe->id]
 );

 $subscription = Subscription::updateOrCreate(
 ['eleve_id' => $eleve->id, 'annee_scolaire_id' => $annee->id],
 ['classe_id' => $classe->id, 'inscrit' => true, 'montant_mensuel' => 25000]
 );

 // Notes
 if ($matieres->isNotEmpty() && $periode) {
 foreach ($matieres as $i => $matiere) {
 $evalInfo = $evalTypes[$i % count($evalTypes)];
 $eval = Evaluation::create([
 'school_id' => $school->id,
 'classe_id' => $classe->id,
 'matiere_id' => $matiere->id,
 'periode_id' => $periode->id,
 'annee_scolaire_id' => $annee->id,
 'titre' => $evalInfo['titre'] . ' en ' . $matiere->libelle,
 'type' => $evalInfo['type'],
 'date' => now()->subDays(rand(1, 45))->toDateString(),
 'coefficient' => rand(1, 3),
 'note_sur' => 20,
 ]);

 Note::create([
 'evaluation_id' => $eval->id,
 'eleve_id' => $eleve->id,
 'note' => rand(80, 180) / 10,
 'appreciation' => ['Très bien', 'Bien', 'Passable', 'Assez bien', 'Excellent'][rand(0, 4)],
 ]);
 }

 // Examens à venir
 if ($matieres->count() >= 2) {
 Evaluation::create([
 'school_id' => $school->id,
 'classe_id' => $classe->id,
 'matiere_id' => $matieres[0]->id,
 'periode_id' => $periode->id,
 'annee_scolaire_id' => $annee->id,
 'titre' => 'Composition du 3ème trimestre en ' . $matieres[0]->libelle,
 'type' => 'composition',
 'date' => now()->addDays(10)->toDateString(),
 'coefficient' => 2,
 'note_sur' => 20,
 ]);

 Evaluation::create([
 'school_id' => $school->id,
 'classe_id' => $classe->id,
 'matiere_id' => $matieres[1]->id,
 'periode_id' => $periode->id,
 'annee_scolaire_id' => $annee->id,
 'titre' => 'Interrogation en ' . $matieres[1]->libelle,
 'type' => 'interrogation',
 'date' => now()->addDays(5)->toDateString(),
 'coefficient' => 1,
 'note_sur' => 20,
 ]);
 }
 }

 // Absences
 for ($i = 0; $i < 3; $i++) {
 Presence::create([
 'school_id' => $school->id,
 'classe_id' => $classe->id,
 'eleve_id' => $eleve->id,
 'annee_scolaire_id' => $annee->id,
 'date' => now()->subDays(rand(1, 30))->toDateString(),
 'est_present' => false,
 'remarque' => ['Absence non justifiée', 'Absence justifiée (certificat médical)', 'Retard (30 min)'][rand(0, 2)],
 ]);
 }

 // Remarques
 foreach ($profs as $prof) {
 Remarque::create([
 'eleve_id' => $eleve->id,
 'prof_id' => $prof->id,
 'school_id' => $school->id,
 'classe_id' => $classe->id,
 'type' => 'comportement',
 'contenu' => "{$enfant['prenom']} est un élève sérieux et attentif en classe. Il participe activement aux cours.",
 'visible_parent' => true,
 ]);
 }

 Remarque::create([
 'eleve_id' => $eleve->id,
 'prof_id' => $profs->first()?->id,
 'school_id' => $school->id,
 'classe_id' => $classe->id,
 'type' => 'academique',
 'contenu' => "{$enfant['prenom']} doit fournir plus d'efforts en mathématiques. Des exercices supplémentaires sont recommandés.",
 'visible_parent' => true,
 ]);

 // Frais
 $fraisItems = [
 ['libelle' => 'Scolarité', 'type' => 'scolarite', 'montant' => 75000],
 ['libelle' => 'Frais d\'inscription', 'type' => 'inscription', 'montant' => 15000],
 ['libelle' => 'Assurance scolaire', 'type' => 'assurance', 'montant' => 5000],
 ['libelle' => 'Uniforme scolaire', 'type' => 'tenue', 'montant' => 12000],
 ];

 $createdFrais = [];
 foreach ($fraisItems as $fraisData) {
 $frais = Frais::create([
 'school_id' => $school->id,
 'libelle' => $fraisData['libelle'],
 'type' => $fraisData['type'],
 'montant' => $fraisData['montant'],
 'actif' => true,
 ]);
 $frais->classes()->attach($classe->id);
 $createdFrais[] = $frais;
 }

 // Paiements
 $paiements = [
 ['frais_index' => 0, 'montant' => 50000],
 ['frais_index' => 0, 'montant' => 25000],
 ['frais_index' => 1, 'montant' => 15000],
 ['frais_index' => 3, 'montant' => 12000],
 ];

 foreach ($paiements as $paiement) {
 $f = $createdFrais[$paiement['frais_index']] ?? null;
 if ($f) {
 SubscriptionPayment::create([
 'subscription_id' => $subscription->id,
 'frais_id' => $f->id,
 'montant' => $paiement['montant'],
 'type' => 'frais',
 'methode_paiement' => 'especes',
 ]);
 }
 }
 }
 // Annonces
 if ($admin) {
 Annonce::create([
 'school_id' => $school->id,
 'user_id' => $admin->id,
 'titre' => 'Réunion parents-professeurs',
 'contenu' => 'Une réunion parents-professeurs est prévue le 25 août à 15h dans la salle de conférence. Votre présence est souhaitée.',
 'type' => 'info',
 'publie' => true,
 ]);

 Annonce::create([
 'school_id' => $school->id,
 'user_id' => $admin->id,
 'titre' => 'Fête de fin d\'année',
 'contenu' => 'La cérémonie de remise des bulletins aura lieu le 30 juin à 9h. Tous les parents sont invités.',
                'type' => 'info',
 'publie' => true,
 ]);
 }

        $conv->resetState();
        $this->sendText($conv, "✅ *Compte démo créé !*\n\n👤 *Amina Dupont* — {$classe1->libelle}\n👤 *Kofi Dupont* — {$classe2->libelle}\n\n📊 Notes, absences, examens à venir, remarques, annonces, frais et paiements générés.\n\n⏰ Ce compte expire dans *1 heure*.\n\nEnvoyez *menu* pour explorer !", [
            ['title' => '📋 Menu', 'payload' => 'menu'],
            ['title' => '📩 Contacter l\'école', 'payload' => 'contacter_ecole'],
        ]);

        $this->dispatchDemoCleanup($parent->id);
    }

 private function dispatchDemoCleanup(int $parentId): void
 {
 try {
 \App\Jobs\DemoFollowUp::dispatch($parentId)->delay(now()->addHour());
 } catch (\Throwable $e) {
 Log::warning('Zernio: impossible de planifier le suivi démo', ['message' => $e->getMessage()]);
 }

 try {
 $cmd = sprintf(
 'start /B "" %s %s demo:cleanup --parent_id=%d > NUL 2>&1',
 escapeshellarg(config('zernio.php_binary')),
 escapeshellarg(base_path('artisan')),
 $parentId
 );
 pclose(popen($cmd, 'r'));
 } catch (\Throwable $e) {
 Log::warning('Zernio: impossible de planifier le nettoyage démo', ['message' => $e->getMessage()]);
 }
 }

 private function spawnWorkerOnce(): void
 {
 if ($this->workerSpawned) {
 return;
 }

 $this->workerSpawned = true;

 try {
 $cmd = sprintf(
 'start /B "" %s %s queue:work --stop-when-empty --max-time=120 > NUL 2>&1',
 escapeshellarg(config('zernio.php_binary')),
 escapeshellarg(base_path('artisan'))
 );

 pclose(popen($cmd, 'r'));
 } catch (\Throwable $e) {
 Log::warning('Zernio: impossible de lancer le worker de queue', ['message' => $e->getMessage()]);
 }
 }

 private function formatNotes(ParentModel $parent, ?int $eleveId = null): string
 {
 $eleveIds = $this->getUnlockedEleveIds($parent, $eleveId);
 $anneeActive = $this->getAnneeActive($parent);

 if (empty($eleveIds)) {
 return "📊 Aucune note disponible pour le moment.\n\nRépondez « menu » pour revenir au menu.";
 }

 $notes = Note::whereIn('eleve_id', $eleveIds)
 ->when($anneeActive, fn($q) => $q->whereHas('evaluation', fn($eq) => $eq->where('annee_scolaire_id', $anneeActive->id)))
 ->with('evaluation.matiere', 'evaluation.periode', 'eleve')
 ->latest('id')
 ->limit(30)
 ->get();

 if ($notes->isEmpty()) {
 return "📊 Aucune note disponible pour le moment.\n\nRépondez « menu » pour revenir au menu.";
 }

 $lines = ["📊 *Vos notes les plus récentes* :"];
 $currentEleve = null;

 foreach ($notes as $note) {
 $eleve = $note->eleve;
 $matiere = $note->evaluation?->matiere?->libelle ?? '—';
 $periode = $note->evaluation?->periode?->libelle ?? '';
 $noteSur = $note->evaluation?->note_sur ?? 20;

 if ($eleve && $eleve->nom_complet !== $currentEleve) {
 $currentEleve = $eleve->nom_complet;
 $lines[] = "\n👦 *{$currentEleve}*";
 }

 $ligne = "• {$matiere} : *{$note->note}/{$noteSur}*";
 if ($periode) $ligne .= " ({$periode})";
 if ($note->appreciation) $ligne .= "\n {$note->appreciation}";
 $lines[] = $ligne;
 }

 $lines[] = "\nRépondez « menu » pour revenir au menu.";
 return implode("\n", $lines);
 }

 private function formatRemarques(ParentModel $parent, ?int $eleveId = null): string
 {
 $eleveIds = $this->getUnlockedEleveIds($parent, $eleveId);

 if (empty($eleveIds)) {
 return "📝 Aucune remarque disponible pour le moment.\n\nRépondez « menu » pour revenir au menu.";
 }

 $remarques = Remarque::whereIn('eleve_id', $eleveIds)
 ->where('visible_parent', true)
 ->with('prof', 'eleve')
 ->latest('id')
 ->limit(10)
 ->get();

 if ($remarques->isEmpty()) {
 return "📝 Aucune remarque disponible pour le moment.\n\nRépondez « menu » pour revenir au menu.";
 }

 $lines = ["📝 *Dernières remarques des professeurs* :"];
 $currentEleve = null;

 foreach ($remarques as $remarque) {
 $eleve = $remarque->eleve;
 $prof = $remarque->prof;
 $profNom = $prof ? "M. {$prof->prenom} {$prof->nom}" : '—';
 $date = $remarque->created_at->format('d/m/Y');

 if ($eleve && $eleve->nom_complet !== $currentEleve) {
 $currentEleve = $eleve->nom_complet;
 $lines[] = "\n👦 *{$currentEleve}*";
 }

 $lines[] = "• *{$profNom}* ({$date})\n {$remarque->contenu}";
 }

 $lines[] = "\nRépondez « menu » pour revenir au menu.";
 return implode("\n", $lines);
 }

 private function formatExamens(ParentModel $parent, ?int $eleveId = null): string
 {
 $eleveIds = $this->getUnlockedEleveIds($parent, $eleveId);
 $anneeActive = $this->getAnneeActive($parent);

 if (empty($eleveIds)) {
 return "📋 Aucun examen prévu pour le moment.\n\nRépondez « menu » pour revenir au menu.";
 }

 $examens = Evaluation::whereIn('classe_id', function ($q) use ($eleveIds) {
 $q->select('classe_id')->from('eleves')->whereIn('id', $eleveIds);
 })
 ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
 ->where('date', '>=', now()->toDateString())
 ->with('matiere')
 ->orderBy('date')
 ->limit(10)
 ->get();

 if ($examens->isEmpty()) {
 return "📋 Aucun examen prévu pour le moment.\n\nRépondez « menu » pour revenir au menu.";
 }

 $lines = ["📋 *Examens à venir* :\n"];

 foreach ($examens as $exam) {
 $matiere = $exam->matiere?->libelle ?? '—';
 $date = \Carbon\Carbon::parse($exam->date)->format('d/m/Y');
 $type = ucfirst(str_replace('_', ' ', $exam->type));
 $lines[] = "• *{$exam->titre}* ({$type})";
 $lines[] = " 📚 {$matiere} — 📅 {$date}";
 }

 $lines[] = "\nRépondez « menu » pour revenir au menu.";
 return implode("\n", $lines);
 }
 private function formatEmploiDuTemps(ParentModel $parent, ?int $eleveId = null): string
 {
 $eleveIds = $this->getUnlockedEleveIds($parent, $eleveId);
 $anneeActive = $this->getAnneeActive($parent);

 if (empty($eleveIds)) {
 return "📅 Aucun emploi du temps disponible pour le moment.

Répondez « menu » pour revenir au menu.";
 }

 $classeIds = Eleve::whereIn('id', $eleveIds)->pluck('classe_id');

 $edt = EmploiDuTemps::whereIn('classe_id', $classeIds)
 ->when($anneeActive, fn($q) => $q->where('annee_scolaire_id', $anneeActive->id))
 ->with('matiere', 'prof')
 ->orderBy('jour')
 ->orderBy('heure_debut')
 ->get();

 if ($edt->isEmpty()) {
 return "📅 Aucun emploi du temps publié pour le moment.

Répondez « menu » pour revenir au menu.";
 }

 $jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
 $grouped = $edt->groupBy('jour');
 $lines = ["📅 *Emploi du temps* :"];

 foreach ($jours as $jour) {
 $creneaux = $grouped->get($jour);
 if (!$creneaux || $creneaux->isEmpty()) {
 continue;
 }

 $lines[] = "
*" . ucfirst($jour) . "*";
 foreach ($creneaux as $cours) {
 $matiere = $cours->matiere?->libelle ?? '—';
 $prof = $cours->prof ? $cours->prof->prenom . ' ' . $cours->prof->nom : '';
 $heure = substr($cours->heure_debut ?? '', 0, 5) . '-' . substr($cours->heure_fin ?? '', 0, 5);
 $ligne = "• {$heure} — {$matiere}";
 if ($prof && trim($prof) !== ' ') $ligne .= " ({$prof})";
 $lines[] = $ligne;
 }
 }

 $lines[] = "
Répondez « menu » pour revenir au menu.";
 return implode("
", $lines);
 }

 private function formatAbsences(ParentModel $parent, ?int $eleveId = null): string
 {
 $eleveIds = $this->getUnlockedEleveIds($parent, $eleveId);

 if (empty($eleveIds)) {
 return "⌛ Aucune absence enregistrée pour le moment.

Répondez « menu » pour revenir au menu.";
 }

 $presences = Presence::whereIn('eleve_id', $eleveIds)
 ->where('est_present', false)
 ->with('matiere', 'eleve')
 ->latest('date')
 ->limit(30)
 ->get();

 if ($presences->isEmpty()) {
 return "✅ Aucune absence ni retard enregistré. Bravo, votre enfant est assidu !

Répondez « menu » pour revenir au menu.";
 }

 $lines = ["⌛ *Absences / retards* :"];
 $currentEleve = null;

 foreach ($presences as $presence) {
 $eleve = $presence->eleve;
 if ($eleve && $eleve->nom_complet !== $currentEleve) {
 $currentEleve = $eleve->nom_complet;
 $lines[] = "
👦 *{$currentEleve}*";
 }

 $dateRaw = $presence->date;
 $date = is_string($dateRaw) ? \Illuminate\Support\Carbon::parse($dateRaw)->format('d/m/Y') : ($dateRaw?->format('d/m/Y') ?? '');
 $matiere = $presence->matiere?->libelle ?? '—';
 $ligne = "• {$date} — {$matiere}";
 if ($presence->remarque) $ligne .= " : {$presence->remarque}";
 $lines[] = $ligne;
 }

 $lines[] = "
Répondez « menu » pour revenir au menu.";
 return implode("
", $lines);
 }

 private function formatProfs(ParentModel $parent, ?int $eleveId = null): string
 {
 $children = $eleveId
 ? $this->getUnlockedChildren($parent)->where('id', $eleveId)->values()
 : $this->getUnlockedChildren($parent);

 $classeIds = $children->pluck('classe_id')->unique();

 if ($classeIds->isEmpty()) {
 return "👩‍🏫 Aucun enseignant trouvé pour le moment.

Répondez « menu » pour revenir au menu.";
 }

 $profs = \App\Models\Prof::whereHas('affectations', function ($q) use ($classeIds) {
 $q->whereIn('classe_id', $classeIds);
 })
 ->with('affectations.matiere', 'affectations.classe')
 ->get();

 if ($profs->isEmpty()) {
 return "👩‍🏫 Aucun enseignant trouvé pour la classe de votre enfant.

Répondez « menu » pour revenir au menu.";
 }

 $lines = ["👩‍🏫 *Les enseignants de votre enfant* :"];

 foreach ($profs as $prof) {
 $matieres = $prof->affectations->pluck('matiere.libelle')->unique()->filter()->implode(', ');
 $nom = $prof->prenom . ' ' . $prof->nom;
 $ligne = "• {$nom}";
 if ($matieres) $ligne .= " — {$matieres}";
 $lines[] = $ligne;
 }

 $lines[] = "
Pour échanger directement avec un enseignant, utilisez l'application ClassiNote ou contactez l'administration de l'école.";
 $lines[] = "Répondez « menu » pour revenir au menu.";
 return implode("
", $lines);
 }

 private function formatAnnonces(ParentModel $parent, ?int $eleveId = null): string
 {
 $children = $eleveId
 ? $this->getUnlockedChildren($parent)->where('id', $eleveId)->values()
 : $this->getUnlockedChildren($parent);

 $schoolIds = $children->pluck('school_id')->unique();
 $classeIds = $children->pluck('classe_id')->unique();

 $annonces = Annonce::whereIn('school_id', $schoolIds)
 ->where('publie', true)
 ->where(function ($q) use ($classeIds) {
 $q->whereNull('classe_id')
 ->orWhereIn('classe_id', $classeIds);
 })
 ->latest()
 ->limit(15)
 ->get();

 if ($annonces->isEmpty()) {
 return "📢 Aucune annonce publiée pour le moment.

Répondez « menu » pour revenir au menu.";
 }

 $lines = ["📢 *Annonces* :"];

 foreach ($annonces as $annonce) {
 $date = $annonce->created_at?->format('d/m/Y');
 $lines[] = "
📍 *{$annonce->titre}*";
 if ($date) $lines[] = "📅 {$date}";
 if ($annonce->contenu) $lines[] = $annonce->contenu;
 }

 $lines[] = "
Répondez « menu » pour revenir au menu.";
 return implode("
", $lines);
 }

 private function formatFrais(ParentModel $parent, ?int $eleveId = null): string
 {
 $eleves = $this->getUnlockedChildren($parent);
 if ($eleveId) {
 $eleves = $eleves->where('id', $eleveId)->values();
 }

 if ($eleves->isEmpty()) {
 return "💰 Aucune information sur les frais n'est disponible pour le moment.

Répondez « menu » pour revenir au menu.";
 }

 $lines = ["💰 *Frais scolaires* :"];

 foreach ($eleves as $eleve) {
 $subscription = Subscription::where('eleve_id', $eleve->id)
 ->whereHas('anneeScolaire', fn($q) => $q->where('active', true))
 ->with('payments')
 ->first();

 $frais = $subscription?->classe?->fraisClasses?->pluck('frais') ?? collect();
 $ecolage = $subscription?->montant_mensuel ?? 0;
 if ($ecolage <= 0) {
 $ecolage = $eleve->classe?->ecolage ?? 0;
 }
 $scolaritePaye = $subscription ? $subscription->payments->where('type', 'scolarite')->sum('montant') : 0;
 $resteEcolage = max(0, $ecolage - $scolaritePaye);
 $fraisPaye = $subscription ? $subscription->payments->where('type', 'frais')->sum('montant') : 0;
 $totalFrais = $frais->sum('montant');
 $resteFrais = max(0, $totalFrais - $fraisPaye);

 $classeLibelle = $eleve->classe?->libelle ?? '—';
 $lines[] = "
👦 *{$eleve->nom_complet}* ({$classeLibelle})";

 // Ecolage
 $lines[] = "🎓 Écolage : *" . number_format($ecolage, 0, ',', ' ') . " FCFA*";
 $lines[] = " Payé : " . number_format($scolaritePaye, 0, ',', ' ') . " FCFA — reste : " . ($resteEcolage <= 0 ? '✅' : number_format($resteEcolage, 0, ',', ' ') . " FCFA");

 if ($frais->isNotEmpty()) {
 $lines[] = "📋 *Frais annexes :*";
 foreach ($frais->take(5) as $f) {
 $paye = $subscription?->payments->where('type', 'frais')->where('frais_id', $f->id)->sum('montant') ?? 0;
 $reste = max(0, $f->montant - $paye);
 $statut = $reste <= 0 ? '✅' : number_format($reste, 0, ',', ' ') . " FCFA";
 $lines[] = "• {$f->libelle} : *" . number_format($f->montant, 0, ',', ' ') . " FCFA* (payé : " . number_format($paye, 0, ',', ' ') . " FCFA — reste : {$statut})";
 }
 $lines[] = "💵 Total frais payé : *" . number_format($fraisPaye, 0, ',', ' ') . " FCFA*";
 $lines[] = "💵 Total frais restant : *" . number_format($resteFrais, 0, ',', ' ') . " FCFA*";
 } else {
 $lines[] = "• Aucun frais enregistré pour le moment.";
 }
 }

 $lines[] = "
Répondez « menu » pour revenir au menu.";
 return implode("
", $lines);
 }

 private function formatPaiements(ParentModel $parent, ?int $eleveId = null): string
 {
 $eleveIds = $this->getUnlockedEleveIds($parent, $eleveId);

 if (empty($eleveIds)) {
 return "💳 Aucun paiement enregistré pour le moment.

Répondez « menu » pour revenir au menu.";
 }

 $subscriptions = Subscription::whereIn('eleve_id', $eleveIds)
 ->with('payments', 'eleve')
 ->get();

 $payments = $subscriptions->flatMap(function ($sub) {
 return $sub->payments->map(function ($payment) use ($sub) {
 return [
 'eleve' => $sub->eleve?->nom_complet ?? '—',
 'montant' => $payment->montant,
 'type' => $payment->type,
 'date' => $payment->created_at?->format('d/m/Y') ?? '',
 ];
 });
 })->sortByDesc('date')->take(15);

 if ($payments->isEmpty()) {
 return "💳 Aucun paiement enregistré pour le moment.

Répondez « menu » pour revenir au menu.";
 }

 $lines = ["💳 *Derniers paiements* :"];

 foreach ($payments as $payment) {
 $typeLabel = match($payment['type']) {
 'scolarite' => 'Écolage',
 'frais' => 'Frais',
 'abonnement' => 'Abonnement',
 default => $payment['type'] ?? '',
 };
 $ligne = "
• {$payment['date']} — *" . number_format($payment['montant'], 0, ',', ' ') . " FCFA*";
 if ($payment['eleve']) $ligne .= "
 👦 {$payment['eleve']}";
 if ($typeLabel) $ligne .= "
 Type : {$typeLabel}";
 $lines[] = $ligne;
 }

 $lines[] = "
Répondez « menu » pour revenir au menu.";
 return implode("
", $lines);
 }

 private function findParentByPhone(array $candidates): ?ParentModel
 {
 $normalizedCandidates = [];

 foreach ($candidates as $candidate) {
 if (!is_string($candidate) || $candidate === '') {
 continue;
 }

 $digits = preg_replace('/\D/', '', $candidate);

 if (strlen($digits) >= 8) {
 $normalizedCandidates[] = $digits;
 }
 }

 $normalizedCandidates = array_unique($normalizedCandidates);

 if (empty($normalizedCandidates)) {
 return null;
 }

 foreach ($normalizedCandidates as $candidate) {
 foreach ([$candidate, '+' . $candidate, substr($candidate, -10), '+' . substr($candidate, -10), substr($candidate, -9), '+' . substr($candidate, -9)] as $form) {
 $parent = ParentModel::where('telephone', $form)->first();
 if ($parent) {
 if ($parent->is_demo && $parent->demo_expires_at && $parent->demo_expires_at->isPast()) {
 $eleves = $parent->eleves;
 foreach ($eleves as $eleve) {
 Note::whereIn('evaluation_id', function ($q) use ($eleve) {
 $q->select('id')->from('evaluations')->where('school_id', $eleve->school_id);
 })->where('eleve_id', $eleve->id)->delete();
 Evaluation::where('school_id', $eleve->school_id)->delete();
 Presence::where('eleve_id', $eleve->id)->delete();
 EleveClasse::where('eleve_id', $eleve->id)->delete();
 Subscription::where('eleve_id', $eleve->id)->delete();
 $eleve->parents()->detach();
 $eleve->delete();
 }
 $parent->delete();
 Log::info('Zernio: compte démo expiré nettoyé à la connexion', ['parent_id' => $parent->id]);
 return null;
 }
 return $parent;
 }
 }
 }

 return null;
 }

 private function findProfByPhone(array $candidates): ?\App\Models\Prof
 {
 foreach ($candidates as $candidate) {
 if (!is_string($candidate) || $candidate === '') continue;
 $digits = preg_replace('/\D/', '', $candidate);
 if (strlen($digits) < 8) continue;

 foreach ([$digits, '+' . $digits, substr($digits, -10), '+' . substr($digits, -10), substr($digits, -9), '+' . substr($digits, -9)] as $form) {
 $prof = \App\Models\Prof::where('telephone', $form)->where('active', true)->first();
 if ($prof) return $prof;
 }
 }
 return null;
 }

 private function askRoleSelection(WhatsAppConversation $conv, ParentModel $parent, \App\Models\Prof $prof): void
 {
 $enfants = $this->getUnlockedChildren($parent);
 $enfantsList = $enfants->pluck('prenom')->join(', ');

 $message = "👋 Bonjour *{$prof->prenom}* !

";
 $message .= "Vous avez plusieurs rôles :
";
 $schoolName = $prof->schools()->first();
 $message .= "👩‍🏫 Professeur — " . ($schoolName?->nom ?? 'École') . "
";
 if ($enfants->isNotEmpty()) {
 $message .= "👨 Parent — {$enfantsList}
";
 }
 $message .= "
Que souhaitez-vous faire ?";

 $conv->setState('awaiting_role_selection');

 $this->sendText($conv, $message, [
 ['title' => '👩‍🏫 Mode Prof', 'payload' => 'role_prof'],
 ['title' => '👨 Mode Parent', 'payload' => 'role_parent'],
 ]);
 }

    private function handleProfFlow(WhatsAppConversation $conv, \App\Models\Prof $prof, string $norm, ?string $state): void
    {
        // Role selection
        if ($state === 'awaiting_role_selection') {
            if ($norm === 'role_prof' || preg_match('/prof|enseignant/i', $norm)) {
                $this->sendProfMenu($conv, $prof);
                return;
            }
            if ($norm === 'role_parent' || $norm === 'role parent' || preg_match('/mode.*parent|parent.*mode/i', $norm)) {
                $conv->setState('awaiting_menu_action', ['role' => 'parent']);
                $parent = $this->findParentByPhone([$conv->participant_phone]);
                if ($parent) $this->startRichMenu($conv, $parent);
                return;
            }
            $this->askRoleSelection($conv, $this->findParentByPhone([$conv->participant_phone]) ?? new ParentModel(), $prof);
            return;
        }

        // School selection from list
        if (preg_match('/school[:\s]+(\d+)/i', $norm, $m)) {
            $schoolId = (int) $m[1];
            $school = \App\Models\School::find($schoolId);
            if ($school) {
                $parent = $this->findParentByPhone([$conv->participant_phone]);
                $isParent = !!$parent;
                $this->sendProfMenuForSchool($conv, $prof, $school, $isParent);
                return;
            }
        }

        // Class selection from menu
        if (preg_match('/classe[:\s]+(\d+)/i', $norm, $m)) {
 $classeId = (int) $m[1];
 $affectation = $prof->affectations()->where('classe_id', $classeId)->with(['matiere', 'classe'])->first();
 if ($affectation) {
 $conv->setState('awaiting_prof_action', [
 'prof_id' => $prof->id,
 'classe_id' => $classeId,
 'matiere_id' => $affectation->matiere_id,
 'role' => 'prof',
 ]);
 $classeName = $affectation->classe?->libelle ?? 'Classe';
 $matiereName = $affectation->matiere?->libelle ?? '';
 $this->sendText($conv, "📋 *{$classeName}* — {$matiereName}\n\nQue souhaitez-vous faire ?", [
 ['title' => '📝 Saisir des notes', 'payload' => 'prof_notes'],
 ['title' => '⏰ Marquer absences', 'payload' => 'prof_absences'],
 ['title' => '🔄 Retour', 'payload' => 'menu'],
 ]);
 return;
 }
 }

 // ─── Image received (photo for notes) ───
 if ($state === 'awaiting_prof_image') {
 if ($norm === 'role_parent' || $norm === 'role parent' || preg_match('/mode.*parent|parent.*mode/i', $norm)) {
 $conv->setState('awaiting_menu_action', ['role' => 'parent']);
 $parent = $this->findParentByPhone([$conv->participant_phone]);
 if ($parent) $this->startRichMenu($conv, $parent);
 return;
 }
 if ($norm === 'retour' || $norm === 'menu') {
 $this->sendProfMenu($conv, $prof);
 return;
 }
 $this->sendProfMenu($conv, $prof);
 return;
 }

 // ─── Menu actions ───
 if ($norm === 'role_prof') {
 $this->sendProfMenu($conv, $prof);
 return;
 }

 if ($norm === 'role_parent' || $norm === 'role parent' || preg_match('/mode.*parent|parent.*mode/i', $norm)) {
 $conv->setState('awaiting_menu_action', ['role' => 'parent']);
 $parent = $this->findParentByPhone([$conv->participant_phone]);
 if ($parent) {
 $children = $this->getUnlockedChildren($parent);
 if ($children->isEmpty()) {
 $this->sendText($conv, "Aucun enfant rattaché à votre compte.");
 return;
 }
 if ($children->count() === 1) {
 $this->sendRichMenu($conv, $parent, $children->first());
 } else {
 $this->startRichMenu($conv, $parent);
 }
 }
 return;
 }

 if ($norm === 'menu' || $norm === 'accueil' || $norm === 'retour') {
 $this->sendProfMenu($conv, $prof);
 return;
 }

 if ($norm === 'change_class') {
 $this->sendProfMenu($conv, $prof);
 return;
 }

 // Dashboard
 if ($norm === 'prof_dashboard' || $norm === 'prof dashboard' || preg_match('/tableau.*bord|dashboard/i', $norm)) {
 $this->sendProfDashboardLink($conv, $prof);
 return;
 }

 // Notes
 if ($norm === 'prof_notes' || $norm === 'prof notes' || preg_match('/saisir.*note|envoyer.*note|note.*eleve|prof.*note/i', $norm)) {
 $data = $conv->state_data ?? [];
 if (isset($data['classe_id'])) {
 $conv->setState('awaiting_prof_image', [
 'prof_id' => $prof->id,
 'classe_id' => $data['classe_id'],
 'matiere_id' => $data['matiere_id'] ?? null,
 'type' => 'notes',
 ]);
 $classe = \App\Models\Classe::find($data['classe_id']);
 $this->sendText($conv, "📸 Envoyez une *photo* de votre tableau de notes pour *{$classe?->libelle}*.\n\n💡 Indiquez la matière et la colonne si nécessaire.", [
 ['title' => '🔄 Retour', 'payload' => 'menu'],
 ]);
 return;
 }
 $this->sendProfMenu($conv, $prof);
 return;
 }

 // Absences
 if ($norm === 'prof_absences' || $norm === 'prof absences' || preg_match('/absence|marquer.*absent/i', $norm)) {
 $this->sendProfAbsencesLink($conv, $prof);
 return;
 }

 // Emploi du temps
 if ($norm === 'prof_emploi' || $norm === 'prof emploi' || preg_match('/emploi|planning|horaire/i', $norm)) {
 $this->sendProfEmploiLink($conv, $prof);
 return;
 }

 // Annonces - supprimé du menu prof

 $this->sendProfMenu($conv, $prof);
 }

    private function sendProfMenu(WhatsAppConversation $conv, \App\Models\Prof $prof): void
    {
        $schools = $prof->schools;
        $parent = $this->findParentByPhone([$conv->participant_phone]);
        $isParent = !!$parent;

        // If multiple schools, show school selection first
        if ($schools->count() > 1) {
            $schoolRows = $schools->map(fn($s) => [
                'id' => 'school:' . $s->id,
                'title' => '🏫 ' . $s->nom,
                'description' => 'Sélectionner cet établissement',
            ])->values()->toArray();

            $conv->setState('awaiting_prof_action', ['prof_id' => $prof->id, 'role' => 'prof']);

            $this->sendText($conv, "👨‍🏫 *M. {$prof->prenom} {$prof->nom}*\n\nChoisissez un établissement :", [], [
                'type' => 'list',
                'body' => ['text' => "👨‍🏫 *M. {$prof->prenom} {$prof->nom}*\n\nChoisissez un établissement :"],
                'action' => [
                    'name' => 'single_select',
                    'button' => 'Choisir',
                    'sections' => [
                        ['title' => 'Établissements', 'rows' => $schoolRows],
                    ],
                ],
            ]);
            return;
        }

        // Single school - show classes directly
        $school = $schools->first();
        $this->sendProfMenuForSchool($conv, $prof, $school, $isParent);
    }

    private function sendProfMenuForSchool(WhatsAppConversation $conv, \App\Models\Prof $prof, \App\Models\School $school, bool $isParent): void
    {
        $schoolClasseIds = $school->classes()->pluck('id')->toArray();
        $affectations = $prof->affectations()->whereIn('classe_id', $schoolClasseIds)->with(['classe', 'matiere'])->get();
        $classes = $affectations->pluck('classe')->filter()->unique('id');

        // Auto-select class if only one
        if ($classes->count() === 1) {
            $classe = $classes->first();
            $affectation = $affectations->firstWhere('classe_id', $classe->id);
            $conv->setState('awaiting_prof_action', [
                'prof_id' => $prof->id,
                'school_id' => $school->id,
                'classe_id' => $classe->id,
                'matiere_id' => $affectation?->matiere_id,
                'role' => 'prof',
            ]);
            $this->sendProfActionsMenu($conv, $prof, $classe, $isParent);
            return;
        }

        $conv->setState('awaiting_prof_action', ['prof_id' => $prof->id, 'school_id' => $school->id, 'role' => 'prof']);

        $classRows = $classes->map(fn($c) => [
            'id' => 'classe:' . $c->id,
            'title' => '📋 ' . $c->libelle,
            'description' => 'Sélectionner cette classe',
        ])->values()->toArray();

        $actionRows = [
            ['id' => 'prof_dashboard', 'title' => '🏠 Tableau de bord', 'description' => 'Ouvrir le tableau de bord'],
            ['id' => 'prof_emploi', 'title' => '📅 Mon emploi du temps', 'description' => 'Vos affectations et cours'],
        ];

        if ($isParent) {
            $actionRows[] = ['id' => 'role_parent', 'title' => '👨 Mode Parent', 'description' => 'Consulter vos enfants'];
        }

        $sections = [];
        if ($classRows) {
            $sections[] = ['title' => 'Vos classes', 'rows' => $classRows];
        }
        $sections[] = ['title' => 'Actions', 'rows' => $actionRows];

        $this->sendText($conv, "👨‍🏫 *M. {$prof->prenom} {$prof->nom}* — {$school->nom}", [], [
            'type' => 'list',
            'body' => ['text' => "👨‍🏫 *M. {$prof->prenom} {$prof->nom}* — {$school->nom}\n\nSélectionnez une classe ou une action :"],
            'action' => [
                'name' => 'single_select',
                'button' => 'Voir les options',
                'sections' => $sections,
            ],
        ]);
    }

 private function sendProfActionsMenu(WhatsAppConversation $conv, \App\Models\Prof $prof, \App\Models\Classe $classe, bool $isParent): void
 {
 $matiere = $prof->affectations()->where('classe_id', $classe->id)->with('matiere')->first()?->matiere?->libelle ?? '';

 $this->sendText($conv, "📋 *{$classe->libelle}* — {$matiere}\n\nQue souhaitez-vous faire ?", [
 ['title' => '📝 Saisir des notes', 'payload' => 'prof_notes'],
 ['title' => '⏰ Marquer absences', 'payload' => 'prof_absences'],
 ['title' => '🔄 Menu prof', 'payload' => 'menu'],
 ]);
 }

 private function sendProfNotesRequest(WhatsAppConversation $conv, \App\Models\Prof $prof): void
 {
 $data = $conv->state_data ?? [];
 $classeId = $data['classe_id'] ?? null;

 if (!$classeId) {
 $this->sendProfMenu($conv, $prof);
 return;
 }

 $classe = \App\Models\Classe::find($classeId);
 $conv->setState('awaiting_prof_image', [
 'prof_id' => $prof->id,
 'classe_id' => $classeId,
 'matiere_id' => $data['matiere_id'] ?? null,
 'type' => 'notes',
 ]);

 $this->sendText($conv, "📸 Envoyez une *photo* de votre tableau de notes pour *{$classe?->libelle}*.\n\n💡 Indiquez la matière et la colonne si nécessaire.", [
 ['title' => '🔄 Menu prof', 'payload' => 'menu'],
 ['title' => '🏫 Changer classe', 'payload' => 'change_class'],
 ['title' => '👨 Mode Parent', 'payload' => 'role_parent'],
 ]);
 }

 private function sendProfDashboardLink(WhatsAppConversation $conv, \App\Models\Prof $prof): void
 {
 $token = bin2hex(random_bytes(32));
 \App\Models\MagicLink::create([
 'token_hash' => hash('sha256', $token),
 'purpose' => 'prof_dashboard',
 'parent_id' => null,
 'prof_id' => $prof->id,
 'eleve_id' => null,
 'expires_at' => now()->addMinutes(10),
 ]);

        $url = config('zernio.public_url') . "/app/prof/#/magic/prof_dashboard?token={$token}";

        $conv->setState('awaiting_prof_action', ['prof_id' => $prof->id, 'role' => 'prof']);

        $this->sendText($conv, "🏠 *Tableau de bord*\n\nCliquez ci-dessous pour accéder à votre tableau de bord.\n\n⏰ Ce lien expire dans 10 minutes.", [], [
   'type' => 'cta_url',
   'body' => ['text' => "🏠 Tableau de bord prof"],
   'action' => [
   'name' => 'cta_url',
   'parameters' => [
   'display_text' => 'Ouvrir le dashboard',
   'url' => $url,
   ],
   ],
   ]);
 }

 private function sendProfEmploiLink(WhatsAppConversation $conv, \App\Models\Prof $prof): void
 {
 $token = bin2hex(random_bytes(32));
 \App\Models\MagicLink::create([
 'token_hash' => hash('sha256', $token),
 'purpose' => 'prof_emploi',
 'parent_id' => null,
 'prof_id' => $prof->id,
 'eleve_id' => null,
 'expires_at' => now()->addMinutes(10),
 ]);

        $url = config('zernio.public_url') . "/app/prof/#/magic/prof_emploi?token={$token}";

        $conv->setState('awaiting_prof_action', ['prof_id' => $prof->id, 'role' => 'prof']);

        $this->sendText($conv, "📅 *Emploi du temps*\n\nCliquez ci-dessous pour voir votre emploi du temps.\n\n⏰ Ce lien expire dans 10 minutes.", [], [
   'type' => 'cta_url',
   'body' => ['text' => "📅 Emploi du temps"],
   'action' => [
   'name' => 'cta_url',
   'parameters' => [
   'display_text' => 'Voir emploi du temps',
   'url' => $url,
   ],
   ],
   ]);
 }

 private function sendProfAbsencesLink(WhatsAppConversation $conv, \App\Models\Prof $prof): void
 {
 $data = $conv->state_data ?? [];
 $classeId = $data['classe_id'] ?? null;

 if (!$classeId) {
 $this->sendText($conv, "📋 Sélectionnez d'abord une classe dans le menu.", [
 ['title' => '🔄 Menu prof', 'payload' => 'menu'],
 ]);
 return;
 }

 $classe = \App\Models\Classe::find($classeId);
 $token = bin2hex(random_bytes(32));
 \App\Models\MagicLink::create([
 'token_hash' => hash('sha256', $token),
 'purpose' => 'prof_absences',
 'parent_id' => null,
 'prof_id' => $prof->id,
 'eleve_id' => null,
 'expires_at' => now()->addMinutes(10),
 ]);

 $url = config('zernio.public_url') . "/app/prof/#/magic/prof_absences?token={$token}&classe_id={$classeId}";

 $conv->setState('awaiting_prof_action', ['prof_id' => $prof->id, 'classe_id' => $classeId, 'role' => 'prof']);

 $this->sendText($conv, "⏰ *Marquer les absences* — {$classe?->libelle}\n\nCliquez ci-dessous pour marquer les absences.\n\n⏰ Ce lien expire dans 10 minutes.", [], [
 'type' => 'cta_url',
 'body' => ['text' => "⏰ Absences — {$classe?->libelle}"],
 'action' => [
 'name' => 'cta_url',
 'parameters' => [
 'display_text' => 'Marquer absences',
 'url' => $url,
 ],
 ],
 ]);
 }

 private function sendProfEvaluationsList(WhatsAppConversation $conv, \App\Models\Prof $prof): void
 {
 $affectations = $prof->affectations()->with(['matiere', 'classe'])->get();

 if ($affectations->isEmpty()) {
 $this->sendText($conv, "Aucune affectation trouvée.", [
 ['title' => '🔄 Retour', 'payload' => 'menu'],
 ]);
 return;
 }

 $classeIds = $affectations->pluck('classe_id')->unique();
 $matiereIds = $affectations->pluck('matiere_id')->unique();

 $evaluations = Evaluation::whereIn('classe_id', $classeIds)
 ->whereIn('matiere_id', $matiereIds)
 ->where('date', '>=', now()->subDays(30)->toDateString())
 ->with(['matiere', 'classe'])
 ->orderBy('date', 'desc')
 ->limit(10)
 ->get();

 if ($evaluations->isEmpty()) {
 $this->sendText($conv, "Aucune évaluation récente trouvée pour vos affectations.\n\nVous pouvez créer une *interrogation* à la place.", [
 ['title' => '❓ Interrogation', 'payload' => 'prof_interro'],
 ['title' => '🔄 Retour', 'payload' => 'menu'],
 ]);
 return;
 }

 $rows = [];
 foreach ($evaluations as $ev) {
 $matiere = $ev->matiere?->libelle ?? '—';
 $classe = $ev->classe?->libelle ?? '—';
 $date = \Carbon\Carbon::parse($ev->date)->format('d/m');
 $rows[] = [
 'id' => 'eval:' . $ev->id,
 'title' => mb_substr($ev->titre, 0, 24),
 'description' => "{$matiere} — {$classe} — {$date}",
 ];
 }

 $conv->setState('awaiting_prof_eval_select', ['prof_id' => $prof->id]);

 $this->sendText($conv, "📋 *Choisissez l'évaluation* :", [], [
 'type' => 'list',
 'body' => ['text' => '📋 Choisissez l\'évaluation :'],
 'action' => [
 'name' => 'single_select',
 'button' => 'Choisir',
 'sections' => [
 ['title' => 'Évaluations', 'rows' => $rows],
 ],
 ],
 ]);
 }
 private function createInterroAndAskPhoto(WhatsAppConversation $conv, \App\Models\Prof $prof): void
 {
 $affectations = $prof->affectations()->with(['matiere', 'classe'])->first();

 if (!$affectations) {
 $this->sendText($conv, "Aucune affectation trouvée.", [
 ['title' => '🔙 Retour', 'payload' => 'menu'],
 ]);
 return;
 }

 $anneeActive = $this->getAnneeActiveForSchool($prof->school_id);
 $matiere = $affectations->matiere?->libelle ?? 'Matière';
 $classe = $affectations->classe?->libelle ?? 'Classe';

 $eval = Evaluation::create([
 'school_id' => $prof->school_id,
 'classe_id' => $affectations->classe_id,
 'matiere_id' => $affectations->matiere_id,
 'periode_id' => $anneeActive?->periodes()?->first()?->id,
 'annee_scolaire_id' => $anneeActive?->id,
 'titre' => "Interrogation {$matiere} — {$classe}",
 'type' => 'interrogation',
 'date' => now()->toDateString(),
 'coefficient' => 1,
 'note_sur' => 20,
 ]);

 $conv->setState('awaiting_prof_image', ['prof_id' => $prof->id, 'type' => 'notes', 'evaluation_id' => $eval->id]);

 $this->sendText($conv, "✅ *Interrogation créée*\n\n📝 {$eval->titre}\n📅 {$classe} — {$matiere}\n\n📸 Envoyez maintenant une *photo* de votre tableau de notes.\n\n💡 Si votre tableau a plusieurs colonnes, indiquez la colonne concernée.", [
 ['title' => '🔙 Retour', 'payload' => 'menu'],
 ]);
 }

 private function sendProfEmploi(WhatsAppConversation $conv, \App\Models\Prof $prof): void
 {
 $affectations = $prof->affectations()->with(['matiere', 'classe'])->get();

 if ($affectations->isEmpty()) {
 $this->sendText($conv, "📅 *Votre emploi du temps*\n\nAucune affectation trouvée.", [
 ['title' => '🔙 Retour', 'payload' => 'menu'],
 ]);
 return;
 }

 $lines = ["📅 *Vos affectations* :\n"];
 foreach ($affectations as $a) {
 $matiere = $a->matiere?->libelle ?? '—';
 $classe = $a->classe?->libelle ?? '—';
 $lines[] = "• *{$matiere}* — {$classe}";
 }

 $conv->setState('awaiting_prof_action', ['prof_id' => $prof->id, 'role' => 'prof']);

 $this->sendText($conv, implode("\n", $lines), [
 ['title' => '🔙 Menu prof', 'payload' => 'menu'],
 ['title' => '🏫 Changer classe', 'payload' => 'change_class'],
 ['title' => '👨 Mode Parent', 'payload' => 'role_parent'],
 ]);
 }

 private function sendProfAnnonces(WhatsAppConversation $conv, \App\Models\Prof $prof): void
 {
 $annonces = \App\Models\Annonce::where('school_id', $prof->school_id)
 ->where('publie', true)
 ->latest()
 ->limit(5)
 ->get();

 if ($annonces->isEmpty()) {
 $this->sendText($conv, "📢 *Annonces*\n\nAucune annonce récente.", [
 ['title' => '🔙 Menu prof', 'payload' => 'menu'],
 ['title' => '🏫 Changer classe', 'payload' => 'change_class'],
 ['title' => '👨 Mode Parent', 'payload' => 'role_parent'],
 ]);
 return;
 }

 $lines = ["📢 *Annonces récentes* :\n"];
 foreach ($annonces as $a) {
 $date = $a->created_at->format('d/m');
 $lines[] = "• *{$a->titre}* ({$date})";
 $lines[] = " " . mb_substr($a->contenu, 0, 60);
 }

 $conv->setState('awaiting_prof_action', ['prof_id' => $prof->id, 'role' => 'prof']);

 $this->sendText($conv, implode("\n", $lines), [
 ['title' => '🔙 Menu prof', 'payload' => 'menu'],
 ['title' => '🏫 Changer classe', 'payload' => 'change_class'],
 ['title' => '👨 Mode Parent', 'payload' => 'role_parent'],
 ]);
 }

 private function matchAction(string $norm): ?string
 {
 $map = [
 'nouveautes' => ['nouveautes', 'nouveaute', 'actualites', 'news', 'nouvelles', 'infos'],
 'dashboard' => ['tableau de bord', 'tableau de board', 'tableau', 'dashboard'],
 'notes' => ['notes', 'consulter les notes', 'bulletins', 'bulletin'],
 'emploi' => ['emploi du temps', 'emploi', 'planning'],
 'absences' => ['absences', 'absence', 'retards', 'retard', 'assiduite', 'presences'],
 'msg_prof' => ['contacter un prof', 'contacter un professeur', 'prof', 'enseignants'],
 'annonce' => ['annonces', 'annonce', 'avis aux parents', 'avis'],
 'frais' => ['frais scolaires', 'frais', 'scolarite'],
 'paiement' => ['paiements', 'paiement', 'historique des paiements'],
 'remarques' => ['remarques', 'remarque', 'observations', 'observation'],
 'examens' => ['examens', 'examen', 'examens a venir', 'examens à venir', 'epreuves', 'evaluation'],
 'support' => ['aide', 'support', 'help'],
 ];

 foreach ($map as $id => $keywords) {
 foreach ($keywords as $keyword) {
 if (str_contains($norm, $keyword)) {
 return $id;
 }
 }
 }

 return null;
 }

 private function normalizeText(?string $text): string
 {
 if (!$text) {
 return '';
 }

 $t = mb_strtolower(trim($text));
 $t = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $t);
 $t = \Illuminate\Support\Str::ascii($t);
 $t = preg_replace('/\s+/', ' ', $t);

 return trim($t);
 }

 private function isYes(string $norm): bool
 {
 if (in_array($norm, ['1', 'y', 'oui', 'yes', 'confirm', 'confirmer', 'valider', 'demo_confirm', 'demo confirm'])) {
 return true;
 }

 return (bool) preg_match('/\b(oui|yes|ok|daccord|d accord|valider|confirmer|confirm|c est bien|ce sont bien|c est ca|exact|ca me va)\b/i', $norm);
 }

 private function isNo(string $norm): bool
 {
 if (in_array($norm, ['0', 'n', 'non', 'no', 'reject', 'refuser', 'annuler', 'demo_cancel', 'demo cancel'])) {
 return true;
 }

 return (bool) preg_match('/\b(non|no|annuler|fermer|c est pas|cest pas|pas le bon|ne connais pas|erreur|reject)\b/i', $norm);
 }

 private function handleConversationStarted(array $payload): JsonResponse
 {
 $conversation = $payload['conversation'] ?? [];
 $account = $payload['account'] ?? [];

 $conversationId = $conversation['id'] ?? null;
 $platform = $account['platform'] ?? $payload['platform'] ?? null;

 if ($platform !== 'whatsapp' || !$conversationId) {
 return response()->json(['success' => true]);
 }

 WhatsAppConversation::firstOrCreate(
 ['zernio_conversation_id' => $conversationId],
 [
 'account_id' => $account['accountId'] ?? $account['id'] ?? '',
 'participant_phone' => $conversation['participantId'] ?? '',
 'participant_name' => $conversation['participantName'] ?? null,
 'can_reply' => true,
 'last_message_at' => now(),
 ]
 );

 return response()->json(['success' => true]);
 }

 private function handleMessageStatus(array $payload, string $status): JsonResponse
 {
 $zernioMessageId = $payload['message']['id'] ?? $payload['messageId'] ?? null;

 if ($zernioMessageId) {
 WhatsAppMessage::where('zernio_message_id', $zernioMessageId)
 ->update(['status' => $status]);
 }

 return response()->json(['success' => true]);
 }

 private function handleMessageFailed(array $payload): JsonResponse
 {
 $zernioMessageId = $payload['message']['id'] ?? $payload['messageId'] ?? null;

 if ($zernioMessageId) {
 WhatsAppMessage::where('zernio_message_id', $zernioMessageId)
 ->update(['status' => 'failed']);
 }

 Log::error('Zernio: message failed', $payload);

 return response()->json(['success' => true]);
 }
}