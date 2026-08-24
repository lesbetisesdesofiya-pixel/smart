import React, { useState } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { useDashboard } from '@/shared/stores/stores'
import { Send, ChevronDown, CheckCircle, Bug, Lightbulb, MessageSquare } from 'lucide-react'

type TicketType = 'bug' | 'suggestion' | 'avis'

const ticketTypes: { key: TicketType; label: string; Icon: typeof Bug }[] = [
  { key: 'bug', label: 'Bug', Icon: Bug },
  { key: 'suggestion', label: 'Suggestion', Icon: Lightbulb },
  { key: 'avis', label: 'Avis', Icon: MessageSquare },
]

const faqItems = [
  { q: 'Comment consulter les notes de mon enfant ?', a: "Rendez-vous dans la section Notes depuis le menu principal. Vous y trouverez toutes les notes par matiere et par trimestre." },
  { q: 'Comment signaler une absence ?', a: "Contactez directement l'etablissement via la section Messages ou envoyez un justificatif via le formulaire de support." },
  { q: 'Les paiements sont-ils securises ?', a: 'Oui, toutes les transactions sont securisees et chiffrees. Vous pouvez suivre vos paiements dans la section dediee.' },
  { q: 'Comment contacter un professeur ?', a: 'Utilisez la section Messages pour envoyer un message direct au professeur concerne.' },
  { q: 'Puis-je modifier mes informations ?', a: "Les informations de l'eleve sont gerees par l'etablissement. Contactez-les pour toute modification." },
]

export const SupportPage: React.FC = () => {
  useDashboard()
  const [ticketType, setTicketType] = useState<TicketType>('suggestion')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSend = () => {
    if (!message.trim()) return
    setSent(true)
    setTimeout(() => { setSent(false); setMessage('') }, 3000)
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 672, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0a1642' }}>Support</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Nous sommes la pour vous aider</p>
      </div>

      <Card style={{ padding: 24, borderRadius: 24, boxShadow: '0 4px 24px rgba(0,35,102,0.06)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0a1642' }}>Nous contacter</h2>

        <div style={{ display: 'flex', gap: 8 }}>
          {ticketTypes.map(t => (
            <button
              key={t.key}
              onClick={() => setTicketType(t.key)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 0', borderRadius: 16, fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                background: ticketType === t.key ? '#0a1642' : '#f3f4f6',
                color: ticketType === t.key ? '#fff' : '#4b5563',
                boxShadow: ticketType === t.key ? '0 4px 12px rgba(10,22,66,0.3)' : 'none',
                border: 'none',
              }}
            >
              <t.Icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Decrivez votre demande..."
          rows={5}
          style={{
            width: '100%', paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
            borderRadius: 16, background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 14,
            resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />

        <button
          onClick={handleSend}
          disabled={!message.trim()}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 0', borderRadius: 16, background: '#0a1642', color: '#fff',
            fontWeight: 500, cursor: 'pointer', border: 'none', opacity: !message.trim() ? 0.4 : 1,
            transition: 'all 0.2s',
          }}
        >
          {sent ? (
            <>
              <CheckCircle size={20} />
              Envoye !
            </>
          ) : (
            <>
              <Send size={20} />
              Envoyer
            </>
          )}
        </button>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0a1642' }}>Questions frequentes</h2>
        {faqItems.map((item, i) => (
          <Card key={i} style={{ borderRadius: 24, boxShadow: '0 4px 24px rgba(0,35,102,0.06)', overflow: 'hidden', padding: 0 }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{ fontWeight: 500, color: '#0a1642', fontSize: 14, paddingRight: 16 }}>{item.q}</span>
              <ChevronDown
                size={20}
                style={{
                  color: '#9ca3af', flexShrink: 0, transition: 'transform 0.2s',
                  transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>
            {openFaq === i && (
              <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}>
                <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>{item.a}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
