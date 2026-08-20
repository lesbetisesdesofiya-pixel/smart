import React, { useState, useEffect, useCallback } from 'react';
import { ScreenType } from '../../types';
import { apiFetch } from '../../api';

interface Message {
  id: string;
  sender_type: string;
  sender_id: number;
  sender_name: string;
  contenu: string;
  lu: boolean;
  created_at: string;
}

interface ConversationItem {
  id: string;
  type: string;
  subject: string;
  eleve: { id: number; nom_complet: string; classe: string } | null;
  other_party: { id: number; nom_complet: string; role: string };
  last_message: { contenu: string; created_at: string } | null;
  unread_count: number;
}

interface MessagingScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const MessagingScreen: React.FC<MessagingScreenProps> = ({ onNavigate }) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      const res = await apiFetch('/teacher/messaging');
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await apiFetch(`/teacher/messaging/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      setConversations(prev => prev.map(c =>
        c.id === activeConvId ? { ...c, unread_count: 0 } : c
      ));
    }
  }, [activeConvId, loadMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId || sending) return;
    setSending(true);
    try {
      const res = await apiFetch(`/teacher/messaging/${activeConvId}/send`, {
        method: 'POST',
        body: JSON.stringify({ contenu: newMessage.trim() }),
      });
      if (res.ok) {
        const sent = await res.json();
        setMessages(prev => [...prev, sent]);
        setNewMessage('');
        setConversations(prev => prev.map(c =>
          c.id === activeConvId
            ? { ...c, last_message: { contenu: sent.contenu, created_at: sent.created_at } }
            : c
        ));
      }
    } catch (err) {
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  const filtered = conversations.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.other_party?.nom_complet?.toLowerCase().includes(q) ||
      c.eleve?.nom_complet?.toLowerCase().includes(q) ||
      c.subject?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <main className="max-w-screen-xl mx-auto px-4 md:px-10 pt-6 pb-32">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-screen-xl mx-auto px-4 md:px-10 pt-6 pb-32">
      <section className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant text-sm">
              Aucune conversation
            </div>
          )}
          {filtered.map((conv) => {
            const isSelected = conv.id === activeConvId;
            return (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`group border p-4 rounded-xl transition-all cursor-pointer flex gap-4 relative overflow-hidden active:scale-[0.98] ${
                  isSelected
                    ? 'bg-surface-container-low border-primary shadow-sm'
                    : 'bg-surface border-outline-variant/50 hover:bg-surface-container'
                }`}
              >
                {conv.unread_count > 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full" />
                )}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container border border-outline-variant flex items-center justify-center font-bold text-sm shadow-xs">
                    {conv.other_party?.nom_complet
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || '?'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-headline-sm text-sm font-bold text-on-surface truncate">
                      {conv.other_party?.nom_complet || 'Inconnu'}
                    </h3>
                    <span className="font-label-sm text-xs text-primary font-bold">
                      {conv.last_message?.created_at
                        ? new Date(conv.last_message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  <p className={`font-body-sm text-xs truncate mb-1 ${conv.unread_count > 0 ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                    {conv.last_message?.contenu || 'Aucun message'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-label-sm text-[11px] text-outline-variant">
                      {conv.eleve?.nom_complet || ''} {conv.eleve?.classe ? `(${conv.eleve.classe})` : ''}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-7 flex flex-col bg-surface border border-outline-variant/50 rounded-2xl shadow-md overflow-hidden h-[580px]">
          {activeConv ? (
            <>
              <div className="p-4 border-b border-outline-variant/40 flex items-center gap-3 bg-surface-container-lowest">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="material-symbols-outlined text-on-surface-variant text-xl cursor-pointer"
                >
                  arrow_back
                </button>
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container border border-outline-variant flex items-center justify-center font-bold text-xs shrink-0">
                  {activeConv.other_party?.nom_complet?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </div>
                <div>
                  <h4 className="font-label-md text-sm font-bold text-on-surface">
                    {activeConv.other_party?.nom_complet || 'Inconnu'}
                  </h4>
                  <span className="text-[11px] text-on-surface-variant">
                    {activeConv.eleve?.nom_complet || ''} — {activeConv.subject || 'Discussion'}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-tertiary/5">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-on-surface-variant text-xs">
                    Aucun message
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_type === 'Prof';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${isMe ? 'self-end flex-row-reverse' : ''}`}
                      >
                        {!isMe && (
                          <div className="shrink-0 pt-1">
                            <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-[10px]">
                              {msg.sender_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                            </div>
                          </div>
                        )}
                        <div className={`p-3.5 rounded-2xl text-xs shadow-xs ${
                          isMe
                            ? 'bg-primary text-white rounded-tr-xs'
                            : 'bg-secondary-container text-on-secondary-container rounded-tl-xs'
                        }`}>
                          <p className="leading-relaxed">{msg.contenu}</p>
                          <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'justify-end opacity-80' : 'opacity-70'}`}>
                            <span>{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <span className="material-symbols-outlined text-xs">done_all</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="p-3 bg-surface border-t border-outline-variant/40 flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrire un message..."
                    disabled={sending}
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-full outline-none focus:ring-1 focus:ring-primary text-sm disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="w-9 h-9 flex items-center justify-center bg-primary text-on-primary rounded-full shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-lg">
                    {sending ? 'hourglass_empty' : 'send'}
                  </span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
              Sélectionnez une conversation
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
