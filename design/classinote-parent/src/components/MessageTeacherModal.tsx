import React, { useState } from 'react';
import { apiFetch } from '../api';
import { Avatar } from './Avatar';

interface MessageTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient?: { id: string; name: string; subtitle: string } | null;
  eleveId?: number;
}

export const MessageTeacherModal: React.FC<MessageTeacherModalProps> = ({
  isOpen,
  onClose,
  recipient,
  eleveId,
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await apiFetch('/parent/messaging/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eleve_id: eleveId || 1,
          prof_id: recipient?.id || 1,
          subject: subject || 'Message',
          contenu: message,
        }),
      });
      if (res.ok) {
        setIsSent(true);
        setTimeout(() => {
          setIsSent(false);
          setSubject('');
          setMessage('');
          onClose();
        }, 1600);
      } else {
        const data = await res.json();
        setError(data.message || 'Erreur lors de l\'envoi');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
        {isSent ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
              <span className="material-symbols-outlined text-3xl">send</span>
            </div>
            <h3 className="text-lg font-bold text-[#00113a]">Message Envoyé !</h3>
            <p className="text-xs text-slate-500">Votre message a été transmis à l'équipe pédagogique.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <Avatar name={recipient ? recipient.name : "Professeur"} size="md" />
                <div>
                  <h3 className="text-sm font-bold text-[#00113a]">
                    Message à {recipient ? recipient.name : "l'Équipe Pédagogique"}
                  </h3>
                  <p className="text-[11px] text-[#757682]">
                    {recipient ? recipient.subtitle : "ClassiNote"}
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sujet</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Absence de mon enfant"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#002366]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Message *</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#002366] resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="flex-1 py-2.5 bg-[#002366] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-base">send</span>
                )}
                Envoyer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
