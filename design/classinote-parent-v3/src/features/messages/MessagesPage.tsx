import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { MessageCircle, ArrowLeft, Send, ChevronRight } from 'lucide-react'
import { useDashboard } from '@/shared/stores/stores'
import { sendMessage, fetchMessages } from '@/shared/api/client'

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

  if (isLoading)
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: 80, background: '#f3f4f6', borderRadius: 24 }} />
        ))}
      </div>
    )

  if (error)
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ fontSize: 14, color: '#ef4444' }}>Impossible de charger les messages</p>
      </div>
    )

  const conversations = data?.conversations ?? []

  if (!conversations.length)
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <MessageCircle size={48} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Aucune conversation</p>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Aucune conversation pour le moment</p>
      </div>
    )

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
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: 672, margin: '0 auto' }}>
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f3f4f6', background: '#fff' }}>
          <button onClick={() => setSelectedConv(null)} style={{ padding: 8, borderRadius: 9999, background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={20} style={{ color: '#0a1642' }} />
          </button>
          <div style={{ width: 40, height: 40, borderRadius: 9999, background: 'rgba(10,22,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a1642', fontWeight: 700 }}>
            {(selectedConv.prof?.prenom || selectedConv.nom || 'P').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontWeight: 600, color: '#0a1642' }}>{selectedConv.prof ? `${selectedConv.prof.prenom} ${selectedConv.prof.nom}` : selectedConv.nom || 'Conversation'}</h2>
            {selectedConv.matiere && <p style={{ fontSize: 12, color: '#9ca3af' }}>{selectedConv.matiere}</p>}
          </div>
        </div>

        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg: any, i: number) => {
            const isMe = msg.sender_type === 'App\\Models\\ParentModel' || msg.sender === 'me'
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '75%', padding: '12px 16px', borderRadius: 20, fontSize: 14,
                    background: isMe ? '#0a1642' : '#f3f4f6',
                    color: isMe ? '#fff' : '#0a1642',
                    borderBottomRightRadius: isMe ? 8 : 20,
                    borderBottomLeftRadius: isMe ? 20 : 8,
                  }}
                >
                  <p style={{ lineHeight: 1.6 }}>{msg.contenu || msg.message || msg.texte}</p>
                  <p style={{ fontSize: 12, marginTop: 4, color: isMe ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}>
                    {msg.date ? new Date(msg.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #f3f4f6', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ecrire un message..."
              style={{
                flex: 1, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                borderRadius: 9999, background: '#f3f4f6', fontSize: 14, border: 'none', outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              style={{
                width: 44, height: 44, borderRadius: 9999, background: '#0a1642', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: !newMessage.trim() || sending ? 0.4 : 1, cursor: 'pointer', border: 'none',
                transition: 'background 0.2s',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 672, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0a1642' }}>Messages</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {conversations.map((conv: any, i: number) => (
          <Card
            key={i}
            style={{ padding: 16, borderRadius: 24, boxShadow: '0 4px 24px rgba(0,35,102,0.06)', cursor: 'pointer' }}
            onClick={() => setSelectedConv(conv)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 9999,
                background: 'linear-gradient(135deg, #0a1642, #3b5998)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0,
              }}>
                {(conv.prof?.prenom || conv.nom || 'P').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontWeight: 600, color: '#0a1642', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.prof ? `${conv.prof.prenom} ${conv.prof.nom}` : conv.nom || conv.subject || 'Conversation'}
                  </h3>
                  <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>
                  {conv.last_message?.contenu || ''}
                </p>
              </div>
              <ChevronRight size={20} style={{ color: '#d1d5db', flexShrink: 0 }} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
