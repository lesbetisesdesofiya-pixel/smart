<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsAppConversation;
use App\Models\WhatsAppMessage;
use App\Services\ZernioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsAppController extends Controller
{
    public function __construct(
        private ZernioService $zernio
    ) {}

    public function conversations(Request $request): JsonResponse
    {
        $conversations = WhatsAppConversation::query()
            ->with('latestMessage')
            ->orderByDesc('last_message_at')
            ->paginate(20);

        return response()->json($conversations);
    }

    public function messages(WhatsAppConversation $conversation, Request $request): JsonResponse
    {
        $messages = WhatsAppMessage::where('conversation_id', $conversation->id)
            ->orderBy('sent_at')
            ->paginate(50);

        return response()->json([
            'conversation' => $conversation,
            'messages' => $messages,
        ]);
    }

    public function sendMessage(WhatsAppConversation $conversation, Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:4096',
            'buttons' => 'nullable|array|max:3',
            'buttons.*.title' => 'required|string|max:20',
            'buttons.*.payload' => 'required|string',
            'quickReplies' => 'nullable|array|max:13',
            'quickReplies.*.title' => 'required|string|max:20',
            'quickReplies.*.payload' => 'required|string',
            'interactive' => 'nullable|array',
            'interactive.type' => 'required_with:interactive|string|in:cta_url,list',
            'interactive.body.text' => 'required_with:interactive|string',
            'interactive.action.name' => 'required_with:interactive|string',
            'interactive.action.parameters.display_text' => 'required_with:interactive|string|max:20',
            'interactive.action.parameters.url' => 'required_with:interactive|url',
        ]);

        if (!$conversation->isReplyWindowOpen()) {
            return response()->json([
                'error' => 'La fenêtre de réponse de 24h est fermée. Attendez un nouveau message de l\'utilisateur.',
            ], 422);
        }

        $options = [];
        if ($request->has('buttons')) {
            $options['buttons'] = $request->input('buttons');
        }
        if ($request->has('quickReplies')) {
            $options['quickReplies'] = $request->input('quickReplies');
        }

        if ($request->has('interactive')) {
            $options['interactive'] = $request->input('interactive');
        }

        $result = $this->zernio->sendMessage(
            $conversation->zernio_conversation_id,
            $conversation->account_id,
            $request->input('message'),
            null,
            $options
        );

        if (!$result) {
            return response()->json([
                'error' => 'Échec de l\'envoi du message via Zernio.',
            ], 502);
        }

        $message = WhatsAppMessage::create([
            'conversation_id' => $conversation->id,
            'zernio_message_id' => $result['data']['messageId'] ?? null,
            'direction' => 'outgoing',
            'message' => $request->input('message'),
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        $conversation->update([
            'last_message' => $request->input('message'),
            'last_message_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $message,
        ]);
    }
}
