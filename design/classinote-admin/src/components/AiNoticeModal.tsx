import React, { useState } from "react";
import { Sparkles, X, Loader2, Send } from "lucide-react";
import { apiFetch } from "../api";

interface AiNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoticeGenerated: (title: string, content: string) => void;
}

export const AiNoticeModal: React.FC<AiNoticeModalProps> = ({
  isOpen,
  onClose,
  onNoticeGenerated
}) => {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("Toutes les classes");
  const [tone, setTone] = useState("Formel & Courtois");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/ai/generate-notice-mistral", {
        method: "POST",
        body: JSON.stringify({ sujet: topic, public: audience, ton: tone === "Formel & Courtois" ? "formel" : tone === "Amical" ? "amical" : tone === "Urgent" ? "urgent" : "informatif" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Échec de génération de l'avis");
      }

      onNoticeGenerated(data.notice.titre || data.notice.title, data.notice.contenu || data.notice.content);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible d'accéder au service";
      setError("Erreur avec l'assistant IA : " + msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-amber-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Assistant IA Avis aux Parents</h3>
              <p className="text-xs text-slate-500">Génération automatique d'avis officiels par Gemini AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Sujet de la communication *
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Réunion bilan du 1er trimestre, Rappel frais de scolarité, Sortie pédagogique..."
              className="w-full px-3.5 py-2.5 border rounded-xl focus:border-blue-500 text-slate-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Public cible</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="Toutes les classes">Toutes les classes</option>
                <option value="Classes de 3ème & Terminale">Classes de 3ème & Terminale</option>
                <option value="Parents en retard de scolarité">Parents en retard de paiement</option>
                <option value="Cycles Primaire">Cycle Primaire</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Ton souhaité</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="Formel & Courtois">Formel & Courtois</option>
                <option value="Rappel Amical">Rappel Amical</option>
                <option value="Urgent & Important">Urgent & Important</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold flex items-center gap-2 shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Rédaction en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Générer l'avis IA</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
