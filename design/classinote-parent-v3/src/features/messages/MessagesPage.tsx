import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback'
import { useDashboard } from '@/shared/stores/stores'
import { sendMessage, fetchMessages } from '@/shared/api/client'
import { MessageCircle, ArrowLeft, Send, ChevronRight } from 'lucide-react'

export const MessagesPage: React.FC = () => {
  const { data, isLoading, error } = useDashboard()
  const [selectedConv, setSelectedConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id).then((res: any) => {
        setMessages(res.messages || res || [])
      }).catch(() => setMessages(selectedConv.messages || []))
    }
  }, [selectedConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) return <div className="p-6 animate-pulse space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-3xl" />)}</div>
  if (error) return <ErrorState message="Impossible de charger les messages" />

  const conversations = data?.conversations ?? []

  if (!conversations.length) return <EmptyState icon={<MessageCircle className="w-12 h-12" />} title="Aucune conversation" description="Aucune conversation pour le moment" />

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      await sendMessage(selectedConv.id, newMessage.trim())
      setMessages(prev => [...prev, { contenu: newMessage.trim(), date: new Date().toISOString(), sender: 'me' }])
      setNewMessage('')
    } catch {
      setMessages(prev => [...prev, { contenu: newMessage.trim(), date: new Date().toISOString(), sender: 'me' }])
      setNewMessage('')
    } finally {
      setSending(false)
    }
  }

  if (selectedConv) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] max-w-2xl mx-auto">
        <div className="p-4 flex items-center gap-3 border-b border-gray-100 bg-white">
          <button onClick={() => setSelectedConv(null)} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-navy-800" />
          </button>
          <div className="w-10 h-10 rounded-full bg-navy-800/10 flex items-center justify-center text-navy-800 font-bold">
            {(selectedConv.prof?.prenom || selectedConv.nom || 'P').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-navy-800">{selectedConv.prof ? `${selectedConv.prof.prenom} ${selectedConv.prof.nom}` : selectedConv.nom || 'Conversation'}</h2>
            {selectedConv.matiere && <p className="text-xs text-gray-400">{selectedConv.matiere}</p>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg: any, i: number) => {
            const isMe = msg.sender_type === 'App\\Models\\ParentModel' || msg.sender === 'me'
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-navy-800 text-white rounded-br-md' : 'bg-gray-100 text-navy-800 rounded-bl-md'}`}>
                  <p className="leading-relaxed">{msg.contenu || msg.message || msg.texte}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
                    {msg.date ? new Date(msg.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Écrire un message..."
              className="flex-1 px-4 py-3 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="w-11 h-11 rounded-full bg-navy-800 text-white flex items-center justify-center disabled:opacity-40 hover:bg-navy-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy-800 font-inter">Messages</h1>
        <p className="text-gray-500 text-sm">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-2">
        {conversations.map((conv: any, i: number) => (
          <Card
            key={i}
            className="p-4 rounded-3xl shadow-card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedConv(conv)}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy-800 to-navy-600 flex items-center justify-center text-white font-bold">
                {(conv.prof?.prenom || conv.nom || 'P').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-navy-800 truncate">{conv.prof ? `${conv.prof.prenom} ${conv.prof.nom}` : conv.nom || conv.subject || 'Conversation'}</h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate mt-1">{conv.last_message?.contenu || ''}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
