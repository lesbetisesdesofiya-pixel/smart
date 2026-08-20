import React, { useState, useEffect } from 'react';
import { ScreenType, Classe } from '../../types';
import { apiFetch } from '../../api';

interface Props {
  classes: Classe[];
  onNavigate: (screen: ScreenType) => void;
  onSuccess?: () => void;
}

export const CreateRemarkScreen: React.FC<Props> = ({ classes, onNavigate, onSuccess }) => {
  const [classeId, setClasseId] = useState<number>(classes[0]?.id || 0);
  const [students, setStudents] = useState<any[]>([]);
  const [eleveId, setEleveId] = useState<number | null>(null);
  const [type, setType] = useState<'felicitation' | 'signalement'>('felicitation');
  const [contenu, setContenu] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (classes.length > 0 && !classeId) setClasseId(classes[0].id); }, [classes]);

  useEffect(() => {
    if (!classeId) return;
    setLoadingStudents(true);
    setEleveId(null);
    apiFetch(`/teacher/classes/${classeId}/details`)
      .then(r => r.json())
      .then(data => { setStudents(data || []); })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [classeId]);

  const handleSubmit = async () => {
    if (!eleveId || !contenu.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Map UI types to API types
      const apiType = type === 'felicitation' ? 'academique' : 'comportement';
      const res = await apiFetch('/teacher/remarques', {
        method: 'POST',
        body: JSON.stringify({ eleve_id: eleveId, type: apiType, contenu: contenu.trim() }),
      });
      if (res.ok) {
        setSuccess(true);
        onSuccess?.();
        setTimeout(() => onNavigate('dashboard'), 2000);
      } else {
        const data = await res.json();
        setError(data.message || 'Erreur');
      }
    } catch {
      setError('Erreur reseau');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id === eleveId);

  return (
    <div className="p-4 lg:p-8 pb-24 space-y-6 max-w-lg mx-auto">
      <div>
        <button onClick={() => onNavigate('dashboard')} className="text-xs text-gray-400 hover:text-navy-800 transition-colors flex items-center gap-1 mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Retour
        </button>
        <h2 className="text-xl font-bold text-gray-900">Ajouter une remarque</h2>
        <p className="text-sm text-gray-400 mt-1">Le parent sera notifie de cette remarque</p>
      </div>

      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="text-emerald-700 font-bold">Remarque enregistree !</p>
          <p className="text-emerald-500 text-sm mt-1">Le parent a ete notifie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Class selection */}
          <div className="bg-white rounded-xl p-5 border border-navy-100 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">Classe</label>
              <select value={classeId} onChange={(e) => setClasseId(Number(e.target.value))}
                className="w-full px-4 py-3 text-sm bg-navy-50 border border-navy-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400">
                {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
              </select>
            </div>

            {/* Student selection */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">Eleve</label>
              {loadingStudents ? (
                <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-navy-200 border-t-violet-600 rounded-full animate-spin" /></div>
              ) : (
                <div className="max-h-48 overflow-y-auto scrollbar-hide space-y-1">
                  {students.map(s => (
                    <button key={s.id} onClick={() => setEleveId(s.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        eleveId === s.id ? 'border-navy-300 bg-navy-50' : 'border-gray-200 hover:bg-navy-50'
                      }`}>
                      <span className="text-sm font-medium text-gray-900">{s.nom_complet || `${s.prenom} ${s.nom}`}</span>
                      {eleveId === s.id && <svg className="w-5 h-5 text-navy-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    </button>
                  ))}
                  {students.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun eleve dans cette classe</p>}
                </div>
              )}
            </div>
          </div>

          {/* Type selection */}
          <div className="bg-white rounded-xl p-5 border border-navy-100 shadow-sm">
            <label className="text-xs font-bold text-gray-500 mb-3 block">Type de remarque</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setType('felicitation')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 ${
                  type === 'felicitation' ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'
                }`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className={`text-sm font-bold ${type === 'felicitation' ? 'text-emerald-700' : 'text-gray-500'}`}>Felicitation</span>
                <span className="text-[10px] text-gray-400">Comportement positif</span>
              </button>
              <button type="button" onClick={() => setType('signalement')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 ${
                  type === 'signalement' ? 'border-rose-300 bg-rose-50' : 'border-gray-200 hover:border-rose-200'
                }`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-400 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                </div>
                <span className={`text-sm font-bold ${type === 'signalement' ? 'text-rose-700' : 'text-gray-500'}`}>Signalement</span>
                <span className="text-[10px] text-gray-400">Probleme de comportement</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl p-5 border border-navy-100 shadow-sm">
            <label className="text-xs font-bold text-gray-500 mb-2 block">Remarque</label>
            <textarea value={contenu} onChange={(e) => setContenu(e.target.value)} placeholder={type === 'felicitation' ? 'Ex: Felicitations pour son travail en classe...' : 'Ex: Comportement perturbateur en cours...'} rows={4} maxLength={1000}
              className="w-full px-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-400 resize-none" />
            <p className="text-[10px] text-gray-300 text-right mt-1">{contenu.length}/1000</p>
          </div>

          {/* Preview */}
          {eleveId && contenu.trim() && (
            <div className="bg-white rounded-xl p-4 border border-navy-100 shadow-sm">
              <p className="text-xs font-bold text-gray-500 mb-2">Apercu</p>
              <div className={`p-3 rounded-xl ${type === 'felicitation' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${type === 'felicitation' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {type === 'felicitation' ? 'Felicitation' : 'Signalement'}
                  </span>
                  <span className="text-xs text-gray-400">{selectedStudent?.nom_complet}</span>
                </div>
                <p className="text-sm text-gray-700">{contenu}</p>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-200">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => onNavigate('dashboard')} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-all cursor-pointer">Annuler</button>
            <button onClick={handleSubmit} disabled={loading || !eleveId || !contenu.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-navy-200 disabled:opacity-40 transition-all cursor-pointer">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Envoyer la remarque'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

