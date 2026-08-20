<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\NewMessage;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Eleve;
use App\Models\ParentModel;
use App\Models\Prof;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessagingController extends Controller
{
    private PushNotificationService $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    private function getSchoolId(Request $request): int
    {
        return (int) $request->header('X-School-Id', $request->current_school_id ?? Auth::user()->school_id ?? 0);
    }

    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $schoolId = $this->getSchoolId($request);
        $isParent = $user instanceof \App\Models\ParentModel;

        $query = Conversation::where(function ($q) use ($user) {
            $q->where('prof_id', $user->id)
                ->orWhere('parent_id', $user->id)
                ->orWhere('admin_id', $user->id);
        });

        // For parents, don't filter by school_id (they can have kids in multiple schools)
        if (!$isParent && $schoolId) {
            $query->where('school_id', $schoolId);
        }

        $conversations = $query
            ->with(['lastMessage.sender', 'eleve', 'prof', 'parent', 'admin'])
            ->withCount('messages')
            ->orderByDesc('last_message_at')
            ->get();

        $result = $conversations->map(function ($c) use ($user) {
            $lastMsg = $c->lastMessage;
            $unread = $c->messages()->where('lu', false)
                ->where('sender_id', '!=', $user->id)
                ->count();

            return [
                'id' => $c->id,
                'type' => $c->type,
                'subject' => $c->subject,
                'eleve' => $c->eleve ? [
                    'id' => $c->eleve->id,
                    'nom_complet' => $c->eleve->prenom . ' ' . $c->eleve->nom,
                    'classe' => $c->eleve->classe->libelle ?? '',
                ] : null,
                'other_party' => $this->getOtherParty($c, $user),
                'last_message' => $lastMsg ? [
                    'contenu' => $lastMsg->contenu,
                    'sender_type' => $lastMsg->sender_type,
                    'sender_id' => $lastMsg->sender_id,
                    'created_at' => $lastMsg->created_at->toISOString(),
                ] : null,
                'unread_count' => $unread,
                'created_at' => $c->created_at->toISOString(),
                'last_message_at' => $c->last_message_at?->toISOString(),
            ];
        });

        return response()->json($result);
    }

    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $user = Auth::user();

        if ($conversation->prof_id !== $user->id && $conversation->parent_id !== $user->id && $conversation->admin_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Mark unread messages from others as read
        $conversation->messages()
            ->where('sender_id', '!=', $user->id)
            ->where('lu', false)
            ->update(['lu' => true]);

        $messages = $conversation->messages()
            ->with('sender')
            ->orderBy('created_at')
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'sender_type' => class_basename($m->sender_type),
                    'sender_id' => $m->sender_id,
                    'sender_name' => $this->getSenderName($m),
                    'contenu' => $m->contenu,
                    'lu' => $m->lu,
                    'created_at' => $m->created_at->toISOString(),
                ];
            });

        return response()->json($messages);
    }

    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $user = Auth::user();

        if ($conversation->prof_id !== $user->id && $conversation->parent_id !== $user->id && $conversation->admin_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $request->validate([
            'contenu' => 'required|string|max:2000',
        ]);

        $message = $conversation->messages()->create([
            'sender_type' => get_class($user),
            'sender_id' => $user->id,
            'contenu' => strip_tags($request->contenu),
        ]);

        $conversation->update(['last_message_at' => now()]);

        broadcast(new NewMessage($conversation, $message));

        $senderName = ($user->prenom ?? '') . ' ' . ($user->nom ?? '') ?: ($user->name ?? '');
        $preview = mb_substr($request->contenu, 0, 100);

        if ($user->id === $conversation->prof_id && $conversation->parent) {
            $this->pushService->notifyParentMessage($conversation->parent, $senderName, $preview);
        } elseif ($user->id === $conversation->parent_id) {
            if ($conversation->prof) {
                $this->pushService->notifyProfMessage($conversation->prof, $senderName, $preview);
            } elseif ($conversation->admin) {
                $this->pushService->sendToAdmin($conversation->admin, 'Nouveau message', $senderName . ': ' . $preview, ['type' => 'admin_message']);
            }
        } elseif ($user->id === $conversation->admin_id && $conversation->parent) {
            $this->pushService->notifyParentMessage($conversation->parent, $senderName, $preview);
        }

        return response()->json([
            'id' => $message->id,
            'sender_type' => class_basename($message->sender_type),
            'sender_id' => $message->sender_id,
            'sender_name' => $user->prenom . ' ' . $user->nom,
            'contenu' => $message->contenu,
            'lu' => false,
            'created_at' => $message->created_at->toISOString(),
        ], 201);
    }

    public function startConversation(Request $request): JsonResponse
    {
        $user = Auth::user();
        $schoolId = $this->getSchoolId($request);

        $isParent = $user instanceof \App\Models\ParentModel;

        if ($isParent) {
            $request->validate([
                'eleve_id' => 'required|exists:eleves,id',
                'prof_id' => 'nullable|exists:profs,id',
                'admin_id' => 'nullable|exists:users,id',
                'subject' => 'nullable|string|max:255',
                'contenu' => 'required|string|max:2000',
            ]);

            if (!$request->prof_id && !$request->admin_id) {
                return response()->json(['message' => 'Veuillez spécifier un destinataire (prof_id ou admin_id)'], 422);
            }

            $eleve = Eleve::findOrFail($request->eleve_id);
            $isLinked = $user->eleves()->where('eleves.id', $eleve->id)->exists();
            if (!$isLinked) {
                return response()->json(['message' => 'Cet élève n\'est pas lié à votre compte'], 403);
            }

            // Get school from eleve if not in request
            if (!$schoolId) {
                $schoolId = $eleve->school_id;
            }

            $conversationData = [
                'school_id' => $schoolId,
                'eleve_id' => $request->eleve_id,
                'parent_id' => $user->id,
                'subject' => strip_tags($request->subject ?? ''),
                'last_message_at' => now(),
            ];

            if ($request->prof_id) {
                $prof = Prof::findOrFail($request->prof_id);
                $teachesEleve = $prof->affectations()
                    ->where('classe_id', $eleve->classe_id)
                    ->exists();
                if (!$teachesEleve) {
                    return response()->json(['message' => 'Ce professeur n\'enseigne pas à la classe de cet élève'], 403);
                }
                $conversationData['type'] = 'parent_prof';
                $conversationData['prof_id'] = $request->prof_id;
            } else {
                $admin = \App\Models\User::where('id', $request->admin_id)->where('role', 'admin')->firstOrFail();
                $hasAccess = $admin->schools()->where('schools.id', $schoolId)->exists();
                if (!$hasAccess) {
                    return response()->json(['message' => 'Cet admin n\'appartient pas à cette école'], 403);
                }
                $conversationData['type'] = 'parent_admin';
                $conversationData['admin_id'] = $request->admin_id;
            }
        } else {
            $request->validate([
                'eleve_id' => 'required|exists:eleves,id',
                'parent_id' => 'required|exists:parents,id',
                'subject' => 'nullable|string|max:255',
                'contenu' => 'required|string|max:2000',
            ]);

            $eleve = Eleve::findOrFail($request->eleve_id);
            if ($eleve->school_id != $schoolId) {
                return response()->json(['message' => 'Élève non trouvé dans cette école'], 404);
            }

            $parent = ParentModel::findOrFail($request->parent_id);
            $isLinked = $parent->eleves()->where('eleves.id', $eleve->id)->exists();
            if (!$isLinked) {
                return response()->json(['message' => 'Ce parent n\'est pas lié à cet élève'], 403);
            }
            $teachesEleve = $user->affectations()
                ->where('classe_id', $eleve->classe_id)
                ->exists();
            if (!$teachesEleve) {
                return response()->json(['message' => 'Vous n\'enseignez pas à la classe de cet élève'], 403);
            }

            $conversationData = [
                'school_id' => $schoolId,
                'type' => 'parent_prof',
                'eleve_id' => $request->eleve_id,
                'prof_id' => $user->id,
                'parent_id' => $request->parent_id,
                'subject' => strip_tags($request->subject ?? ''),
                'last_message_at' => now(),
            ];
        }

        // Check if conversation already exists
        $existing = Conversation::where('school_id', $schoolId)
            ->where('eleve_id', $conversationData['eleve_id'])
            ->where(function ($q) use ($conversationData) {
                if (isset($conversationData['prof_id'])) {
                    $q->where('prof_id', $conversationData['prof_id'])
                      ->where('parent_id', $conversationData['parent_id']);
                } else {
                    $q->where('admin_id', $conversationData['admin_id'])
                      ->where('parent_id', $conversationData['parent_id']);
                }
            })
            ->first();

        if ($existing) {
            $message = $existing->messages()->create([
                'sender_type' => get_class($user),
                'sender_id' => $user->id,
                'contenu' => strip_tags($request->contenu),
            ]);
            $existing->update(['last_message_at' => now()]);
            return response()->json([
                'conversation_id' => $existing->id,
                'message_id' => $message->id,
            ], 201);
        }

        $conversation = Conversation::create($conversationData);

        $message = $conversation->messages()->create([
            'sender_type' => get_class($user),
            'sender_id' => $user->id,
            'contenu' => strip_tags($request->contenu),
        ]);

        return response()->json([
            'conversation_id' => $conversation->id,
            'message_id' => $message->id,
        ], 201);
    }

    public function adminConversations(Request $request): JsonResponse
    {
        $schoolId = $this->getSchoolId($request);

        $conversations = Conversation::where('school_id', $schoolId)
            ->with(['lastMessage.sender', 'eleve', 'prof', 'parent'])
            ->withCount('messages')
            ->orderByDesc('last_message_at')
            ->get();

        $result = $conversations->map(function ($c) {
            $lastMsg = $c->lastMessage;

            return [
                'id' => $c->id,
                'type' => $c->type,
                'subject' => $c->subject,
                'eleve' => $c->eleve ? [
                    'id' => $c->eleve->id,
                    'nom_complet' => $c->eleve->prenom . ' ' . $c->eleve->nom,
                    'classe' => $c->eleve->classe->libelle ?? '',
                ] : null,
                'prof' => $c->prof ? [
                    'id' => $c->prof->id,
                    'nom_complet' => $c->prof->prenom . ' ' . $c->prof->nom,
                ] : null,
                'parent' => $c->parent ? [
                    'id' => $c->parent->id,
                    'nom_complet' => $c->parent->prenom . ' ' . $c->parent->nom,
                ] : null,
                'last_message' => $lastMsg ? [
                    'contenu' => $lastMsg->contenu,
                    'sender_type' => class_basename($lastMsg->sender_type),
                    'sender_name' => $this->getSenderName($lastMsg),
                    'created_at' => $lastMsg->created_at->toISOString(),
                ] : null,
                'unread_count' => $c->messages()->where('lu', false)->count(),
                'messages_count' => $c->messages_count,
                'created_at' => $c->created_at->toISOString(),
                'last_message_at' => $c->last_message_at?->toISOString(),
            ];
        });

        return response()->json($result);
    }

    public function adminMessages(Request $request, Conversation $conversation): JsonResponse
    {
        $schoolId = $this->getSchoolId($request);

        if ($conversation->school_id != $schoolId) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $messages = $conversation->messages()
            ->with('sender')
            ->orderBy('created_at')
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'sender_type' => class_basename($m->sender_type),
                    'sender_id' => $m->sender_id,
                    'sender_name' => $this->getSenderName($m),
                    'contenu' => $m->contenu,
                    'lu' => $m->lu,
                    'created_at' => $m->created_at->toISOString(),
                ];
            });

        return response()->json($messages);
    }

    private function getOtherParty(Conversation $c, $user): array
    {
        if ($user->id === $c->prof_id && $c->parent) {
            return [
                'id' => $c->parent->id,
                'nom_complet' => $c->parent->prenom . ' ' . $c->parent->nom,
                'role' => 'parent',
            ];
        }
        if ($user->id === $c->parent_id) {
            if ($c->prof) {
                return [
                    'id' => $c->prof->id,
                    'nom_complet' => $c->prof->prenom . ' ' . $c->prof->nom,
                    'role' => 'professeur',
                ];
            }
            if ($c->admin) {
                return [
                    'id' => $c->admin->id,
                    'nom_complet' => $c->admin->name,
                    'role' => 'administration',
                ];
            }
        }
        if ($user->id === $c->admin_id && $c->parent) {
            return [
                'id' => $c->parent->id,
                'nom_complet' => $c->parent->prenom . ' ' . $c->parent->nom,
                'role' => 'parent',
            ];
        }
        return ['id' => 0, 'nom_complet' => 'Inconnu', 'role' => ''];
    }

    private function getSenderName(Message $m): string
    {
        $sender = $m->sender;
        if (!$sender) return 'Système';
        return ($sender->prenom ?? '') . ' ' . ($sender->nom ?? '');
    }
}
