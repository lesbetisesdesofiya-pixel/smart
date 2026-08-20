import React, { useState } from 'react';
import { ScreenType, Classe, Matiere } from '../../types';
import { apiFetch } from '../../api';

interface Props { classes: Classe[]; matieres: Matiere[]; onNavigate: (screen: ScreenType) => void; onCreated?: () => void; }

export const InterrogationScreen: React.FC<Props> = ({ classes, matieres, onNavigate, onCreated }) => {
  const [classeId, setClasseId] = useState<number>(classes[0]?.id || 0);
  const [matiereId, setMatiereId] = useState<number>(matieres[0]?.id || 0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async () => { setLoading(true); setError(null); try { const res = await apiFetch('/teacher/interrogation', { method: 'POST', body: JSON.stringify({ classe_id: classeId, matiere_id: matiereId, date }) }); if (res.ok) { setSuccess(true); if (onCreated) await onCreated(); setTimeout(() => onNavigate('assessments'), 1500); } else { const data = await res.json(); setError(data.message || 'Erreur'); } } catch { setError('Erreur reseau'); } finally { setLoading(false); } };

  return (
    <div className="p-4 lg:p-8 pb-24 space-y-6 max-w-lg mx-auto">
      <div><button onClick={() => onNavigate('dashboard')} className="text-xs text-gray-400 hover:text-navy-800 transition-colors flex items-center gap-1 mb-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Retour</button><h2 className="text-xl font-bold text-gray-900">Creer une interrogation</h2></div>
      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
          <p className="text-emerald-700 font-bold">Interrogation creee !</p><p className="text-emerald-500 text-sm mt-1">Redirection vers la saisie des notes...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-navy-100 shadow-sm space-y-4">
            <div><label className="block text-xs font-bold text-gray-500 mb-2">Classe</label><select value={classeId} onChange={(e) => setClasseId(Number(e.target.value))} className="w-full px-4 py-3 text-sm bg-navy-50 border border-navy-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400">{classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-gray-500 mb-2">Matiere</label><select value={matiereId} onChange={(e) => setMatiereId(Number(e.target.value))} className="w-full px-4 py-3 text-sm bg-navy-50 border border-navy-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400">{matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-gray-500 mb-2">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 text-sm bg-navy-50 border border-navy-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400" /></div>
          </div>
          {error && <p className="text-xs text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-200">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => onNavigate('dashboard')} className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors">Annuler</button>
            <button onClick={handleSubmit} disabled={loading || !classeId || !matiereId} className="flex-1 py-3 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-navy-200 disabled:opacity-40 transition-all">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Creer & Saisir</>}</button>
          </div>
        </div>
      )}
    </div>
  );
};

