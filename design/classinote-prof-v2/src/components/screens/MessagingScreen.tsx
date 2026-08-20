import React, { useState, useEffect, useCallback } from 'react';
import { ScreenType, Classe, Message, ConversationItem } from '../../types';
import { apiFetch } from '../../api';

interface Props {
  onNavigate: (screen: ScreenType) => void;
  classes: Classe[];
}

export const MessagingScreen: React.FC<Props> = ({ onNavigate, classes }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const allStudents: any[] = [];
      for (const classe of classes) {
        const res = await apiFetch(`/teacher/classes/${classe.id}/details`);
        if (res.ok) {
          const data = await res.json();
          (data || []).forEach((s: any) => {
            if (!allStudents.find(existing => existing.id === s.id)) {
              allStudents.push({ ...s, classe_libelle: classe.libelle, classe_id: classe.id });
            }
          });
        }
      }
      setStudents(allStudents);
      const convRes = await apiFetch('/teacher/messaging');
      if (convRes.ok) {
        const convData = await convRes.json();
        setConversations(Array.isArray(convData) ? convData : []);
      }
    } catch {} finally { setLoading(false); }
  }, [classes]);

  useEffect(() => { loadData(); }, [loadData]);

  const getConvForStudent = (studentId: number) => conversations.find(c => c.eleve?.id === studentId);

  const displayList = students
    .map(s => {
      const conv = getConvForStudent(s.id);
      return { ...s, conversation: conv, unread: conv?.unread_count || 0, lastMessageAt: conv?.last_message_at || '' };
    })
    .filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return s.nom_complet?.toLowerCase().includes(q) || `${s.prenom} ${s.nom}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.unread > 0 && b.unread === 0) return -1;
      if (a.unread === 0 && b.unread > 0) return 1;
      if (a.lastMessageAt && b.lastMessageAt) return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      return (a.nom_complet || '').localeCompare(b.nom_complet || '');
    });

  const handleSelectStudent = async (student: any) => {
    setActiveStudentId(student.id);
    setFirstMessage('');
    setShowChat(true);
    const conv = student.conversation;
    if (conv) {
      setActiveConvId(conv.id);
      loadMessages(conv.id);
    } else {
      setActiveConvId('');
      setMessages([]);
    }
  };

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await apiFetch(`/teacher/messaging/${convId}/messages`);
      if (res.ok) { const data = await res.json(); setMessages(Array.isArray(data) ? data : []); }
    } catch {} finally { setLoadingMessages(false); }
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = activeConvId ? newMessage.trim() : firstMessage.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      if (activeConvId) {
        const res = await apiFetch(`/teacher/messaging/${activeConvId}/send`, { method: 'POST', body: JSON.stringify({ contenu: content }) });
        if (res.ok) { const sent = await res.json(); setMessages(prev => [...prev, sent]); setNewMessage(''); }
      } else {
        const student = students.find(s => s.id === activeStudentId);
        if (!student) return;
        const parentId = student.parent_id;
        if (!parentId) { alert('Aucun parent lie a cet eleve'); setSending(false); return; }
        const res = await apiFetch('/teacher/messaging/start', {
          method: 'POST',
          body: JSON.stringify({ eleve_id: activeStudentId, parent_id: parentId, subject: `Concernant ${student.nom_complet}`, contenu: content }),
        });
        if (res.ok) {
          const data = await res.json();
          setActiveConvId(String(data.conversation_id));
          setFirstMessage('');
          await loadData();
          loadMessages(String(data.conversation_id));
        }
      }
    } catch {} finally { setSending(false); }
  };

  const activeStudent = students.find(s => s.id === activeStudentId);
  const activeConv = activeStudentId ? getConvForStudent(activeStudentId) : null;

  if (loading) return <div className="p-4 lg:p-8 flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-navy-200 border-t-violet-600 rounded-full animate-spin" /></div>;

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Left panel - Students list */}
      <div className={`w-full lg:w-[380px] lg:border-r border-navy-100 bg-white flex flex-col ${showChat ? 'hidden lg:flex' : 'flex'}`}>
        {/* Search */}
        <div className="p-3 border-b border-navy-100">
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Rechercher un eleve..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white" />
          </div>
        </div>

        {/* Students */}
        <div className="flex-1 overflow-y-auto">
          {displayList.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">Aucun eleve</div>}
          {displayList.map((student) => {
            const isSelected = student.id === activeStudentId;
            const hasUnread = student.unread > 0;
            const conv = student.conversation;
            const lastMsg = conv?.last_message;
            const time = lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <div key={student.id} onClick={() => handleSelectStudent(student)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${isSelected ? 'bg-navy-50' : 'hover:bg-gray-50'}`}>
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy-600 to-navy-500 flex items-center justify-center text-white text-sm font-bold">
                    {(student.prenom?.[0] || '') + (student.nom?.[0] || '') || '??'}
                  </div>
                  {hasUnread && <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">{student.unread}</div>}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className={`text-[15px] truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {student.nom_complet || `${student.prenom} ${student.nom}`}
                    </h3>
                    <span className={`text-[11px] shrink-0 ml-2 ${hasUnread ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>{time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className={`text-[13px] truncate ${hasUnread ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                      {lastMsg ? lastMsg.contenu : conv ? 'Aucun message' : <span className="text-navy-400 italic">Appuyez pour discuter</span>}
                    </p>
                    {hasUnread && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0 ml-2" />}
                  </div>
                  <p className="text-[11px] text-gray-300 mt-0.5">{student.classe_libelle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel - Chat */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] ${!showChat ? 'hidden lg:flex' : 'flex'}`}>
        {activeStudentId ? (
          <>
            {/* Chat header */}
            <div className="bg-navy-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
              <button onClick={() => setShowChat(false)} className="lg:hidden w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                {(activeStudent?.prenom?.[0] || '') + (activeStudent?.nom?.[0] || '') || '??'}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold">{activeStudent?.nom_complet || `${activeStudent?.prenom} ${activeStudent?.nom}`}</h4>
                <span className="text-[11px] opacity-80">{activeStudent?.classe_libelle}</span>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d5cfc4\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
              {activeConv ? (
                loadingMessages ? (
                  <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-navy-300 border-t-violet-600 rounded-full animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">Aucun message</div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_type === 'Prof';
                    const showTime = i === 0 || (i > 0 && new Date(msg.created_at).toDateString() !== new Date(messages[i-1].created_at).toDateString());
                    return (
                      <React.Fragment key={msg.id}>
                        {showTime && (
                          <div className="text-center my-2">
                            <span className="inline-block px-3 py-1 bg-white/80 rounded-full text-[11px] text-gray-500 shadow-sm">
                              {new Date(msg.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-0.5`}>
                          <div className={`max-w-[75%] px-3 py-2 rounded-lg shadow-sm ${isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                            <p className="text-[14px] text-gray-800 leading-relaxed">{msg.contenu}</p>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className="text-[11px] text-gray-400">{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <p className="text-sm">Envoyez un message au parent</p>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-[#f0ece4] flex items-center gap-2">
              <input type="text" value={activeConvId ? newMessage : firstMessage} onChange={(e) => activeConvId ? setNewMessage(e.target.value) : setFirstMessage(e.target.value)}
                placeholder="Tapez un message..." disabled={sending}
                className="flex-1 px-4 py-2.5 bg-white border-0 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-400 shadow-sm" />
              <button type="submit" disabled={(!activeConvId ? !firstMessage.trim() : !newMessage.trim()) || sending}
                className="w-10 h-10 flex items-center justify-center bg-navy-800 text-white rounded-full shadow-md hover:bg-navy-500 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-40">
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3 bg-[#f5f0eb]">
            <div className="w-20 h-20 rounded-full bg-navy-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <p className="text-lg font-medium text-gray-400">Selectionnez une conversation</p>
            <p className="text-sm text-gray-300">Choisissez un eleve pour discuter avec son parent</p>
          </div>
        )}
      </div>
    </div>
  );
};

