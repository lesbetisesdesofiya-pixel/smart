<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppConversation extends Model
{
    protected $table = 'whatsapp_conversations';

    protected $fillable = [
        'zernio_conversation_id',
        'account_id',
        'participant_phone',
        'participant_name',
        'last_message',
        'last_message_at',
        'can_reply',
        'state',
        'state_data',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
            'can_reply' => 'boolean',
            'state_data' => 'array',
        ];
    }

    public function messages(): HasMany
    {
        return $this->hasMany(WhatsAppMessage::class, 'conversation_id');
    }

    public function latestMessage()
    {
        return $this->hasOne(WhatsAppMessage::class, 'conversation_id')->latestOfMany();
    }

    public function markCanReply(): void
    {
        $this->update([
            'can_reply' => true,
            'last_message_at' => now(),
        ]);
    }

    public function markCannotReply(): void
    {
        $this->update(['can_reply' => false]);
    }

    public function isReplyWindowOpen(): bool
    {
        if (!$this->can_reply || !$this->last_message_at) {
            return false;
        }

        return $this->last_message_at->addHours(24)->isFuture();
    }

    public function setState(?string $state, array $data = []): void
    {
        $this->update([
            'state' => $state,
            'state_data' => $data,
        ]);
    }

    public function resetState(): void
    {
        $this->setState(null, []);
    }
}
