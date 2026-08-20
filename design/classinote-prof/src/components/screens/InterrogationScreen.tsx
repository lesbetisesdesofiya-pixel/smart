import React, { useState } from 'react';
import { ScreenType } from '../../types';
import { apiFetch } from '../../api';

interface Classe { id: number; libelle: string; }
interface Matiere { id: number; libelle: string; }

interface Props {
  classes: Classe[];
  matieres: Matiere[];
  onNavigate: (screen: ScreenType) => void;
  onCreated?: () => void;
}

export const InterrogationScreen: React.FC<Props> = ({ classes, matieres, onNavigate, onCreated }) => {
  const [classeId, setClasseId] = useState<number>(classes[0]?.id || 0);
  const [matiereId, setMatiereId] = useState<number>(matieres[0]?.id || 0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/teacher/interrogation', {
        method: 'POST',
        body: JSON.stringify({ classe_id: classeId, matiere_id: matiereId, date }),
      });
      if (res.ok) {
        setSuccess(true);
        if (onCreated) {
          await onCreated();
        }
        setTimeout(() => onNavigate('grade_entry'), 1500);
      } else {
        const data = await res.json();
        setError(data.message || 'Erreur');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 pt-6 pb-28">
      <nav className="flex items-center text-xs font-medium text-slate-500 mb-4">
        <span className="cursor-pointer hover:underline" onClick={() => onNavigate('dashboard')}>Dashboard</span>
        <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
        <span className="text-blue-600 font-bold">Interrogation rapide</span>
      </nav>

      <h2 className="text-2xl font-bold text-slate-900 mb-6">Créer une interrogation</h2>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-green-600 mb-3">check_circle</span>
          <p className="text-green-800 font-bold">Interrogation créée !</p>
          <p className="text-green-600 text-sm mt-1">Redirection vers la saisie des notes...</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Classe</label>
            <select
              value={classeId}
              onChange={(e) => setClasseId(Number(e.target.value))}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Matière</label>
            <select
              value={matiereId}
              onChange={(e) => setMatiereId(Number(e.target.value))}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={() => onNavigate('dashboard')} className="flex-1 py-3 bg-slate-100 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-200 transition-colors">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={loading || !classeId || !matiereId} className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-40 transition-all">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>
                <span className="material-symbols-outlined text-lg">quiz</span>
                Créer & Saisir
              </>}
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
