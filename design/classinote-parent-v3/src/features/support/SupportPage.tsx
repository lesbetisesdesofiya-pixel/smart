import React, { useState } from 'react'
import { Card } from '@/shared/components/ui/Card'
import { useDashboard } from '@/shared/stores/stores'
import { HelpCircle, Send, ChevronDown, CheckCircle, Bug, Lightbulb, MessageSquare } from 'lucide-react'

type TicketType = 'bug' | 'suggestion' | 'avis'

const ticketTypes: { key: TicketType; label: string; icon: React.ReactNode }[] = [
  { key: 'bug', label: 'Bug', icon: <Bug className="w-4 h-4" /> },
  { key: 'suggestion', label: 'Suggestion', icon: <Lightbulb className="w-4 h-4" /> },
  { key: 'avis', label: 'Avis', icon: <MessageSquare className="w-4 h-4" /> },
]

const faqItems = [
  { q: 'Comment consulter les notes de mon enfant ?', a: 'Rendez-vous dans la section Notes depuis le menu principal. Vous y trouverez toutes les notes par matière et par trimestre.' },
  { q: 'Comment signaler une absence ?', a: 'Contactez directement l\'établissement via la section Messages ou envoyez un justificatif via le formulaire de support.' },
  { q: 'Les paiements sont-ils sécurisés ?', a: 'Oui, toutes les transactions sont sécurisées et chiffrées. Vous pouvez suivre vos paiements dans la section dédiée.' },
  { q: 'Comment contacter un professeur ?', a: 'Utilisez la section Messages pour envoyer un message direct au professeur concerné.' },
  { q: 'Puis-je modifier mes informations ?', a: 'Les informations de l\'élève sont gérées par l\'établissement. Contactez-les pour toute modification.' },
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
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy-800 font-inter">Support</h1>
        <p className="text-gray-500 text-sm">Nous sommes là pour vous aider</p>
      </div>

      <Card className="p-6 rounded-3xl shadow-card space-y-5">
        <h2 className="text-lg font-semibold text-navy-800">Nous contacter</h2>

        <div className="flex gap-2">
          {ticketTypes.map(t => (
            <button
              key={t.key}
              onClick={() => setTicketType(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all ${ticketType === t.key ? 'bg-navy-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Décrivez votre demande..."
          rows={5}
          className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800/30 transition-all"
        />

        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-navy-800 text-white font-medium disabled:opacity-40 hover:bg-navy-700 transition-colors"
        >
          {sent ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Envoyé !
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Envoyer
            </>
          )}
        </button>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-navy-800">Questions fréquentes</h2>
        {faqItems.map((item, i) => (
          <Card key={i} className="rounded-3xl shadow-card overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full p-5 flex items-center justify-between text-left"
            >
              <span className="font-medium text-navy-800 text-sm pr-4">{item.q}</span>
              <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
            </button>
            {openFaq === i && (
              <div className="px-5 pb-5">
                <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
