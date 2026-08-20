import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, Shield, Eye, RefreshCw } from "lucide-react";
import { apiFetch } from "../api";

interface ConversationMessage {
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
  studentName: string;
  className: string;
  parentName: string;
  teacherName: string;
  subjectTopic: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: string;
  type: string;
}

interface ConversationsManagerProps {
  conversations: ConversationItem[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationItem[]>>;
}

export const ConversationsManager: React.FC<ConversationsManagerProps> = ({
  conversations,
}) => {
  const [activeThreadId, setActiveThreadId] = useState<string>(conversations[0]?.id || "");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeThread = conversations.find((c) => c.id === activeThreadId);

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await apiFetch(`/school-admin/messaging/${convId}/messages`);
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
    if (activeThreadId) {
      loadMessages(activeThreadId);
    }
  }, [activeThreadId, loadMessages]);

  const filtered = conversations.filter((c) =>
    c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.parentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <span>Supervision des Conversations</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Vue d'ensemble des échanges entre parents et professeurs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Mode Lecture Seule
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[520px]">
        {/* Left: Thread List */}
        <div className="border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="p-2 border-b border-slate-100 bg-white">
            <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">
              {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs">
                Aucune conversation
              </div>
            )}
            {filtered.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`w-full text-left p-3.5 transition-all block ${
                    isActive ? "bg-blue-50/90 border-l-4 border-blue-600" : "hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {thread.studentName}
                    </span>
                    <span className="text-[10px] text-slate-400">{thread.lastMessageTime}</span>
                  </div>
                  <p className="text-[11px] text-blue-700 font-medium mt-0.5">{thread.teacherName} ↔ {thread.parentName}</p>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-1">{thread.lastMessage || 'Aucun message'}</p>
                  {thread.unreadCount > 0 && (
                    <span className="inline-block mt-1 bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {thread.unreadCount} non lu{thread.unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Messages */}
        {activeThread ? (
          <div className="md:col-span-2 flex flex-col h-full bg-white">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900">
                {activeThread.subjectTopic || 'Discussion'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Parent: <strong>{activeThread.parentName}</strong> | Professeur:{" "}
                <strong>{activeThread.teacherName}</strong>
                {activeThread.className && <> | Classe: <strong>{activeThread.className}</strong></>}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 min-h-[300px]">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                  Aucun message dans cette conversation
                </div>
              ) : (
                messages.map((m) => {
                  const isTeacher = m.sender_type === 'Prof';
                  const isParent = m.sender_type === 'Parent';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isTeacher ? 'items-start' : 'items-end'}`}
                    >
                      <div className="text-[10px] text-slate-400 font-semibold mb-1">
                        <span>{m.sender_name}</span> • <span>{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-md p-3 rounded-2xl text-xs ${
                          isTeacher
                            ? "bg-blue-600 text-white font-medium"
                            : isParent
                            ? "bg-white text-slate-800 border border-slate-200 shadow-2xs"
                            : "bg-slate-900 text-white font-medium"
                        }`}
                      >
                        {m.contenu}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] text-slate-400 font-medium">
                Mode observation — vous consultez les échanges
              </span>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 flex items-center justify-center p-8 text-slate-400 text-xs">
            Sélectionnez une conversation pour afficher les messages
          </div>
        )}
      </div>
    </div>
  );
};
