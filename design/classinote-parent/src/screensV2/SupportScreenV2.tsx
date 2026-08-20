import React, { useState } from 'react';
import { apiFetch } from '../api';

export const SupportScreenV2: React.FC = () => {
  const [bugSubject, setBugSubject] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [review, setReview] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!bugSubject.trim() && !bugDesc.trim() && !review.trim() && !suggestion.trim()) {
      setError('Remplissez au moins un champ.');
      return;
    }
    setSending(true);
    try {
      const promises: Promise<any>[] = [];
      if (bugSubject.trim() || bugDesc.trim()) {
        promises.push(apiFetch('/parent/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'bug', subject: bugSubject, contenu: bugDesc }) }));
      }
      if (review.trim()) {
        promises.push(apiFetch('/parent/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'avis', contenu: review }) }));
      }
      if (suggestion.trim()) {
        promises.push(apiFetch('/parent/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'suggestion', contenu: suggestion }) }));
      }
      const results = await Promise.all(promises);
      if (results.every(r => r.ok)) {
        setSent(true);
        setTimeout(() => { setSent(false); setBugSubject(''); setBugDesc(''); setReview(''); setSuggestion(''); }, 2500);
      } else {
        setError("Erreur lors de l'envoi.");
      }
    } catch {
      setError('Erreur reseau.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto">
      <div className="pt-2 mb-5">
        <h1 className="text-lg font-bold text-[#00113a]">Assistance</h1>
        <p className="text-xs text-gray-400">Un probleme ? Une idee ? Ecrivez-nous.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Bug */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-rose-500 text-lg">report</span>
            </div>
            <p className="text-sm font-bold text-[#00113a]">Signaler un probleme</p>
          </div>
          <input type="text" value={bugSubject} onChange={e => setBugSubject(e.target.value)}
            placeholder="Sujet du probleme..."
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#375ca6]" />
          <textarea rows={3} value={bugDesc} onChange={e => setBugDesc(e.target.value)}
            placeholder="Decrivez le probleme..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#375ca6] resize-none" />
        </div>

        {/* Review */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#002366]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#002366] text-lg">star_half</span>
            </div>
            <p className="text-sm font-bold text-[#00113a]">Donner un avis</p>
          </div>
          <textarea rows={3} value={review} onChange={e => setReview(e.target.value)}
            placeholder="Qu'appréciez-vous sur ClassiNote ?"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#375ca6] resize-none" />
        </div>

        {/* Suggestion */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-500 text-lg">lightbulb</span>
            </div>
            <p className="text-sm font-bold text-[#00113a]">Suggerer une fonctionnalite</p>
          </div>
          <textarea rows={3} value={suggestion} onChange={e => setSuggestion(e.target.value)}
            placeholder="Une idee pour ameliorer l'application ?"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#375ca6] resize-none" />
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 text-center font-semibold">{error}</div>
        )}

        <button type="submit" disabled={sending || sent}
          className={`w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-md transition-all ${sent ? 'bg-emerald-600' : 'bg-[#002366] hover:bg-[#001a4d]'}`}>
          {sending ? 'Envoi en cours...' : sent ? 'Message envoye !' : 'Envoyer'}
        </button>

        <p className="text-center text-xs text-gray-300">Reponse sous 24 a 48 heures.</p>
      </form>
    </div>
  );
};
