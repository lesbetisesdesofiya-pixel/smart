import React, { useState } from 'react';
import { apiFetch } from '../api';

interface SupportScreenProps {
  onSubmitSuccess?: () => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({ onSubmitSuccess }) => {
  const [bugSubject, setBugSubject] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);

  const [review, setReview] = useState('');
  const [suggestion, setSuggestion] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileAttach = () => {
    const fakeFileName = `capture_ecran_${Math.floor(Math.random() * 900 + 100)}.png`;
    setAttachment(fakeFileName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Submit all filled sections
    const hasBug = bugSubject.trim() || bugDesc.trim();
    const hasReview = review.trim();
    const hasSuggestion = suggestion.trim();

    if (!hasBug && !hasReview && !hasSuggestion) {
      setErrorMsg("Veuillez remplir au moins un champ.");
      return;
    }

    setIsSubmitting(true);
    try {
      const promises: Promise<any>[] = [];

      if (hasBug) {
        promises.push(apiFetch('/parent/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'bug', subject: bugSubject, contenu: bugDesc }),
        }));
      }
      if (hasReview) {
        promises.push(apiFetch('/parent/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'avis', contenu: review }),
        }));
      }
      if (hasSuggestion) {
        promises.push(apiFetch('/parent/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'suggestion', contenu: suggestion }),
        }));
      }

      const results = await Promise.all(promises);
      const allOk = results.every(r => r.ok);

      if (allOk) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setBugSubject('');
          setBugDesc('');
          setAttachment(null);
          setReview('');
          setSuggestion('');
          if (onSubmitSuccess) onSubmitSuccess();
        }, 2500);
      } else {
        setErrorMsg("Erreur lors de l'envoi. Veuillez réessayer.");
      }
    } catch {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-28 px-4 sm:px-5 max-w-lg mx-auto animate-fadeIn">
      {/* Welcome Header Section */}
      <section className="pt-2">
        <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Besoin d'aide ?</h2>
        <p className="text-xs text-[#444650] mt-1 leading-relaxed">
          Nous sommes là pour vous accompagner et améliorer votre expérience.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Signaler un problème */}
        <section className="bg-white rounded-[24px] p-5 sm:p-6 shadow-card border border-slate-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffdad6] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#ba1a1a]">report</span>
            </div>
            <h3 className="text-base font-bold text-[#0b1c30]">Signaler un problème</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Sujet</label>
              <input
                type="text"
                value={bugSubject}
                onChange={(e) => setBugSubject(e.target.value)}
                placeholder="Ex: Problème de connexion..."
                className="w-full h-12 px-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#375ca6] transition-colors text-xs font-medium text-[#0b1c30]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Description</label>
              <textarea
                value={bugDesc}
                onChange={(e) => setBugDesc(e.target.value)}
                rows={3}
                placeholder="Décrivez le problème rencontré en quelques lignes..."
                className="w-full p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#375ca6] transition-colors text-xs font-medium text-[#0b1c30] resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleFileAttach}
                className="flex items-center gap-2 px-4 py-2 bg-[#eff4ff] text-[#375ca6] font-semibold text-xs rounded-full hover:bg-[#dce9ff] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">attach_file</span>
                <span>{attachment ? `Fichier: ${attachment}` : 'Ajouter une pièce jointe (Optionnel)'}</span>
              </button>
              {attachment && (
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Donner un avis */}
        <section className="bg-white rounded-[24px] p-5 sm:p-6 shadow-card border border-slate-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8dafff]/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#375ca6]">star_half</span>
            </div>
            <h3 className="text-base font-bold text-[#0b1c30]">Donner un avis</h3>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Votre retour d'expérience</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              placeholder="Qu'est-ce que vous appréciez sur ClassiNote ?"
              className="w-full p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#375ca6] transition-colors text-xs font-medium text-[#0b1c30] resize-none"
            />
          </div>
        </section>

        {/* Section 3: Suggérer une fonctionnalité */}
        <section className="bg-white rounded-[24px] p-5 sm:p-6 shadow-card border border-slate-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dbe3f4] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#0c1520]">lightbulb</span>
            </div>
            <h3 className="text-base font-bold text-[#0b1c30]">Suggérer une fonctionnalité</h3>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Votre proposition</label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              rows={3}
              placeholder="Avez-vous une idée pour améliorer l'application ?"
              className="w-full p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#375ca6] transition-colors text-xs font-medium text-[#0b1c30] resize-none"
            />
          </div>
        </section>

        {/* Submit Button */}
        <div className="pt-2 pb-4 space-y-3">
          {errorMsg && (
            <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{errorMsg}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || isSuccess}
            className={`w-full h-14 font-bold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 text-white ${
              isSuccess
                ? 'bg-emerald-600'
                : 'bg-[#002366] hover:bg-[#00113a]'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                <span>Envoi en cours...</span>
              </>
            ) : isSuccess ? (
              <>
                <span className="material-symbols-outlined text-xl">check_circle</span>
                <span>Message envoyé !</span>
              </>
            ) : (
              <>
                <span>Envoyer</span>
                <span className="material-symbols-outlined text-xl">send</span>
              </>
            )}
          </button>
          <p className="text-center text-xs font-semibold text-slate-400">
            Nous traitons vos demandes sous 24 à 48 heures.
          </p>
        </div>
      </form>
    </div>
  );
};
