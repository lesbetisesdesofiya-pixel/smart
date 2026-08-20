import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../api';

interface Contact {
  id: number;
  type: string;
  nom_complet: string;
  matieres: string[];
  subtitle: string;
}

interface ConversationItem {
  id: string;
  type: string;
  subject: string;
  eleve: { id: number; nom_complet: string; classe: string } | null;
  other_party: { id: number; nom_complet: string; role: string } | null;
  last_message: { contenu: string; created_at: string } | null;
  unread_count: number;
}

interface Message {
  id: string;
  sender_type: string;
  sender_id: number;
  sender_name: string;
  contenu: string;
  lu: boolean;
  created_at: string;
}

export const MessagesScreenV2: React.FC<{ onChatOpen?: (open: boolean) => void }> = ({ onChatOpen }) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [profs, setProfs] = useState<Contact[]>([]);
  const [admins, setAdmins] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [eleveId, setEleveId] = useState<number | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load eleve_id
  useEffect(() => {
    apiFetch('/parent/enfants').then(res => {
      if (res.ok) return res.json();
    }).then(data => {
      if (data?.success && data.enfants?.length > 0) setEleveId(data.enfants[0].id);
    }).catch(() => {});
  }, []);

  // Load conversations and contacts
  const loadConvs = useCallback(async () => {
    try {
      const [resC, resCo] = await Promise.all([
        apiFetch('/parent/messaging').catch(() => null),
        apiFetch('/parent/contacts').catch(() => null),
      ]);
      if (resC?.ok) { const d = await resC.json(); setConversations(Array.isArray(d) ? d : []); }
      if (resCo?.ok) { const d = await resCo.json(); setProfs(d.profs || []); setAdmins(d.admins || []); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  // Load messages for active conversation
  const loadMsgs = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingMsgs(true);
    try {
      const res = await apiFetch(`/parent/messaging/${id}/messages`);
      if (res.ok) { const d = await res.json(); setMessages(Array.isArray(d) ? d : []); }
    } catch {} finally { setLoadingMsgs(false); }
  }, []);

  useEffect(() => {
    if (activeConvId) {
      setMessages([]);
      loadMsgs(activeConvId);
      onChatOpen?.(true);
    } else {
      onChatOpen?.(false);
    }
  }, [activeConvId, loadMsgs, onChatOpen]);

  // Auto-scroll on new messages
  useEffect(() => { chatRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvId || sending) return;
    setSending(true);
    try {
      const res = await apiFetch(`/parent/messaging/${activeConvId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: newMsg }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMsg('');
        loadConvs();
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch {} finally { setSending(false); }
  };

  // Start new conversation (directly open chat)
  const startNewConv = async (target: Contact) => {
    if (!eleveId) return;
    setSending(true);
    try {
      const res = await apiFetch('/parent/messaging/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eleve_id: eleveId,
          prof_id: target.type === 'prof' ? target.id : undefined,
          admin_id: target.type === 'admin' ? target.id : undefined,
          subject: `Message a ${target.nom_complet}`,
          contenu: 'Bonjour',
        }),
      });
      if (res.ok) {
        await loadConvs();
        // Find the new conversation and open it
        const resC = await apiFetch('/parent/messaging');
        if (resC.ok) {
          const convs = await resC.json();
          if (Array.isArray(convs)) {
            setConversations(convs);
            const newConv = convs.find((c: ConversationItem) => c.other_party?.id === target.id);
            if (newConv) setActiveConvId(String(newConv.id));
          }
        }
      }
    } catch {} finally { setSending(false); }
  };

  const existingIds = new Set(conversations.map(c => c.other_party?.id));
  const availProfs = profs.filter(p => !existingIds.has(p.id));
  const availAdmins = admins.filter(a => !existingIds.has(a.id));
  const activeConv = conversations.find(c => String(c.id) === String(activeConvId));

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2);

  const formatTime = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      if (diff < 86400000 && d.getDate() === now.getDate()) return "Aujourd'hui";
      if (diff < 172800000) return 'Hier';
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  // ─── Chat view (WhatsApp style) - hides bottom nav ───
  if (activeConvId && activeConv) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#efeae2]">
        {/* Chat header */}
        <div className="bg-[#002366] text-white px-4 py-3 flex items-center gap-3 shadow-md shrink-0">
          <button onClick={() => { setActiveConvId(''); loadConvs(); }} className="p-1">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
            {getInitials(activeConv.other_party?.nom_complet || '?')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{activeConv.other_party?.nom_complet}</p>
            {activeConv.eleve && (
              <p className="text-[10px] text-blue-200">{activeConv.eleve.nom_complet} — {activeConv.eleve.classe}</p>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {loadingMsgs ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-gray-300">chat</span>
              <p className="text-xs text-gray-400 mt-2">Aucun message. Commencez la conversation !</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender_type === 'ParentModel';
              const showDate = idx === 0 || formatDate(msg.created_at) !== formatDate(messages[idx - 1]?.created_at);

              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="bg-white/80 text-gray-500 text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl shadow-sm relative ${
                      isMine
                        ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-none'
                        : 'bg-white text-gray-900 rounded-tl-none'
                    }`}>
                      {!isMine && (
                        <p className="text-[10px] font-bold text-[#002366] mb-0.5">{msg.sender_name}</p>
                      )}
                      <p className="text-[13px] leading-relaxed pr-14">{msg.contenu}</p>
                      <div className={`absolute bottom-1 right-2 flex items-center gap-0.5 ${isMine ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                        {isMine && (
                          <span className="material-symbols-outlined text-sm text-blue-500">
                            {msg.lu ? 'done_all' : 'done'}
                          </span>
                        )}
                      </div>
                      {/* Bubble tail */}
                      {isMine ? (
                        <div className="absolute -right-1.5 bottom-0 w-3 h-3">
                          <svg viewBox="0 0 10 10" className="w-full h-full"><polygon points="0,0 10,0 0,10" fill="#dcf8c6"/></svg>
                        </div>
                      ) : (
                        <div className="absolute -left-1.5 bottom-0 w-3 h-3">
                          <svg viewBox="0 0 10 10" className="w-full h-full"><polygon points="10,0 10,10 0,0" fill="white"/></svg>
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={chatRef} />
        </div>

        {/* Input area - fixed at bottom, no bottom nav */}
        <div className="bg-[#f0f0f0] px-3 py-2 flex items-center gap-2 shrink-0 safe-area-bottom">
          <div className="flex-1 bg-white rounded-full flex items-center px-4 py-2.5 shadow-sm">
            <input
              ref={inputRef}
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ecrire un message..."
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMsg.trim() || sending}
            className="w-11 h-11 bg-[#002366] rounded-full flex items-center justify-center shadow-md disabled:opacity-50 shrink-0"
          >
            <span className="material-symbols-outlined text-white text-xl">
              {sending ? 'hourglass_empty' : 'send'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Conversation list (with bottom nav) ───
  return (
    <div className="pb-28 max-w-lg mx-auto">
      <div className="flex items-center justify-between px-5 pt-2 mb-3">
        <div>
          <h1 className="text-lg font-bold text-[#00113a]">Messages</h1>
          <p className="text-xs text-gray-400">Conversations avec l'ecole</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-6 h-6 border-2 border-[#375ca6] border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <>
          {/* Existing conversations */}
          {conversations.length > 0 && (
            <div className="divide-y divide-gray-100">
              {conversations.map(conv => (
                <button key={conv.id} onClick={() => setActiveConvId(String(conv.id))}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-12 h-12 rounded-full bg-[#002366] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {getInitials(conv.other_party?.nom_complet || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900 truncate">{conv.other_party?.nom_complet}</p>
                      {conv.last_message && (
                        <span className="text-[10px] text-gray-400 shrink-0">{formatDate(conv.last_message.created_at)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate flex-1">{conv.last_message?.contenu || 'Aucun message'}</p>
                      {conv.unread_count > 0 && (
                        <span className="ml-2 w-5 h-5 bg-[#002366] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* New contacts - clicking opens chat directly */}
          {(availAdmins.length + availProfs.length) > 0 && (
            <div className="px-5 mt-2">
              <p className="text-xs font-bold text-gray-400 mb-2 pt-3 border-t border-gray-100">
                {conversations.length > 0 ? 'Nouveau message' : 'Contacter'}
              </p>
              {availAdmins.map(a => (
                <button key={`a-${a.id}`} onClick={() => startNewConv(a)}
                  disabled={sending}
                  className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left disabled:opacity-50">
                  <div className="w-10 h-10 rounded-full bg-[#002366] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {getInitials(a.nom_complet)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{a.nom_complet}</p>
                    <p className="text-[10px] text-gray-400">Administration</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 text-lg">chat_bubble</span>
                </button>
              ))}
              {availProfs.map(p => (
                <button key={`p-${p.id}`} onClick={() => startNewConv(p)}
                  disabled={sending}
                  className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left disabled:opacity-50">
                  <div className="w-10 h-10 rounded-full bg-[#375ca6] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {getInitials(p.nom_complet)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{p.nom_complet}</p>
                    <p className="text-[10px] text-gray-400">{p.matieres?.join(', ') || 'Professeur'}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 text-lg">chat_bubble</span>
                </button>
              ))}
            </div>
          )}

          {conversations.length === 0 && (availAdmins.length + availProfs.length) === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-gray-200">chat</span>
              <p className="text-sm text-gray-400 mt-2">Aucun contact disponible.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
