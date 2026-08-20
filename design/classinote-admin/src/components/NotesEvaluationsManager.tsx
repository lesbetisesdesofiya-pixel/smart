import React, { useState, useEffect, useRef } from "react";
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  Layers,
  Eye,
  Loader2,
  Save,
  ChevronDown,
  Camera,
  Upload,
  RefreshCw,
  Users,
  Filter,
  Edit3,
} from "lucide-react";
import { SchoolClass, Student, SubjectItem } from "../types";
import { apiFetch } from "../api";

interface NotesEvaluationsManagerProps {
  classes: SchoolClass[];
  students: Student[];
  subjects: SubjectItem[];
  aiNotesEnabled?: boolean;
}

interface EvalItem {
  id: number;
  titre: string;
  type: string;
  date: string;
  matiere: string;
  matiere_id: number;
  coefficient: number;
  note_sur: number;
  classes: { id: number; classe_id: number; libelle: string; nb_notes: number }[];
  nb_classes: number;
  nb_notes_total: number;
  periode: string;
  periode_id: number;
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

const TYPE_LABELS: Record<string, string> = {
  interrogation: "Interrogation",
  devoir: "Devoir",
  devoir_surveille: "Devoir surveille",
  composition: "Composition",
  examen: "Examen",
};

function getMatiereLabel(matiere: any): string {
  if (!matiere) return "";
  if (typeof matiere === "object") return matiere.libelle || "";
  return matiere;
}

export const NotesEvaluationsManager: React.FC<NotesEvaluationsManagerProps> = ({
  classes,
  students,
  subjects,
  aiNotesEnabled = false,
}) => {
  const [evaluations, setEvaluations] = useState<EvalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodes, setPeriodes] = useState<any[]>([]);

  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [isCreatingEval, setIsCreatingEval] = useState(false);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({
    type: "composition",
    periodeId: "",
    selectedClassIds: [] as string[],
    selectedSubjectIds: [] as string[],
    date: new Date().toISOString().split("T")[0],
    coefficient: 2,
  });

