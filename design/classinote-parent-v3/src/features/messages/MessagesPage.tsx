import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { Card } from '@/shared/components/ui/Card';
import { SkeletonList } from '@/shared/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const [selectedConv, setSelectedConv] = useState<any>(null);

  const { data: conversations, isLoading, error, refetch } = useQuery({
    queryKey: ['parent-conversations'],
    queryFn: async () => {
      const res = await apiFetch('/parent/messaging');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading) return <div className="px-5 pb-28 max-w-lg mx-auto pt-4"><SkeletonList /></div>;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  if (selectedConv) {
    return <ChatView conversation={selectedConv} onBack={() => setSelectedConv(null)} />;
  }

  const convs = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-3 pt-4">
      {convs.length === 0 ? (
        <EmptyState icon={<MessageCircle className="w-8 h-8" />} title="Aucune conversation" description="Démarrez une discussion depuis l'école." />
      ) : (
        convs.map((conv: any, i: number) => (
          <Card key={conv.id} className="p-4" delay={0.05 + i * 0.03} onClick={() => setSelectedConv(conv)}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(conv.prof?.nom || conv.subject || 'C')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{conv.prof ? `${conv.prof.prenom} ${conv.prof.nom}` : conv.subject || 'Conversation'}</p>
                <p className="text-xs text-gray-400 truncate">{conv.last_message?.contenu || 'Aucun message'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-gray-300">{conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                {conv.unread_count > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full mt-1">{conv.unread_count}</span>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

const ChatView: React.FC<{ conversation: any; onBack: () => void }> = ({ conversation, onBack }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const res = await apiFetch(`/parent/messaging/${conversation.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch {} finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await apiFetch(`/parent/messaging/${conversation.id}/send`, {
        method: 'POST',
        body: JSON.stringify({ contenu: input.trim() }),
      });
      if (res.ok) {
        setInput('');
        await loadMessages();
      }
    } catch {} finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-60px)] max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-xl cursor-pointer"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy-800 to-navy-500 flex items-center justify-center text-white text-xs font-bold">
          {(conversation.prof?.nom || 'C')[0].toUpperCase()}
        </div>
        <p className="text-sm font-bold text-gray-900">{conversation.prof ? `${conversation.prof.prenom} ${conversation.prof.nom}` : 'Conversation'}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-navy-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">Aucun message</p>
        ) : (
          messages.map((msg: any) => {
            const isMine = msg.sender_type === 'App\\Models\\ParentModel' || msg.sender_type === 'parent';
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  isMine
                    ? 'bg-navy-800 text-white rounded-br-md'
                    : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.contenu}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200/60' : 'text-gray-300'}`}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Votre message..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-navy-800 text-white rounded-2xl flex items-center justify-center hover:bg-navy-700 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
