import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../api';
import { Avatar } from '../components/Avatar';

interface Contact {
  id: number;
  type: string;
  nom_complet: string;
  classes: string[];
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

interface MessagesScreenProps {
  onUnreadCountChange?: (count: number) => void;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ onUnreadCountChange }) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [profs, setProfs] = useState<Contact[]>([]);
  const [admins, setAdmins] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [newConvTarget, setNewConvTarget] = useState<Contact | null>(null);
  const [newConvMsg, setNewConvMsg] = useState('');
  const [newConvSending, setNewConvSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const [resConv, resContacts] = await Promise.all([
        apiFetch('/parent/messaging').catch(() => null),
        apiFetch('/parent/contacts').catch(() => null),
      ]);
      if (resConv?.ok) {
        const data = await resConv.json();
        const convs = Array.isArray(data) ? data : [];
        setConversations(convs);
        const total = convs.reduce((sum: number, c: ConversationItem) => sum + (c.unread_count || 0), 0);
        onUnreadCountChange?.(total);
      }
      if (resContacts?.ok) {
        const data = await resContacts.json();
        setProfs(data.profs || []);
        setAdmins(data.admins || []);
      }
    } catch {}
    setLoading(false);
  }, [onUnreadCountChange]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    if (!convId) return;
    setLoadingMessages(true);
    try {
      const res = await apiFetch(`/parent/messaging/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (activeConvId) loadMessages(activeConvId);
  }, [activeConvId, loadMessages]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConvId || sending) return;
    setSending(true);
    try {
      const res = await apiFetch(`/parent/messaging/${activeConvId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: newMessage }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        loadConversations();
      }
    } catch {}
    setSending(false);
  };

  const handleStartConversation = async () => {
    if (!newConvTarget || !newConvMsg.trim() || newConvSending) return;
    setNewConvSending(true);
    try {
      const res = await apiFetch('/parent/messaging/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eleve_id: 1,
          prof_id: newConvTarget.type === 'prof' ? newConvTarget.id : undefined,
          admin_id: newConvTarget.type === 'admin' ? newConvTarget.id : undefined,
          subject: `Message à ${newConvTarget.nom_complet}`,
          contenu: newConvMsg,
        }),
      });
      if (res.ok) {
        setShowNewConv(false);
        setNewConvTarget(null);
        setNewConvMsg('');
        await loadConversations();
      }
    } catch {}
    setNewConvSending(false);
  };

  // Filter contacts that don't have an existing conversation yet
  const existingContactIds = new Set(conversations.map(c => c.other_party?.id));
  const availableProfs = profs.filter(p => !existingContactIds.has(p.id));
  const availableAdmins = admins.filter(a => !existingContactIds.has(a.id));
  const hasContacts = availableProfs.length > 0 || availableAdmins.length > 0;

  const activeConv = conversations.find(c => c.id === activeConvId);

  // ─── Chat view ───
  if (activeConvId && activeConv) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] pb-20">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
          <button onClick={() => { setActiveConvId(''); loadConversations(); }} className="p-1 cursor-pointer">
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </button>
          <Avatar name={activeConv.other_party?.nom_complet || ''} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#0b1c30] truncate">{activeConv.other_party?.nom_complet}</p>
            {activeConv.eleve && (
              <p className="text-[10px] text-slate-400">{activeConv.eleve.nom_complet} — {activeConv.eleve.classe}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loadingMessages ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">Aucun message</p>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender_type === 'ParentModel';
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                    isMine
                      ? 'bg-[#002366] text-white rounded-br-md'
                      : 'bg-slate-100 text-[#0b1c30] rounded-bl-md'
                  }`}>
                    {!isMine && (
                      <p className="text-[10px] font-bold mb-1 opacity-70">{msg.sender_name}</p>
                    )}
                    <p className="text-xs leading-relaxed">{msg.contenu}</p>
                    <p className={`text-[9px] mt-1 ${isMine ? 'text-white/50' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        <div className="px-4 py-3 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Écrire un message..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs outline-none focus:border-[#002366]"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="w-10 h-10 bg-[#002366] rounded-full flex items-center justify-center disabled:opacity-40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-white text-lg">send</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── New conversation modal ───
  if (showNewConv) {
    return (
      <div className="pb-24 px-4 max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <button onClick={() => { setShowNewConv(false); setNewConvTarget(null); }} className="p-1 cursor-pointer">
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold text-[#0b1c30]">Nouveau message</h2>
        </div>

        {!newConvTarget ? (
          <div className="space-y-3">
            {availableAdmins.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">Administration</p>
                {availableAdmins.map(a => (
                  <button
                    key={`admin-${a.id}`}
                    onClick={() => setNewConvTarget(a)}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-[#002366] transition-colors cursor-pointer mb-2"
                  >
                    <Avatar name={a.nom_complet} size="sm" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#0b1c30]">{a.nom_complet}</p>
                      <p className="text-[10px] text-slate-400">Administration</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {availableProfs.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">Professeurs</p>
                {availableProfs.map(p => (
                  <button
                    key={`prof-${p.id}`}
                    onClick={() => setNewConvTarget(p)}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-[#002366] transition-colors cursor-pointer mb-2"
                  >
                    <Avatar name={p.nom_complet} size="sm" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#0b1c30]">{p.nom_complet}</p>
                      <p className="text-[10px] text-slate-400">{p.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!hasContacts && (
              <p className="text-center text-xs text-slate-400 py-8">Aucun contact disponible</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
              <Avatar name={newConvTarget.nom_complet} size="sm" />
              <div>
                <p className="text-sm font-bold text-[#0b1c30]">{newConvTarget.nom_complet}</p>
                <p className="text-[10px] text-slate-400">{newConvTarget.subtitle}</p>
              </div>
            </div>
            <textarea
              rows={4}
              value={newConvMsg}
              onChange={(e) => setNewConvMsg(e.target.value)}
              placeholder="Écrivez votre message..."
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#002366] resize-none"
            />
            <button
              onClick={handleStartConversation}
              disabled={!newConvMsg.trim() || newConvSending}
              className="w-full py-3 bg-[#002366] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {newConvSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-base">send</span>
              )}
              Envoyer
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Main list ───
  return (
    <div className="space-y-4 pb-24 px-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Messages</h2>
          <p className="text-xs text-[#757682] mt-0.5">Conversations avec l'équipe pédagogique</p>
        </div>
        {hasContacts && (
          <button
            onClick={() => setShowNewConv(true)}
            className="w-10 h-10 bg-[#002366] rounded-full flex items-center justify-center shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-white">edit</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* Existing conversations */}
          {conversations.length > 0 && (
            <div className="space-y-2">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className="w-full bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 hover:shadow-md transition-all text-left cursor-pointer"
                >
                  <Avatar name={conv.other_party?.nom_complet || ''} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#0b1c30] truncate">{conv.other_party?.nom_complet}</p>
                      {conv.last_message && (
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {new Date(conv.last_message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {conv.eleve && (
                      <p className="text-[10px] text-slate-400">{conv.eleve.nom_complet} — {conv.eleve.classe}</p>
                    )}
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {conv.last_message?.contenu || 'Aucun message'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 bg-[#002366] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Available contacts */}
          {hasContacts && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 mt-4">
                {conversations.length > 0 ? 'Nouveau message à :' : 'Contacter :'}</p>
              {availableAdmins.map(a => (
                <button
                  key={`admin-${a.id}`}
                  onClick={() => { setShowNewConv(true); setNewConvTarget(a); }}
                  className="w-full bg-white rounded-2xl border border-dashed border-slate-200 p-4 flex items-center gap-3 hover:border-[#002366] transition-all text-left cursor-pointer"
                >
                  <Avatar name={a.nom_complet} size="md" />
                  <div>
                    <p className="text-sm font-bold text-[#0b1c30]">{a.nom_complet}</p>
                    <p className="text-[10px] text-slate-400">Administration</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 ml-auto text-lg">chat_bubble</span>
                </button>
              ))}
              {availableProfs.map(p => (
                <button
                  key={`prof-${p.id}`}
                  onClick={() => { setShowNewConv(true); setNewConvTarget(p); }}
                  className="w-full bg-white rounded-2xl border border-dashed border-slate-200 p-4 flex items-center gap-3 hover:border-[#002366] transition-all text-left cursor-pointer"
                >
                  <Avatar name={p.nom_complet} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0b1c30]">{p.nom_complet}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.subtitle}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-lg">chat_bubble</span>
                </button>
              ))}
            </div>
          )}

          {conversations.length === 0 && !hasContacts && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">chat</span>
              <p className="text-sm text-slate-400 font-medium">Aucun contact disponible</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