  const [selectedEval, setSelectedEval] = useState<EvalItem | null>(null);
  const [studentsList, setStudentsList] = useState<StudentGrade[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  const [showRankingModal, setShowRankingModal] = useState(false);
  const [rankingStudents, setRankingStudents] = useState<any[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [rankingEvalTitle, setRankingEvalTitle] = useState("");

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPhotos, setAiPhotos] = useState<string[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiCountdown, setAiCountdown] = useState(60);
  const [aiPhase, setAiPhase] = useState<"countdown1" | "countdown2" | "done" | "error">("countdown1");
  const [aiResults, setAiResults] = useState<{ eleve_id: number; note: number }[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiColumn, setAiColumn] = useState(1);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const subjectList = subjects && subjects.length > 0 ? subjects : [];

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/school-admin/evaluations");
      if (res.ok) {
        const data = await res.json();
        const groups = (data.groups || []).map((g: any) => {
          const nbNotesTotal = (g.classes || []).reduce((sum: number, c: any) => sum + (c.nb_notes || 0), 0);
          return {
            id: g.id,
            titre: g.titre || "",
            type: g.type || "composition",
            date: g.date || "",
            matiere: typeof g.matiere === "object" ? (g.matiere?.libelle || "") : (g.matiere || ""),
            matiere_id: g.matiere_id,
            coefficient: g.coefficient || 1,
            note_sur: g.note_sur || 20,
            classes: g.classes || [],
            nb_classes: g.nb_classes || 0,
            nb_notes_total: nbNotesTotal,
            periode: g.periode || "",
            periode_id: g.periode_id,
          };
        });
        setEvaluations(groups);
      }
    } catch {}
    setLoading(false);
  };

  const fetchPeriodes = async () => {
    try {
      const res = await apiFetch("/school-admin/periodes");
      if (res.ok) {
        const data = await res.json();
        setPeriodes(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchEvaluations();
    fetchPeriodes();
  }, []);

  const filteredEvaluations = evaluations.filter((e) => {
    const matchesClass =
      filterClass === "all" || e.classes?.some((c) => String(c.classe_id) === filterClass);
    const matchesSubject = filterSubject === "all" || String(e.matiere_id) === filterSubject;
    return matchesClass && matchesSubject;
  });

  const handleToggleClass = (classId: string) => {
    setBatchForm((prev) => ({
      ...prev,
      selectedClassIds: prev.selectedClassIds.includes(classId)
        ? prev.selectedClassIds.filter((id) => id !== classId)
        : [...prev.selectedClassIds, classId],
    }));
  };

  const handleToggleSubjectId = (subjectId: string) => {
    setBatchForm((prev) => {
      if (prev.selectedSubjectIds.includes(subjectId)) {
        if (prev.selectedSubjectIds.length === 1) return prev;
        return { ...prev, selectedSubjectIds: prev.selectedSubjectIds.filter((id) => id !== subjectId) };
      }
      return { ...prev, selectedSubjectIds: [...prev.selectedSubjectIds, subjectId] };
    });
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchForm.selectedClassIds.length === 0) { alert("Selectionnez au moins une classe."); return; }
    if (batchForm.selectedSubjectIds.length === 0) { alert("Selectionnez au moins une matiere."); return; }
    if (!batchForm.periodeId) { alert("Selectionnez une periode."); return; }

    setIsSubmittingBatch(true);
    try {
      for (const subjectId of batchForm.selectedSubjectIds) {
        const classeIds = batchForm.selectedClassIds.map((id) => parseInt(id));
        await apiFetch("/school-admin/evaluation-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: batchForm.type,
            matiere_id: parseInt(subjectId),
            periode_id: parseInt(batchForm.periodeId),
            date: batchForm.date,
            heure_debut: "08:00",
            heure_fin: "10:00",
            coefficient: batchForm.coefficient,
            note_sur: 20,
            classe_ids: classeIds,
          }),
        });
      }
      await fetchEvaluations();
      setIsCreatingEval(false);
      setBatchForm({ type: "composition", periodeId: "", selectedClassIds: [], selectedSubjectIds: [], date: new Date().toISOString().split("T")[0], coefficient: 2 });
    } catch {
      alert("Erreur lors de la creation des evaluations.");
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleDeleteEvaluation = async (id: number) => {
    if (!confirm("Voulez-vous supprimer cette evaluation ?")) return;
    try {
      const res = await apiFetch(`/school-admin/evaluations/${id}`, { method: "DELETE" });
      if (res.ok) fetchEvaluations();
    } catch {}
  };

  const handleOpenRanking = async (evalItem: EvalItem) => {
    setRankingEvalTitle(evalItem.titre);
    setShowRankingModal(true);
    setLoadingRanking(true);
    try {
      const res = await apiFetch(`/school-admin/evaluations/${evalItem.id}/students`);
      if (res.ok) {
        const data = await res.json();
        const studs = (data.students || [])
          .map((s: any) => ({
            id: String(s.id),
            nom_complet: s.nom_complet || `${s.prenom} ${s.nom}`,
            note: s.note !== null && s.note !== undefined ? Number(s.note) : null,
            classe: s.classe || "",
          }))
          .sort((a: any, b: any) => (b.note ?? -1) - (a.note ?? -1));
        setRankingStudents(studs);
      }
    } catch {}
    setLoadingRanking(false);
  };

  const handleOpenSaisie = async (evalItem: EvalItem, isReadOnly = false) => {
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
          note: s.note !== null && s.note !== undefined ? String(s.note) : "",
          absent: false,
          classe: s.classe || "",
          classe_id: String(s.classe_id || ""),
          evaluation_id: String(s.evaluation_id || evalItem.id),
        }));
        setStudentsList(studs);
      }
    } catch {}
    setLoadingStudents(false);
  };

  const handleGradeChange = (studentId: string, value: string) => {
    if (value === "" || (/^\d{0,2}(\.\d{0,1})?$/.test(value) && parseFloat(value) <= 20)) {
      setStudentsList((prev) => prev.map((s) => (s.id === studentId ? { ...s, note: value } : s)));
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedEval) return;
    setIsSaving(true);
    try {
      const notes = studentsList
        .filter((s) => s.note !== "")
        .map((s) => ({
          evaluation_id: parseInt(s.evaluation_id || String(selectedEval.id)),
          eleve_id: parseInt(s.id),
          note: s.note !== "" ? parseFloat(s.note) : null,
        }));
      const res = await apiFetch("/school-admin/evaluations/grades", {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        await fetchEvaluations();
      }
    } catch {}
    setIsSaving(false);
  };

  const handlePhotoImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setAiPhotos((prev) => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleTakePhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (ev: any) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setAiPhotos((prev) => [...prev, e.target!.result as string]);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const startAiAnalysis = async () => {
    if (aiPhotos.length === 0 || !selectedEval) return;
    setAiAnalyzing(true);
    setAiPhase("countdown1");
    setAiCountdown(60);
    setAiResults(null);
    setAiError(null);

    countdownRef.current = setInterval(() => {
      setAiCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const formData = new FormData();
      formData.append("evaluation_id", String(selectedEval.id));
      formData.append("column", String(aiColumn));
      aiPhotos.forEach((photo, i) => {
        const byteString = atob(photo.split(",")[1]);
        const mimeString = photo.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j);
        formData.append(`photos[${i}]`, new Blob([ab], { type: mimeString }), `copy_${i}.jpg`);
      });

      const res = await fetch("/smart/public/api/v1/ai/extract-grades", {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "include",
        body: formData,
      });

      if (countdownRef.current) clearInterval(countdownRef.current);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.grades) {
          setAiResults(data.grades);
          setAiPhase("done");
          setStudentsList((prev) =>
            prev.map((s) => {
              const found = data.grades.find((g: any) => g.eleve_id === parseInt(s.id));
              return found ? { ...s, note: String(found.note) } : s;
            })
          );
        } else {
          throw new Error(data.message || "Erreur d'analyse");
        }
      } else {
        throw new Error("Erreur serveur");
      }
    } catch (err: any) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setAiPhase("error");
      setAiError(err.message || "Erreur d'analyse");
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
    setAiPhase("countdown1");
  };

  const sortedStudents = [...studentsList].sort((a, b) => {
    const na = a.note !== "" ? parseFloat(a.note) : -1;
    const nb = b.note !== "" ? parseFloat(b.note) : -1;
    return nb - na;
  });

  if (selectedEval) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button onClick={() => { setSelectedEval(null); setStudentsList([]); setReadOnlyMode(false); }} className="text-sm text-blue-600 hover:underline mb-2 cursor-pointer">
              Retour aux evaluations
            </button>
            <h1 className="text-2xl font-black text-slate-900">{selectedEval.titre}</h1>
            <div className="flex gap-2 mt-2 flex-wrap items-center">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {selectedEval.classes?.map((c) => c.libelle).join(", ")}
              </span>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{selectedEval.matiere}</span>
              {readOnlyMode && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">Lecture seule</span>}
            </div>
          </div>
          {!readOnlyMode && (
            <div className="flex gap-2">
              {aiNotesEnabled && (
                <button onClick={() => setShowAiModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer">
                  Note IA
                </button>
              )}
              <button onClick={handleSaveGrades} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saveSuccess ? "Enregistre !" : "Enregistrer"}
              </button>
            </div>
          )}
        </div>

        {loadingStudents ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Rang</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Eleve</th>
                  {studentsList.some((s) => s.classe) && <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Classe</th>}
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 text-xs w-28">Note /20</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 text-xs w-16">Abs</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((s, idx) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full font-black text-[10px] flex items-center justify-center ${idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-300" : idx === 1 ? "bg-slate-200 text-slate-700" : idx === 2 ? "bg-amber-800/10 text-amber-900" : "bg-slate-100 text-slate-500"}`}>
                        {s.note !== "" ? idx + 1 : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{s.nom_complet}</td>
                    {studentsList.some((st) => st.classe) && (
                      <td className="px-4 py-3">
                        {s.classe && <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">{s.classe}</span>}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <input type="text" value={s.note} onChange={(e) => handleGradeChange(s.id, e.target.value)} placeholder="" readOnly={readOnlyMode} className={`w-20 text-center px-2 py-1.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${readOnlyMode ? "bg-slate-50 cursor-not-allowed" : ""}`} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="w-4 h-4 accent-red-600" checked={s.absent} onChange={(e) => setStudentsList((prev) => prev.map((st) => st.id === s.id ? { ...st, absent: e.target.checked } : st))} disabled={readOnlyMode} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between text-xs text-slate-400">
              <span>{studentsList.length} eleves — {studentsList.filter((s) => s.note).length} notes, {studentsList.filter((s) => !s.note).length} a noter</span>
            </div>
          </div>
        )}

        {showAiModal && (
          <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center"><span className="text-white text-xl font-bold">IA</span></div>
                  <div><h3 className="text-lg font-bold text-slate-900">Note IA</h3><p className="text-xs text-slate-500">Analyse automatique des copies</p></div>
                </div>
                <button onClick={resetAiModal} className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              {aiPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {aiPhotos.map((photo, i) => (
                    <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200">
                      <img src={photo} alt={`Copie ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => setAiPhotos((prev) => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs cursor-pointer">×</button>
                    </div>
                  ))}
                </div>
              )}
              {!aiAnalyzing && aiPhase === "countdown1" && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-700 block mb-2">Numero de colonne a extraire</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Colonne</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5,6,7,8].map(n => (
                          <button key={n} onClick={() => setAiColumn(n)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${aiColumn === n ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400'}`}>{n}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleTakePhoto} className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors cursor-pointer"><Camera className="w-5 h-5" />Prendre une photo</button>
                    <label className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors cursor-pointer"><Upload className="w-5 h-5" />Importer<input type="file" accept="image/*" multiple onChange={handlePhotoImport} className="hidden" /></label>
                  </div>
                  {aiPhotos.length > 0 && (
                    <button onClick={startAiAnalysis} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity cursor-pointer">
                      Analyser {aiPhotos.length} photo{aiPhotos.length > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
              {aiAnalyzing && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto"><Loader2 className="w-10 h-10 text-white animate-spin" /></div>
                  <div><p className="text-lg font-bold text-slate-900">Analyse en cours...</p><p className="text-sm text-slate-500 mt-1">Temps restant : {aiCountdown}s</p></div>
                </div>
              )}
              {aiPhase === "done" && aiResults && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="text-sm font-semibold text-emerald-800">{aiResults.length} notes extraites</span></div>
                  <button onClick={resetAiModal} className="w-full py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">Appliquer et fermer</button>
                </div>
              )}
              {aiPhase === "error" && (
                <div className="space-y-3 text-center">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200"><p className="text-sm font-semibold text-amber-800">{aiError}</p></div>
                  <button onClick={startAiAnalysis} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer"><RefreshCw className="w-4 h-4" />Reessayer</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-blue-600" />
            <span>Notes & Evaluations</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">Gestion des evaluations, saisie des notes et classement des eleves</p>
        </div>
        <button onClick={() => setIsCreatingEval(true)} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Creer une Evaluation</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium">
          <option value="all">Toutes les classes</option>
          {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium">
          <option value="all">Toutes les matieres</option>
          {subjectList.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
        <span className="ml-auto text-xs font-bold text-slate-500">{filteredEvaluations.length} evaluation(s)</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : filteredEvaluations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <FileCheck2 className="w-16 h-16 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Aucune evaluation</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Titre</th>
                  <th className="px-5 py-3.5">Matiere</th>
                  <th className="px-5 py-3.5">Classes</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Coef.</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredEvaluations.map((e) => {
                  const typeLabel = TYPE_LABELS[e.type] || e.type;
                  const hasNotes = e.nb_notes_total > 0;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 text-sm">{e.titre}</p>
                        <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{typeLabel}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{e.matiere}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {e.classes?.slice(0, 3).map((c) => (<span key={c.id} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">{c.libelle}</span>))}
                          {(e.classes?.length || 0) > 3 && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">+{e.classes!.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{e.date ? new Date(e.date).toLocaleDateString("fr-FR") : "—"}</td>
                      <td className="px-5 py-4 font-black text-slate-900">{e.coefficient}</td>
                      <td className="px-5 py-4">
                        {hasNotes ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />Notes saisies
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                            <Clock className="w-3 h-3" />En attente
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-1">
                        <button onClick={() => handleOpenRanking(e)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1" title="Voir le classement">
                          <Eye className="w-3.5 h-3.5" /><span>Voir notes</span>
                        </button>
                        <button onClick={() => handleOpenSaisie(e, hasNotes)} className={`px-3 py-1.5 rounded-lg ${hasNotes ? "bg-slate-200 text-slate-600 hover:bg-slate-300" : "bg-blue-600 text-white hover:bg-blue-700"} font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1`} title="Saisir les notes">
                          <Edit3 className="w-3.5 h-3.5" /><span>Saisir</span>
                        </button>
                        <button onClick={() => handleDeleteEvaluation(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isCreatingEval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2"><Layers className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-base text-slate-900">Creation Groupee d'Evaluations</h3></div>
              <button onClick={() => setIsCreatingEval(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleBatchSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type d'evaluation</label>
                  <select value={batchForm.type} onChange={(e) => setBatchForm({ ...batchForm, type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold">
                    <option value="devoir">Devoir surveille</option>
                    <option value="composition">Composition</option>
                    <option value="interrogation">Interrogation</option>
                    <option value="examen">Examen blanc</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Periode</label>
                  <select value={batchForm.periodeId} onChange={(e) => setBatchForm({ ...batchForm, periodeId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold">
                    <option value="">-- Selectionner --</option>
                    {periodes.map((p: any) => (<option key={p.id} value={p.id}>{p.libelle}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Classes ({batchForm.selectedClassIds.length})</label>
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 max-h-28 overflow-y-auto">
                  {classes.map((cls) => {
                    const isSelected = batchForm.selectedClassIds.includes(cls.id);
                    return (
                      <button type="button" key={cls.id} onClick={() => handleToggleClass(cls.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"}`}>{cls.name}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Matieres ({batchForm.selectedSubjectIds.length})</label>
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 max-h-32 overflow-y-auto">
                  {subjectList.map((subj) => {
                    const isSelected = batchForm.selectedSubjectIds.includes(subj.id);
                    return (
                      <button type="button" key={subj.id} onClick={() => handleToggleSubjectId(subj.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${isSelected ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"}`}>{subj.name}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Date</label>
                <input type="date" value={batchForm.date} onChange={(e) => setBatchForm({ ...batchForm, date: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreatingEval(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Annuler</button>
                <button type="submit" disabled={isSubmittingBatch} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-1.5">
                  {isSubmittingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmittingBatch ? "Creation..." : "Generer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRankingModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{rankingEvalTitle}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="text-blue-600 font-bold flex items-center gap-1"><Users className="w-3.5 h-3.5" />Classement du meilleur au plus faible</span>
                </p>
              </div>
              <button onClick={() => setShowRankingModal(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {loadingRanking ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
            ) : (
              <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                <div className="bg-slate-50 p-3 font-bold text-slate-600 flex justify-between uppercase text-[10px]">
                  <span>Rang & Eleve</span>
                  <span>Note</span>
                </div>
                {rankingStudents.map((st, idx) => (
                  <div key={st.id} className="p-3 flex items-center justify-between hover:bg-slate-50/80">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full font-black text-[10px] flex items-center justify-center ${idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-300" : idx === 1 ? "bg-slate-200 text-slate-700" : idx === 2 ? "bg-amber-800/10 text-amber-900" : "bg-slate-100 text-slate-500"}`}>{idx + 1}</span>
                      <div>
                        <p className="font-bold text-slate-900">{st.nom_complet}</p>
                        {st.classe && <p className="text-[10px] text-slate-400">{st.classe}</p>}
                      </div>
                    </div>
                    <span className={`font-black text-sm px-3 py-1 rounded-lg ${st.note !== null && st.note >= 10 ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : st.note !== null ? "text-rose-700 bg-rose-50 border border-rose-200" : "text-slate-400 bg-slate-50"}`}>
                      {st.note !== null ? `${st.note}/20` : "—"}
                    </span>
                  </div>
                ))}
                {rankingStudents.length === 0 && (
                  <div className="p-8 text-center text-slate-400">Aucune note saisie</div>
                )}
              </div>
            )}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button onClick={() => setShowRankingModal(false)} className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
