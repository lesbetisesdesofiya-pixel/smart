import React, { useState, useEffect } from "react";
import { apiFetch } from "../api";
import { FileCheck2, ChevronDown, Save, CheckCircle2, Camera, Upload, Loader2, Clock, RefreshCw } from "lucide-react";

interface EvalItem {
  id: number;
  titre: string;
  type: string;
  date: string;
  classe: { id: number; libelle: string };
  matiere: { id: number; libelle: string };
  notes_saisies?: number;
  total_eleves?: number;
  coefficient?: number;
  has_notes?: boolean;
}

interface StudentGrade {
  id: string;
  nom_complet: string;
  prenom: string;
  nom: string;
  note: string;
  absent: boolean;
  classe?: string;
  classe_id?: string;
  evaluation_id?: string;
}

interface GradeEntryManagerProps {
  aiNotesEnabled?: boolean;
}

export const GradeEntryManager: React.FC<GradeEntryManagerProps> = ({ aiNotesEnabled = false }) => {
  const [evaluations, setEvaluations] = useState<EvalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<EvalItem | null>(null);
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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
  const countdownRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/school-admin/evaluations');
      if (res.ok) {
        const data = await res.json();
        const items = data.evaluations || (Array.isArray(data) ? data : []);
        setEvaluations(items.map((e: any) => ({
          id: e.id,
          titre: e.titre,
          type: e.type,
          date: e.date,
          classe: e.classes?.length > 0
            ? { id: e.classes[0].classe_id, libelle: e.classes.map((c: any) => c.libelle).join(', ') }
            : (e.classe ? { id: e.classe.id || e.classe_id, libelle: e.classe.libelle || e.classe } : null),
          matiere: e.matiere ? { id: e.matiere.id || e.matiere_id, libelle: e.matiere.libelle || e.matiere } : null,
          notes_saisies: e.notes_count || e.notes_saisies || 0,
          total_eleves: e.total_eleves || e.classes?.reduce((sum: number, c: any) => sum + (c.nb_notes || 0), 0) || 0,
          coefficient: e.coefficient,
          is_group_parent: e.is_group_parent || false,
          classes: e.classes || [],
        })));
      }
    } catch (err) {
    }
    setLoading(false);
  };

  const handleSelectEvaluation = async (evalItem: EvalItem, isReadOnly = false) => {
    setSelectedEval(evalItem);
    setReadOnlyMode(isReadOnly);
    setLoadingStudents(true);
    try {
      const res = await apiFetch(`/school-admin/evaluations/${evalItem.id}/students`);
      if (res.ok) {
        const data = await res.json();
        const studs = (data.students || []).map((s: any) => ({
          id: String(s.id),
          nom_complet: s.nom_complet || `${s.prenom} ${s.nom}`,
          prenom: s.prenom,
          nom: s.nom,
          note: s.note !== null && s.note !== undefined ? String(s.note) : '',
          absent: false,
          classe: s.classe || '',
          classe_id: String(s.classe_id || ''),
          evaluation_id: String(s.evaluation_id || evalItem.id),
        }));
        setStudents(studs);
      }
    } catch (err) {
    }
    setLoadingStudents(false);
  };

  const handleGradeChange = (studentId: string, value: string) => {
    if (value === '' || (/^\d{0,2}(\.\d{0,1})?$/.test(value) && parseFloat(value) <= 20)) {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, note: value } : s));
    }
  };

  const handleSave = async () => {
    if (!selectedEval) return;
    setIsSaving(true);
    try {
      const notes = students
        .filter(s => s.note !== '')
        .map(s => ({
          evaluation_id: parseInt(s.evaluation_id || selectedEval.id),
          eleve_id: parseInt(s.id),
          note: s.note !== '' ? parseFloat(s.note) : null,
        }));
      const res = await apiFetch('/school-admin/evaluations/grades', {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
    }
    setIsSaving(false);
  };

  // Note IA: Photo handling
  const handlePhotoImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setAiPhotos(prev => [...prev, ev.target!.result as string]);
        }
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
        if (ev.target?.result) {
          setAiPhotos(prev => [...prev, ev.target!.result as string]);
        }
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
          // Auto-apply grades
          setStudents(prev => prev.map(s => {
            const found = data.grades.find((g: any) => g.eleve_id === parseInt(s.id));
            return found ? { ...s, note: String(found.note) } : s;
          }));
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

        // Retry
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
              setStudents(prev => prev.map(s => {
                const found = data.grades.find((g: any) => g.eleve_id === parseInt(s.id));
                return found ? { ...s, note: String(found.note) } : s;
              }));
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

  // Grade entry view
  if (selectedEval) {
    const pending = students.filter(s => !s.note);
    const graded = students.filter(s => s.note);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button onClick={() => { setSelectedEval(null); setStudents([]); setReadOnlyMode(false); }} className="text-sm text-blue-600 hover:underline mb-2 cursor-pointer">
              ← Retour aux évaluations
            </button>
            <h1 className="text-2xl font-black text-slate-900">{selectedEval.titre}</h1>
            <div className="flex gap-2 mt-2 flex-wrap items-center">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{selectedEval.classe.libelle}</span>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{selectedEval.matiere.libelle}</span>
              {readOnlyMode && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Lecture seule
                </span>
              )}
            </div>
          </div>
          {!readOnlyMode && (
            <div className="flex gap-2">
              {aiNotesEnabled && (
                <button
                  onClick={() => setShowAiModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  Note IA
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saveSuccess ? '✓ Enregistré !' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>

        {loadingStudents ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Élève</th>
                  {students.some(s => s.classe) && (
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Classe</th>
                  )}
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 text-xs w-28">Note /20</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 text-xs w-16">Abs</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{s.nom_complet}</td>
                    {students.some(st => st.classe) && (
                      <td className="px-4 py-3">
                        {s.classe && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                            {s.classe}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="text"
                        value={s.note}
                        onChange={(e) => handleGradeChange(s.id, e.target.value)}
                        placeholder="—"
                        readOnly={readOnlyMode}
                        className={`w-20 text-center px-2 py-1.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${readOnlyMode ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-red-600"
                        checked={s.absent}
                        onChange={(e) => setStudents(prev => prev.map(st => st.id === s.id ? { ...st, absent: e.target.checked } : st))}
                        disabled={readOnlyMode}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between text-xs text-slate-400">
              <span>{students.length} élèves — {graded.length} notés, {pending.length} à noter</span>
            </div>
          </div>
        )}

        {/* Note IA Modal */}
        {showAiModal && (
          <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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

              {/* Photo preview */}
              {aiPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {aiPhotos.map((photo, i) => (
                    <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200">
                      <img src={photo} alt={`Copie ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setAiPhotos(prev => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs cursor-pointer"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {!aiAnalyzing && aiPhase === 'countdown1' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-700 block mb-2">Numéro de colonne à extraire</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Colonne</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5,6,7,8].map(n => (
                          <button
                            key={n}
                            onClick={() => setAiColumn(n)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              aiColumn === n
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400'
                            }`}
                          >{n}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleTakePhoto}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                      Prendre une photo
                    </button>
                    <label className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors cursor-pointer">
                      <Upload className="w-5 h-5" />
                      Importer des photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {aiPhotos.length > 0 && (
                    <button
                      onClick={startAiAnalysis}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">auto_awesome</span>
                      Analyser {aiPhotos.length} photo{aiPhotos.length > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}

              {/* Countdown */}
              {aiAnalyzing && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">Analyse en cours...</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {aiPhase === 'countdown1' && `Temps restant : ${aiCountdown}s`}
                      {aiPhase === 'countdown2' && `Seconde tentative : ${aiCountdown}s`}
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-1000"
                      style={{ width: `${((aiPhase === 'countdown1' ? 60 - aiCountdown : 30 - aiCountdown) / (aiPhase === 'countdown1' ? 60 : 30)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Results */}
              {aiPhase === 'done' && aiResults && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-800">{aiResults.length} notes extraites avec succès</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {aiResults.map((r, i) => {
                      const student = students.find(s => s.id === String(r.eleve_id));
                      return (
                        <div key={i} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg text-sm">
                          <span className="text-slate-700">{student?.nom_complet || `Élève #${r.eleve_id}`}</span>
                          <span className="font-bold text-blue-600">{r.note}/20</span>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={resetAiModal} className="w-full py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">
                    Appliquer et fermer
                  </button>
                </div>
              )}

              {/* Error / Retry */}
              {aiPhase === 'error' && (
                <div className="space-y-3 text-center">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm font-semibold text-amber-800">{aiError || 'L\'analyse prend plus de temps, veuillez patienter encore 30 secondes.'}</p>
                  </div>
                  <button
                    onClick={startAiAnalysis}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Réessayer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // List view
  const pendingEvals = evaluations.filter(e => !e.notes_saisies || e.notes_saisies < (e.total_eleves || 1));
  const gradedEvals = evaluations.filter(e => e.notes_saisies && e.notes_saisies >= (e.total_eleves || 1));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-blue-600 text-white shadow-lg">
          <FileCheck2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Saisie de Notes</h1>
          <p className="text-sm text-slate-500">Saisissez ou modifiez les notes des élèves</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {pendingEvals.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">À saisir</h3>
              <div className="space-y-3">
                {pendingEvals.map(ev => (
                  <div key={ev.id} onClick={() => handleSelectEvaluation(ev)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.99]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{ev.titre}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold">{ev.classe?.libelle}</span>
                          <span className="text-slate-400 text-[11px]">{ev.matiere?.libelle}</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-blue-600 text-2xl">edit_note</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gradedEvals.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Déjà saisies</h3>
              <div className="space-y-3">
                {gradedEvals.map(ev => (
                  <div key={ev.id} onClick={() => handleSelectEvaluation(ev, true)} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-300 cursor-pointer transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-slate-600">{ev.titre}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[11px]">{ev.classe?.libelle}</span>
                          <span className="text-slate-400 text-[11px]">{ev.matiere?.libelle}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Notes saisies
                        </span>
                        <span className="material-symbols-outlined text-slate-400 text-xl">visibility</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {evaluations.length === 0 && (
            <div className="text-center py-20">
              <FileCheck2 className="w-16 h-16 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Aucune évaluation disponible</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
