import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { apiFetch } from '@/shared/api/client';
import { Send, CheckCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const SupportPage: React.FC = () => {
  const [type, setType] = useState<'bug' | 'suggestion' | 'avis'>('suggestion');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await apiFetch('/parent/feedback', {
        method: 'POST',
        body: JSON.stringify({ type, contenu: message.trim() }),
      });
      if (res.ok) {
        setSent(true);
        setMessage('');
      } else {
        setError('Erreur lors de l\'envoi');
      }
    } catch {
      setError('Erreur réseau');
    } finally { setSending(false); }
  };

  const faq = [
    { q: 'Comment voir les notes de mon enfant ?', r: 'Allez dans l\'onglet "Notes" depuis le menu en bas de l\'écran.' },
    { q: 'Comment contacter un professeur ?', r: 'Allez dans "Messages" et démarrez une conversation avec le professeur souhaité.' },
    { q: 'Comment payer les frais scolaires ?', r: 'Consultez l\'onglet "Paiements" pour voir les frais dus et l\'historique.' },
  ];

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-4 pt-4">
      {/* Formulaire */}
      <Card className="p-5" delay={0}>
        <h3 className="text-base font-bold text-gray-900 mb-4">Nous contacter</h3>

        {/* Type */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'bug', label: 'Bug' },
            { id: 'suggestion', label: 'Suggestion' },
            { id: 'avis', label: 'Avis' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id as any)}
              className={`px-4 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                type === t.id ? 'bg-navy-800 text-white' : 'bg-gray-50 text-gray-500 border border-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Message */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Décrivez votre demande..."
          rows={4}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy-400"
        />

        {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
        {sent && (
          <div className="flex items-center gap-2 mt-3 text-emerald-600">
            <CheckCircle className="w-4 h-4" />
            <p className="text-sm font-bold">Message envoyé !</p>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="w-full mt-4 py-3 bg-navy-800 text-white font-bold text-sm rounded-2xl hover:bg-navy-700 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Envoi...' : 'Envoyer'}
        </button>
      </Card>

      {/* FAQ */}
      <Card className="p-5" delay={0.1}>
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-navy-600" />
          <h3 className="text-base font-bold text-gray-900">Questions fréquentes</h3>
        </div>
        <div className="space-y-2">
          {faq.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900 pr-4">{item.q}</p>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-500 leading-relaxed">{item.r}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
