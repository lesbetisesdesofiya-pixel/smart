import React, { useState, useEffect } from 'react';
import { ScreenType } from '../../types';
import { apiFetch } from '../../api';

interface Classe { id: number; libelle: string; }
interface Matiere { id: number; libelle: string; }

interface Props {
  classes: Classe[];
  matieres: Matiere[];
  onNavigate: (screen: ScreenType) => void;
}

export const PresencesScreen: React.FC<Props> = ({ classes, matieres, onNavigate }) => {
  const [classeId, setClasseId] = useState<number>(classes[0]?.id || 0);
  const [matiereId, setMatiereId] = useState<number>(matieres[0]?.id || 0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [presencesMap, setPresencesMap] = useState<{ [id: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (classes.length > 0 && !classeId) {
      setClasseId(classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (!classeId) return;
    setLoading(true);
    apiFetch(`/teacher/classes/${classeId}/details`)
      .then(r => r.json())
      .then(data => {
        setStudents(data || []);
        const init: { [id: string]: boolean } = {};
        (data || []).forEach((s: any) => { init[s.id] = true; });
        setPresencesMap(init);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classeId]);

  const handleToggle = (id: number) => {
    setPresencesMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const presences = students.map(s => ({
        eleve_id: s.id,
        est_present: presencesMap[s.id] ?? true,
      }));
      const res = await apiFetch('/teacher/presences', {
        method: 'POST',
        body: JSON.stringify({ classe_id: classeId, matiere_id: matiereId || null, date, presences }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 pt-6 pb-28">
      {/* DEBUG */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs font-mono">
        <p>classeId: {classeId}</p>
        <p>classes.length: {classes.length}</p>
        <p>students.length: {students.length}</p>
        <p>loading: {loading ? 'true' : 'false'}</p>
        <p>matiereId: {matiereId}</p>
      </div>

      <nav className="flex items-center text-xs font-medium text-slate-500 mb-4">
        <span className="cursor-pointer hover:underline" onClick={() => onNavigate('dashboard')}>Dashboard</span>
        <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
        <span className="text-blue-600 font-bold">Présences</span>
      </nav>

      <h2 className="text-2xl font-bold text-slate-900 mb-6">Gestion des présences</h2>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Classe</label>
            <select value={classeId} onChange={(e) => setClasseId(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600">
              {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Matière</label>
            <select value={matiereId} onChange={(e) => setMatiereId(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600">
              {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : students.length > 0 ? (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600">{students.length} élèves</span>
              <span className="text-xs text-green-600 font-semibold">{Object.values(presencesMap).filter(Boolean).length} présents</span>
            </div>
            {students.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
                <span className="text-sm font-medium text-slate-800">{s.nom_complet || `${s.prenom} ${s.nom}`}</span>
                <button onClick={() => handleToggle(s.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${presencesMap[s.id] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  <span className="material-symbols-outlined text-xl">{presencesMap[s.id] ? 'check' : 'close'}</span>
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => onNavigate('dashboard')} className="flex-1 py-3 bg-slate-100 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-200">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-40">
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>
                <span className="material-symbols-outlined text-lg">save</span>
                {success ? '✓ Enregistré !' : 'Enregistrer'}
              </>}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">people</span>
          <p className="text-slate-500 text-sm">Aucun élève dans cette classe</p>
        </div>
      )}
    </main>
  );
};
