<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Route broadcast channels for ClassiNote conversations.
| Each authenticated user can listen on their private conversation channel.
|
*/

// Private channel for conversation messages
// Usage: Echo.private(`conversation.{id}`)
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = \App\Models\Conversation::findOrFail($conversationId);

    // Admin can access all conversations in their school
    if ($user->role === 'admin') {
        return $user->schools()->where('schools.id', $conversation->school_id)->exists();
    }

    // Prof can access conversations where they are participant
    if ($user instanceof \App\Models\Prof) {
        return $conversation->prof_id === $user->id
            || $conversation->school_id === $user->school_id;
    }

    // Parent can access conversations where they are participant
    if ($user instanceof \App\Models\ParentModel) {
        return $conversation->parent_id === $user->id;
    }

    return false;
});

// Private channel for user notifications
// Usage: Echo.private(`user.{userId}`)
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
