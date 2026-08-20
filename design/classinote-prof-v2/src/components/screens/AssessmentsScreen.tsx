import React, { useState, useRef, useEffect } from 'react';
import { ScreenType, Evaluation } from '../../types';

interface AssessmentsScreenProps {
  evaluations: Evaluation[];
  onNavigate: (screen: ScreenType) => void;
  onStoreGrades: (evaluationId: number, notes: any[]) => Promise<boolean>;
  aiNotesEnabled?: boolean;
}

export const AssessmentsScreen: React.FC<AssessmentsScreenProps> = ({ evaluations, onNavigate, onStoreGrades, aiNotesEnabled = false }) => {
  const [filterSubject, setFilterSubject] = useState<string>('Tous');
  const [filterStatus, setFilterStatus] = useState<'all' | 'graded' | 'pending'>('all');
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [gradesMap, setGradesMap] = useState<Record<string, string>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPhotos, setAiPhotos] = useState<string[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiCountdown, setAiCountdown] = useState(60);
  const [aiPhase, setAiPhase] = useState<'countdown1' | 'countdown2' | 'done' | 'error'>('countdown1');
  const [aiResults, setAiResults] = useState<{ eleve_id: number; note: number }[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiColumn, setAiColumn] = useState(1);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const subjects = ['Tous', ...new Set(evaluations.map(e => e.matiere?.libelle).filter(Boolean))];
  const filteredEvals = evaluations.filter(e => {
    if (filterSubject !== 'Tous' && e.matiere?.libelle !== filterSubject) return false;
    if (filterStatus === 'graded' && !e.has_notes) return false;
    if (filterStatus === 'pending' && e.has_notes) return false;
    return true;
  }).sort((a, b) => {
    // Pending (not graded) first, then graded
    if (a.has_notes === b.has_notes) return 0;
    return a.has_notes ? 1 : -1;
  });

  const pendingCount = evaluations.filter(e => !e.has_notes).length;
  const gradedCount = evaluations.filter(e => e.has_notes).length;

  const getGradeColor = (moyenne?: number) => {
    if (!moyenne) return 'text-gray-400';
    if (moyenne >= 16) return 'text-emerald-600';
    if (moyenne >= 14) return 'text-green-600';
    if (moyenne >= 10) return 'text-amber-600';
    return 'text-rose-600';
  };

  const handleSelectEvaluation = async (ev: Evaluation) => {
    setSelectedEval(ev);
    setLoadingStudents(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/smart/public/api/v1/teacher/evaluations/${ev.id}/students`, { headers: { Accept: 'application/json' }, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = data.students || [];
        if (ev.has_notes) list.sort((a: any, b: any) => (b.note ?? -1) - (a.note ?? -1));
        setStudents(list);
        const initial: Record<string, string> = {};
        list.forEach((s: any) => { initial[s.id] = s.note !== null && s.note !== undefined ? String(s.note) : ''; });
        setGradesMap(initial);
      }
    } catch {} finally { setLoadingStudents(false); }
  };

  const handleGradeChange = (studentId: string, value: string) => {
    if (value === '' || (/^\d{0,2}(\.\d{0,1})?$/.test(value) && parseFloat(value) <= 20)) setGradesMap(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSave = async () => {
    if (!selectedEval) return;
    setIsSaving(true);
    const notes = students.map(s => ({ eleve_id: parseInt(s.id), note: gradesMap[s.id] !== '' ? parseFloat(gradesMap[s.id]) : null }));
    const ok = await onStoreGrades(selectedEval.id, notes);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      const res = await fetch(`/smart/public/api/v1/teacher/evaluations/${selectedEval.id}/students`, { headers: { Accept: 'application/json' }, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = (data.students || []).sort((a: any, b: any) => (b.note ?? -1) - (a.note ?? -1));
        setStudents(list);
        const initial: Record<string, string> = {};
        list.forEach((s: any) => { initial[s.id] = s.note !== null && s.note !== undefined ? String(s.note) : ''; });
        setGradesMap(initial);
      }
    }
  };

  const getRankBadge = (rank: number) => { if (rank === 1) return 'bg-amber-100 text-amber-700'; if (rank === 2) return 'bg-gray-100 text-gray-600'; if (rank === 3) return 'bg-orange-100 text-orange-600'; return 'bg-navy-50 text-navy-600'; };

  // AI handlers
  const handlePhotoImport = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (!files) return; Array.from(files).forEach(file => { const reader = new FileReader(); reader.onload = (ev) => { if (ev.target?.result) setAiPhotos(prev => [...prev, ev.target!.result as string]); }; reader.readAsDataURL(file); }); };
  const handleTakePhoto = () => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment'; input.onchange = (e: any) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { if (ev.target?.result) setAiPhotos(prev => [...prev, ev.target!.result as string]); }; reader.readAsDataURL(file); }; input.click(); };
  const startAiAnalysis = async () => { if (aiPhotos.length === 0 || !selectedEval) return; setAiAnalyzing(true); setAiPhase('countdown1'); setAiCountdown(60); setAiResults(null); setAiError(null); countdownRef.current = setInterval(() => { setAiCountdown(prev => { if (prev <= 1) { if (countdownRef.current) clearInterval(countdownRef.current); return 0; } return prev - 1; }); }, 1000); try { const formData = new FormData(); formData.append('evaluation_id', String(selectedEval.id)); formData.append('column', String(aiColumn)); aiPhotos.forEach((photo, i) => { const byteString = atob(photo.split(',')[1]); const mimeString = photo.split(',')[0].split(':')[1].split(';')[0]; const ab = new ArrayBuffer(byteString.length); const ia = new Uint8Array(ab); for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j); formData.append(`photos[${i}]`, new Blob([ab], { type: mimeString }), `copy_${i}.jpg`); }); const res = await fetch('/smart/public/api/v1/ai/extract-grades', { method: 'POST', headers: { Accept: 'application/json' }, credentials: 'include', body: formData }); if (countdownRef.current) clearInterval(countdownRef.current); if (res.ok) { const data = await res.json(); if (data.success && data.grades) { setAiResults(data.grades); setAiPhase('done'); const updated = { ...gradesMap }; data.grades.forEach((g: any) => { updated[String(g.eleve_id)] = String(g.note); }); setGradesMap(updated); } else throw new Error(data.message || 'Erreur'); } else throw new Error('Erreur serveur'); } catch (err: any) { if (countdownRef.current) clearInterval(countdownRef.current); setAiPhase('error'); setAiError(err.message || 'Erreur d\'analyse'); } setAiAnalyzing(false); };
  const resetAiModal = () => { if (countdownRef.current) clearInterval(countdownRef.current); setShowAiModal(false); setAiPhotos([]); setAiAnalyzing(false); setAiResults(null); setAiError(null); setAiPhase('countdown1'); };
  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  // DETAIL VIEW
  if (selectedEval) {
    const isGraded = selectedEval.has_notes;
    return (
      <div className="p-4 lg:p-8 pb-24 space-y-6">
        <div>
          <button onClick={() => { setSelectedEval(null); setStudents([]); }} className="text-xs text-gray-400 hover:text-navy-800 transition-colors flex items-center gap-1 mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Retour aux evaluations
          </button>
          <h2 className="text-xl font-bold text-gray-900">{selectedEval.titre}</h2>
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            <span className="px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-800 text-[11px] font-semibold">{selectedEval.classe?.libelle}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold">{selectedEval.matiere?.libelle}</span>
            <span className="text-gray-400 text-[11px]">Coeff. {selectedEval.coefficient || 1}</span>
            {isGraded && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Note</span>}
            {!isGraded && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">A saisir</span>}
          </div>
        </div>

        {loadingStudents ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-navy-200 border-t-violet-600 rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* GRADED: ranked table */}
            {isGraded && (
              <div className="bg-white rounded-xl border border-navy-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-navy-100 bg-navy-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">{students.length} eleves</span>
                  {selectedEval.moyenne !== undefined && <span className="text-xs font-bold text-gray-500">Moyenne: <span className={getGradeColor(selectedEval.moyenne)}>{selectedEval.moyenne.toFixed(1)}</span></span>}
                </div>
                <table className="w-full">
                  <thead><tr className="border-b border-navy-100">
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 w-12">#</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Eleve</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 w-24">Note</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 w-28">Appreciation</th>
                  </tr></thead>
                  <tbody>
                    {students.map((s: any, index: number) => {
                      const rank = index + 1;
                      const badge = getRankBadge(rank);
                      const gradeColor = s.note >= 14 ? 'text-emerald-600' : s.note >= 10 ? 'text-amber-600' : 'text-rose-600';
                      const appreciation = s.note >= 16 ? 'Tres bien' : s.note >= 14 ? 'Bien' : s.note >= 12 ? 'Assez bien' : s.note >= 10 ? 'Passable' : s.note >= 8 ? 'Insuffisant' : 'Faible';
                      const appColor = s.note >= 14 ? 'bg-emerald-50 text-emerald-700' : s.note >= 10 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700';
                      return (
                        <tr key={s.id} className={`border-b border-violet-50 hover:bg-navy-50 transition-colors ${rank <= 3 ? 'bg-navy-50/50' : ''}`}>
                          <td className="px-4 py-3"><span className={`w-8 h-8 rounded-lg ${badge.bg} flex items-center justify-center text-xs font-bold`}>{badge.icon}</span></td>
                          <td className="px-4 py-3"><p className="font-semibold text-sm text-gray-900">{s.nom_complet || `${s.prenom} ${s.nom}`}</p></td>
                          <td className="px-4 py-3 text-center"><span className={`text-lg font-bold ${gradeColor}`}>{s.note !== null && s.note !== undefined ? s.note.toFixed(1) : '—'}</span></td>
                          <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${appColor}`}>{s.note !== null ? appreciation : '-'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* NOT GRADED: input form */}
            {!isGraded && (
              <>
                <div className="bg-white rounded-xl border border-navy-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="border-b border-navy-100 bg-navy-50">
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Eleve</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 w-28">Note /20</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 w-16">Abs</th>
                    </tr></thead>
                    <tbody>
                      {students.map((s: any) => (
                        <tr key={s.id} className="border-b border-violet-50 hover:bg-navy-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.nom_complet || `${s.prenom} ${s.nom}`}</td>
                          <td className="px-4 py-3 text-center">
                            <input type="text" value={gradesMap[s.id] || ''} onChange={(e) => handleGradeChange(String(s.id), e.target.value)} placeholder="—"
                              className="w-20 text-center px-2 py-1.5 text-sm font-mono bg-navy-50 border border-navy-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-navy-400 transition-all" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" className="w-4 h-4 accent-rose-500 rounded" checked={gradesMap[`abs_${s.id}`] === '1'} onChange={(e) => setGradesMap(prev => ({ ...prev, [`abs_${s.id}`]: e.target.checked ? '1' : '' }))} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center gap-3">
                  {aiNotesEnabled && (
                    <button onClick={() => setShowAiModal(true)} className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 hover:opacity-90 transition-all cursor-pointer flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                      Note IA
                    </button>
                  )}
                  <div className="flex gap-3 ml-auto">
                    <button onClick={() => { setSelectedEval(null); setStudents([]); }} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-all cursor-pointer">Annuler</button>
                    <button onClick={handleSave} disabled={isSaving}
                      className="px-6 py-2.5 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-navy-200 hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2">
                      {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {saveSuccess ? 'Enregistre !' : 'Enregistrer les notes'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* AI Modal */}
        {showAiModal && (
          <div className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-navy-100 animate-scaleIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg></div>
                  <div><h3 className="text-lg font-bold text-gray-900">Note IA</h3><p className="text-xs text-gray-400">Analyse automatique des copies</p></div>
                </div>
                <button onClick={resetAiModal} className="w-8 h-8 rounded-lg hover:bg-navy-50 flex items-center justify-center text-gray-400 cursor-pointer"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              {aiPhotos.length > 0 && <div className="grid grid-cols-3 gap-2">{aiPhotos.map((photo, i) => (<div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-navy-200"><img src={photo} alt={`Copie ${i + 1}`} className="w-full h-full object-cover" /><button onClick={() => setAiPhotos(prev => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs cursor-pointer">&times;</button></div>))}</div>}
              {!aiAnalyzing && aiPhase === 'countdown1' && (
                <div className="space-y-3">
                  <div className="bg-navy-50 rounded-xl p-3 border border-navy-200"><label className="text-xs font-bold text-gray-500 block mb-2">Numero de colonne a extraire</label><div className="flex gap-1">{[1,2,3,4,5,6,7,8].map(n => (<button key={n} onClick={() => setAiColumn(n)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${aiColumn === n ? 'bg-navy-800 text-white shadow-md' : 'bg-white text-gray-500 border border-navy-200 hover:border-navy-300'}`}>{n}</button>))}</div></div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleTakePhoto} className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Prendre une photo</button>
                    <label className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Importer<input type="file" accept="image/*" multiple onChange={handlePhotoImport} className="hidden" /></label>
                  </div>
                  {aiPhotos.length > 0 && <button onClick={startAiAnalysis} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-200 hover:opacity-90 cursor-pointer"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>Analyser {aiPhotos.length} photo{aiPhotos.length > 1 ? 's' : ''}</button>}
                </div>
              )}
              {aiAnalyzing && <div className="text-center py-6 space-y-4"><div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto"><svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg></div><div><p className="text-lg font-bold text-gray-900">Analyse en cours...</p><p className="text-sm text-gray-400 mt-1">Temps restant : {aiCountdown}s</p></div><div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${((60 - aiCountdown) / 60) * 100}%` }} /></div></div>}
              {aiPhase === 'done' && aiResults && <div className="space-y-3"><div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200"><svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="text-sm font-semibold text-emerald-700">{aiResults.length} notes extraites</span></div><button onClick={resetAiModal} className="w-full py-2.5 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl hover:opacity-90 cursor-pointer">Appliquer et fermer</button></div>}
              {aiPhase === 'error' && <div className="space-y-3 text-center"><div className="p-3 bg-amber-50 rounded-xl border border-amber-200"><p className="text-sm font-semibold text-amber-700">{aiError || 'Analyse en cours...'}</p></div><button onClick={startAiAnalysis} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Reessayer</button></div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="p-4 lg:p-8 pb-24 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Evaluations</h2>
          <p className="text-gray-400 text-sm mt-1">{evaluations.length} evaluation{evaluations.length > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterStatus === 'all' ? 'bg-navy-800 text-white shadow-md shadow-navy-200' : 'bg-white text-gray-500 border border-navy-100 hover:border-navy-200'}`}>Toutes ({evaluations.length})</button>
        <button onClick={() => setFilterStatus('pending')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterStatus === 'pending' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-white text-gray-500 border border-navy-100 hover:border-navy-200'}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          A saisir ({pendingCount})
        </button>
        <button onClick={() => setFilterStatus('graded')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterStatus === 'graded' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-white text-gray-500 border border-navy-100 hover:border-navy-200'}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Notees ({gradedCount})
        </button>
      </div>

      {/* Subject filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {subjects.map((sub) => (
          <button key={sub} onClick={() => setFilterSubject(sub)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${filterSubject === sub ? 'bg-navy-800 text-white shadow-md shadow-navy-200' : 'bg-white text-gray-500 border border-navy-100 hover:border-navy-200'}`}>{sub}</button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filteredEvals.map(ev => {
          return (
            <button key={ev.id} onClick={() => handleSelectEvaluation(ev)}
              className="w-full bg-white rounded-xl p-5 border border-navy-100 shadow-sm hover:shadow-md hover:border-navy-200 transition-all text-left cursor-pointer group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ev.has_notes ? 'bg-gradient-to-br from-emerald-500 to-emerald-400' : 'bg-gradient-to-br from-amber-500 to-amber-400'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ev.has_notes ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'} /></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{ev.titre}</h3>
                      {ev.has_notes ? <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Note</span> : <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">A saisir</span>}
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap"><span className="text-[11px] text-navy-800 font-medium">{ev.classe?.libelle}</span><span className="text-[11px] text-gray-400">{ev.matiere?.libelle}</span><span className="text-[11px] text-gray-300">Coeff. {ev.coefficient || 1}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {ev.has_notes && ev.moyenne !== undefined && (
                    <div className="text-right"><p className="text-xs text-gray-400">Moy.</p><p className={`text-lg font-bold ${getGradeColor(ev.moyenne)}`}>{ev.moyenne.toFixed(1)}</p></div>
                  )}
                  <div className="text-right"><p className="text-xs text-gray-400">{new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p></div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-navy-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </button>
          );
        })}
        {filteredEvals.length === 0 && <div className="text-center py-20"><svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg><p className="text-gray-400">Aucune evaluation</p></div>}
      </div>
    </div>
  );
};

