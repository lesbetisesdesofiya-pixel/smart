import React, { useState, useEffect } from 'react';
import { ScreenType, Classe, Matiere } from '../../types';
import { apiFetch } from '../../api';

interface Props { classes: Classe[]; matieres: Matiere[]; onNavigate: (screen: ScreenType) => void; }

export const PresencesScreen: React.FC<Props> = ({ classes, matieres, onNavigate }) => {
  const [classeId, setClasseId] = useState<number>(classes[0]?.id || 0);
  const [matiereId, setMatiereId] = useState<number>(matieres[0]?.id || 0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [presencesMap, setPresencesMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  useEffect(() => { if (classes.length > 0 && !classeId) setClasseId(classes[0].id); }, [classes]);
  useEffect(() => { if (!classeId) return; setLoading(true); apiFetch(`/teacher/classes/${classeId}/details`).then(r => r.json()).then(data => { setStudents(data || []); const init: Record<string, boolean> = {}; (data || []).forEach((s: any) => { init[s.id] = true; }); setPresencesMap(init); }).catch(() => {}).finally(() => setLoading(false)); }, [classeId]);
  const handleToggle = (id: number) => setPresencesMap(prev => ({ ...prev, [id]: !prev[id] }));
  const handleSave = async () => { setSaving(true); try { const presences = students.map(s => ({ eleve_id: s.id, est_present: presencesMap[s.id] ?? true })); const res = await apiFetch('/teacher/presences', { method: 'POST', body: JSON.stringify({ classe_id: classeId, matiere_id: matiereId || null, date, presences }) }); if (res.ok) { setSuccess(true); setTimeout(() => setSuccess(false), 2000); } } catch {} finally { setSaving(false); } };
  const presentCount = Object.values(presencesMap).filter(Boolean).length;

  return (
    <div className="p-4 lg:p-8 pb-24 space-y-6 max-w-lg mx-auto">
      <div><button onClick={() => onNavigate('dashboard')} className="text-xs text-gray-400 hover:text-navy-800 transition-colors flex items-center gap-1 mb-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Retour</button><h2 className="text-xl font-bold text-gray-900">Gestion des presences</h2></div>
      <div className="bg-white rounded-xl p-5 border border-navy-100 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-bold text-gray-500 mb-1">Classe</label><select value={classeId} onChange={(e) => setClasseId(Number(e.target.value))} className="w-full px-3 py-2.5 text-sm bg-navy-50 border border-navy-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400">{classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-gray-500 mb-1">Matiere</label><select value={matiereId} onChange={(e) => setMatiereId(Number(e.target.value))} className="w-full px-3 py-2.5 text-sm bg-navy-50 border border-navy-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400">{matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}</select></div>
        </div>
        <div><label className="block text-xs font-bold text-gray-500 mb-1">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-navy-50 border border-navy-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400" /></div>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-navy-200 border-t-violet-600 rounded-full animate-spin" /></div> : students.length > 0 ? (
        <>
          <div className="bg-white rounded-xl border border-navy-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-navy-100 flex justify-between items-center bg-navy-50"><span className="text-xs font-bold text-gray-500">{students.length} eleves</span><span className="text-xs text-emerald-600 font-semibold">{presentCount} presents</span></div>
            {students.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 border-b border-violet-50 last:border-0 hover:bg-navy-50 transition-colors">
                <span className="text-sm font-medium text-gray-900">{s.nom_complet || `${s.prenom} ${s.nom}`}</span>
                <button onClick={() => handleToggle(s.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${presencesMap[s.id] ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                  {presencesMap[s.id] ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>}
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => onNavigate('dashboard')} className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-200">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-navy-200 disabled:opacity-40">{saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>{success ? 'Enregistre !' : 'Enregistrer'}</>}</button>
          </div>
        </>
      ) : <div className="text-center py-16 bg-white rounded-xl border border-navy-100"><svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg><p className="text-gray-400 text-sm">Aucun eleve dans cette classe</p></div>}
    </div>
  );
};

