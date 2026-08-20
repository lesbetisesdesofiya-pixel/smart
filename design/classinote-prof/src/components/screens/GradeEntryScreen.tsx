import React, { useState, useRef, useEffect } from 'react';
import { ScreenType } from '../../types';

interface Evaluation {
  id: number;
  titre: string;
  type: string;
  date: string;
  classe: { id: number; libelle: string };
  matiere: { id: number; libelle: string };
  notes_saisies?: number;
  total_eleves?: number;
  coefficient?: number;
}

interface GradeEntryScreenProps {
  evaluations: Evaluation[];
  onStoreGrades: (evaluationId: number, notes: any[]) => Promise<boolean>;
  onNavigate: (screen: ScreenType) => void;
  aiNotesEnabled?: boolean;
}

export const GradeEntryScreen: React.FC<GradeEntryScreenProps> = ({
  evaluations,
  onStoreGrades,
  onNavigate,
  aiNotesEnabled = false,
}) => {
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [gradesMap, setGradesMap] = useState<{ [id: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  // Note IA state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPhotos, setAiPhotos] = useState<string[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiCountdown, setAiCountdown] = useState(60);
  const [aiPhase, setAiPhase] = useState<'countdown1' | 'countdown2' | 'done' | 'error'>('countdown1');
  const [aiResults, setAiResults] = useState<{ eleve_id: number; note: number }[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiColumn, setAiColumn] = useState(1);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSelectEvaluation = async (evalItem: Evaluation, isReadOnly = false) => {
    setSelectedEval(evalItem);
    setReadOnlyMode(isReadOnly);
    setLoadingStudents(true);
    try {
      const res = await fetch(`/smart/public/api/v1/teacher/evaluations/${evalItem.id}/students`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        const initial: { [id: string]: string } = {};
        (data.students || []).forEach((s: any) => {
          initial[s.id] = s.note !== null && s.note !== undefined ? String(s.note) : '';
        });
        setGradesMap(initial);
      }
    } catch (err) {
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleGradeChange = (studentId: string, value: string) => {
    if (value === '' || (/^\d{0,2}(\.\d{0,1})?$/.test(value) && parseFloat(value) <= 20)) {
      setGradesMap(prev => ({ ...prev, [studentId]: value }));
    }
  };

  const handleSave = async () => {
    if (!selectedEval) return;
    setIsSaving(true);
    const notes = students.map(s => ({
      eleve_id: parseInt(s.id),
      note: gradesMap[s.id] !== '' ? parseFloat(gradesMap[s.id]) : null,
    }));
    const ok = await onStoreGrades(selectedEval.id, notes);
    setIsSaving(false);
    if (ok) {
      onNavigate('dashboard');
    }
  };

  // Note IA handlers
  const handlePhotoImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setAiPhotos(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setAiPhotos(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const startAiAnalysis = async () => {
    if (aiPhotos.length === 0 || !selectedEval) return;
    setAiAnalyzing(true);
    setAiPhase('countdown1');
    setAiCountdown(60);
    setAiResults(null);
    setAiError(null);

    countdownRef.current = setInterval(() => {
      setAiCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const formData = new FormData();
      formData.append('evaluation_id', String(selectedEval.id));
      formData.append('column', String(aiColumn));
      aiPhotos.forEach((photo, i) => {
        const byteString = atob(photo.split(',')[1]);
        const mimeString = photo.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j);
        const blob = new Blob([ab], { type: mimeString });
        formData.append(`photos[${i}]`, blob, `copy_${i}.jpg`);
      });

      const res = await fetch('/smart/public/api/v1/ai/extract-grades', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
        body: formData,
      });

      if (countdownRef.current) clearInterval(countdownRef.current);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.grades) {
          setAiResults(data.grades);
          setAiPhase('done');
          const updated = { ...gradesMap };
          data.grades.forEach((g: any) => { updated[String(g.eleve_id)] = String(g.note); });
          setGradesMap(updated);
        } else {
          throw new Error(data.message || 'Erreur d\'analyse');
        }
      } else {
        throw new Error('Erreur serveur');
      }
    } catch (err: any) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (aiPhase === 'countdown1') {
        setAiPhase('countdown2');
        setAiCountdown(30);
        countdownRef.current = setInterval(() => {
          setAiCountdown(prev => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              setAiPhase('error');
              setAiError('L\'analyse prend plus de temps que prévu.');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        try {
          const formData = new FormData();
          formData.append('evaluation_id', String(selectedEval.id));
          formData.append('column', String(aiColumn));
          aiPhotos.forEach((photo, i) => {
            const byteString = atob(photo.split(',')[1]);
            const mimeString = photo.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j);
            const blob = new Blob([ab], { type: mimeString });
            formData.append(`photos[${i}]`, blob, `copy_${i}.jpg`);
          });
          const retryRes = await fetch('/smart/public/api/v1/ai/extract-grades', {
            method: 'POST',
            headers: { Accept: 'application/json' },
            credentials: 'include',
            body: formData,
          });
          if (countdownRef.current) clearInterval(countdownRef.current);
          if (retryRes.ok) {
            const data = await retryRes.json();
            if (data.success && data.grades) {
              setAiResults(data.grades);
              setAiPhase('done');
              const updated = { ...gradesMap };
              data.grades.forEach((g: any) => { updated[String(g.eleve_id)] = String(g.note); });
              setGradesMap(updated);
            } else {
              setAiPhase('error');
              setAiError(data.message || 'Échec de l\'analyse');
            }
          } else {
            setAiPhase('error');
            setAiError('Échec de l\'analyse');
          }
        } catch {
          setAiPhase('error');
          setAiError('Erreur réseau lors de la seconde tentative');
        }
      } else {
        setAiPhase('error');
        setAiError(err.message || 'Erreur d\'analyse');
      }
    }
    setAiAnalyzing(false);
  };

  const resetAiModal = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowAiModal(false);
    setAiPhotos([]);
    setAiAnalyzing(false);
    setAiResults(null);
    setAiError(null);
    setAiPhase('countdown1');
  };

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  if (selectedEval) {
    return (
      <main className="max-w-[1200px] mx-auto px-4 md:px-10 pt-6 pb-28">
        <section className="mb-6">
          <nav className="flex items-center text-xs font-medium text-on-surface-variant mb-1">
            <span className="cursor-pointer hover:underline" onClick={() => onNavigate('dashboard')}>Dashboard</span>
            <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
            <span className="text-primary font-bold">{readOnlyMode ? 'Consultation' : 'Saisie'}</span>
          </nav>
          <h2 className="text-2xl font-bold text-primary">{selectedEval.titre}</h2>
          <div className="flex gap-3 mt-2 flex-wrap items-center">
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-semibold">{selectedEval.classe?.libelle || selectedEval.titre}</span>
            <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full text-xs font-semibold">{selectedEval.matiere?.libelle || '—'}</span>
            <span className="text-on-surface-variant text-xs">Coeff. {selectedEval.coefficient || 1}</span>
            {readOnlyMode && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                <span className="material-symbols-outlined text-sm">lock</span>
                Lecture seule
              </span>
            )}
          </div>
        </section>

        {loadingStudents ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-variant/50">
                    <th className="text-left px-4 py-3 text-xs font-bold text-on-surface">Élève</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-on-surface w-28">Note /20</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-on-surface w-16">Abs</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s: any) => (
                    <tr key={s.id} className="border-b border-outline-variant/50 hover:bg-surface-variant/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-on-surface">{s.nom_complet || `${s.prenom} ${s.nom}`}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="text"
                          value={gradesMap[s.id] || ''}
                          onChange={(e) => handleGradeChange(String(s.id), e.target.value)}
                          placeholder="—"
                          readOnly={readOnlyMode}
                          className={`w-20 text-center px-2 py-1.5 text-sm font-mono border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 ${readOnlyMode ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-red-600"
                          checked={gradesMap[`abs_${s.id}`] === '1'}
                          onChange={(e) => setGradesMap(prev => ({ ...prev, [`abs_${s.id}`]: e.target.checked ? '1' : '' }))}
                          disabled={readOnlyMode}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button onClick={() => { setSelectedEval(null); setStudents([]); setReadOnlyMode(false); }} className="px-4 py-2 text-on-surface-variant text-sm font-medium hover:bg-surface-variant rounded-xl transition-all cursor-pointer">
                ← Retour
              </button>
              {!readOnlyMode && (
                <div className="flex gap-2">
                  {aiNotesEnabled && (
                    <button onClick={() => setShowAiModal(true)} className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">auto_awesome</span>
                      Note IA
                    </button>
                  )}
                  <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all cursor-pointer">
                    {isSaving ? 'Enregistrement...' : saveSuccess ? '✓ Enregistré !' : 'Enregistrer les notes'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Note IA Modal */}
        {showAiModal && (
          <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Note IA</h3>
                    <p className="text-xs text-slate-500">Analyse automatique des copies</p>
                  </div>
                </div>
                <button onClick={resetAiModal} className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <span className="material-symbols-outlined text-slate-400">close</span>
                </button>
              </div>

              {aiPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {aiPhotos.map((photo, i) => (
                    <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200">
                      <img src={photo} alt={`Copie ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => setAiPhotos(prev => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs cursor-pointer">×</button>
                    </div>
                  ))}
                </div>
              )}

              {!aiAnalyzing && aiPhase === 'countdown1' && (
                <div className="space-y-3">
                  <div className="bg-[#f8f9ff] p-3 rounded-xl border border-[#e5eeff]">
                    <label className="text-xs font-bold text-[#00113a] block mb-2">Numéro de colonne à extraire</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Colonne</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5,6,7,8].map(n => (
                          <button
                            key={n}
                            onClick={() => setAiColumn(n)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              aiColumn === n
                                ? 'bg-[#002366] text-white shadow-md'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-[#375ca6]'
                            }`}
                          >{n}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleTakePhoto} className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined">photo_camera</span>
                      Prendre une photo
                    </button>
                    <label className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined">upload</span>
                      Importer
                      <input type="file" accept="image/*" multiple onChange={handlePhotoImport} className="hidden" />
                    </label>
                  </div>
                  {aiPhotos.length > 0 && (
                    <button onClick={startAiAnalysis} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity cursor-pointer">
                      <span className="material-symbols-outlined text-lg">auto_awesome</span>
                      Analyser {aiPhotos.length} photo{aiPhotos.length > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}

              {aiAnalyzing && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-white text-4xl animate-spin">progress_activity</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">Analyse en cours...</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {aiPhase === 'countdown1' && `Temps restant : ${aiCountdown}s`}
                      {aiPhase === 'countdown2' && `Seconde tentative : ${aiCountdown}s`}
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-1000"
                      style={{ width: `${((aiPhase === 'countdown1' ? 60 - aiCountdown : 30 - aiCountdown) / (aiPhase === 'countdown1' ? 60 : 30)) * 100}%` }} />
                  </div>
                </div>
              )}

              {aiPhase === 'done' && aiResults && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                    <span className="text-sm font-semibold text-emerald-800">{aiResults.length} notes extraites</span>
                  </div>
                  <button onClick={resetAiModal} className="w-full py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity cursor-pointer">
                    Appliquer et fermer
                  </button>
                </div>
              )}

              {aiPhase === 'error' && (
                <div className="space-y-3 text-center">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm font-semibold text-amber-800">{aiError || 'Analyse en cours...'}</p>
                  </div>
                  <button onClick={startAiAnalysis} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity cursor-pointer">
                    <span className="material-symbols-outlined">refresh</span>
                    Réessayer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    );
  }

  const pendingEvals = evaluations.filter(e => !e.has_notes);

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-10 pt-6 pb-28">
      <section className="mb-8">
        <nav className="flex items-center text-xs font-medium text-on-surface-variant mb-1">
          <span className="cursor-pointer hover:underline" onClick={() => onNavigate('dashboard')}>Dashboard</span>
          <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
          <span className="text-primary font-bold">Saisie de notes</span>
        </nav>
        <h2 className="text-2xl md:text-3xl font-bold text-primary mt-2">Saisie de notes</h2>
      </section>

      {pendingEvals.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-bold text-on-surface mb-4">À saisir</h3>
          <div className="space-y-3">
            {pendingEvals.map(ev => (
              <div key={ev.id} onClick={() => handleSelectEvaluation(ev)} className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant hover:border-primary cursor-pointer transition-all active:scale-[0.99]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-on-surface">{ev.titre}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[11px] font-semibold">{ev.classe?.libelle || ev.titre}</span>
                      <span className="text-on-surface-variant text-[11px]">{ev.matiere?.libelle || '—'}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary text-2xl">edit_note</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {evaluations.length === 0 && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">assignment</span>
          <p className="text-on-surface-variant">Aucune évaluation disponible</p>
        </div>
      )}
    </main>
  );
};
