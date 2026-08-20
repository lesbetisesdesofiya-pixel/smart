import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  Award,
  Layers,
  ArrowDownCircle,
  Eye,
  Loader2
} from "lucide-react";
import { Evaluation, SchoolClass, Student, GradeEntry, SubjectItem } from "../types";
import { apiFetch } from "../api";

interface EvaluationsManagerProps {
  evaluations: Evaluation[];
  setEvaluations: React.Dispatch<React.SetStateAction<Evaluation[]>>;
  classes: SchoolClass[];
  students: Student[];
  subjects?: SubjectItem[];
  sampleGradeEntries: Record<string, GradeEntry[]>;
}

const DEFAULT_SUBJECTS = [
  "Mathématiques",
  "Physique-Chimie",
  "Français",
  "SVT",
  "Anglais",
  "Histoire-Géo",
  "Espagnol",
  "Philosophie"
];

export const EvaluationsManager: React.FC<EvaluationsManagerProps> = ({
  evaluations,
  setEvaluations,
  classes,
  students,
  subjects,
  sampleGradeEntries
}) => {
  const subjectList = subjects && subjects.length > 0 ? subjects.map((s) => s.name) : DEFAULT_SUBJECTS;
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedPeriode, setSelectedPeriode] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [activeGradebookEval, setActiveGradebookEval] = useState<Evaluation | null>(null);
  const [isCreatingEval, setIsCreatingEval] = useState(false);

  // Grade entry state for current selected evaluation
  const [currentGrades, setCurrentGrades] = useState<Record<string, number>>({});

  // Batch creation form state
  const [batchForm, setBatchForm] = useState({
    type: "composition" as Evaluation["type"],
    periodeId: "" as string,
    selectedClassIds: [] as string[],
    selectedSubjects: ["Mathématiques"] as string[],
    date: new Date().toISOString().split("T")[0],
    coefficient: 2
  });

  const [periodes, setPeriodes] = useState<any[]>([]);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  useEffect(() => {
    apiFetch('/school-admin/periodes').then(r => r.json()).then(data => {
      setPeriodes(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const filteredEvaluations = evaluations.filter((e) => {
    const matchesClass = selectedClass === "all" || e.classId === selectedClass || e.classes?.some((c: any) => String(c.classe_id) === selectedClass);
    const matchesPeriode = selectedPeriode === "all" || e.term_id === selectedPeriode;
    const matchesSubject = selectedSubject === "all" || e.subject_id === selectedSubject;
    return matchesClass && matchesPeriode && matchesSubject;
  });

  const handleOpenGradebook = (evaluation: Evaluation) => {
    setActiveGradebookEval(evaluation);
    const classStudents = students.filter((s) => s.classId === evaluation.classId);
    const existing = sampleGradeEntries[evaluation.id] || [];
    const initialMarks: Record<string, number> = {};

    classStudents.forEach((st, index) => {
      const found = existing.find((g) => g.studentId === st.id);
      if (found?.mark !== undefined) {
        initialMarks[st.id] = found.mark;
      } else {
        // Default sample marks for demo
        initialMarks[st.id] = Math.max(8, 18 - index * 2.5);
      }
    });

    setCurrentGrades(initialMarks);
  };

  const handleSaveGrades = () => {
    if (!activeGradebookEval) return;
    setEvaluations(
      evaluations.map((e) =>
        e.id === activeGradebookEval.id ? { ...e, status: "publie" } : e
      )
    );
    alert("Les notes ont été enregistrées et classées de la plus forte à la plus faible !");
    setActiveGradebookEval(null);
  };

  const handleDeleteEvaluation = (id: string) => {
    if (confirm("Voulez-vous supprimer cette évaluation ?")) {
      setEvaluations(evaluations.filter((e) => e.id !== id));
    }
  };

  const handleToggleClass = (classId: string) => {
    if (batchForm.selectedClassIds.includes(classId)) {
      setBatchForm({
        ...batchForm,
        selectedClassIds: batchForm.selectedClassIds.filter((id) => id !== classId)
      });
    } else {
      setBatchForm({
        ...batchForm,
        selectedClassIds: [...batchForm.selectedClassIds, classId]
      });
    }
  };

  const handleToggleSubject = (subject: string) => {
    if (batchForm.selectedSubjects.includes(subject)) {
      if (batchForm.selectedSubjects.length === 1) return; // keep at least 1
      setBatchForm({
        ...batchForm,
        selectedSubjects: batchForm.selectedSubjects.filter((s) => s !== subject)
      });
    } else {
      setBatchForm({
        ...batchForm,
        selectedSubjects: [...batchForm.selectedSubjects, subject]
      });
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchForm.selectedClassIds.length === 0) {
      alert("Veuillez sélectionner au moins une classe.");
      return;
    }
    if (batchForm.selectedSubjects.length === 0) {
      alert("Veuillez sélectionner au moins une matière.");
      return;
    }
    if (!batchForm.periodeId) {
      alert("Veuillez sélectionner une période.");
      return;
    }

    setIsSubmittingBatch(true);
    try {
      for (const subjectName of batchForm.selectedSubjects) {
        const subject = subjects?.find((s) => s.name === subjectName);
        if (!subject) continue;

        const classeIds = batchForm.selectedClassIds.map((id) => parseInt(id.replace(/^C/, ''), 10));

        const res = await apiFetch('/school-admin/evaluation-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: batchForm.type,
            matiere_id: parseInt(subject.id, 10),
            periode_id: parseInt(batchForm.periodeId, 10),
            date: batchForm.date,
            heure_debut: '08:00',
            heure_fin: '10:00',
            coefficient: batchForm.coefficient,
            note_sur: 20,
            classe_ids: classeIds,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('Error creating evaluation:', err);
        }
      }

      const resEvals = await apiFetch('/school-admin/evaluations');
      if (resEvals.ok) {
        const data = await resEvals.json();
        const items = data.evaluations || data || [];
        setEvaluations(items.map((e: any) => ({
          id: String(e.id),
          title: e.titre || '',
          type: e.type || 'composition',
          classId: e.classes?.[0]?.classe_id ? String(e.classes[0].classe_id) : '',
          className: e.classes?.map((c: any) => c.libelle).join(', ') || '',
          subject: e.matiere || '',
          subject_id: e.matiere_id ? String(e.matiere_id) : '',
          date: e.date || '',
          term: e.periode || '',
          term_id: e.periode_id ? String(e.periode_id) : '',
          totalPoints: e.note_sur || 20,
          coefficient: e.coefficient || 1,
          note_sur: e.note_sur || 20,
          status: (e.nb_classes > 0 && e.classes?.some((c: any) => c.nb_notes > 0)) ? 'publie' : 'a_venir',
          classes: e.classes || [],
          nb_classes: e.nb_classes || 0,
        })));
      }

      setIsCreatingEval(false);
    } catch (err) {
      console.error('Error:', err);
      alert("Erreur lors de la création des évaluations.");
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-blue-600" />
            <span>Devoirs & Compositions</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Génération groupée d'examens par classe et matière, saisie des notes et classement des élèves
          </p>
        </div>

        <button
          id="btn-create-evaluation"
          onClick={() => setIsCreatingEval(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Créer des Devoirs / Compositions</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">Toutes les périodes</option>
            {periodes.map((p: any) => (
              <option key={p.id} value={p.id}>{p.libelle}</option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">Toutes les matières</option>
            {subjects?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <span className="text-xs font-bold text-slate-500">
          {filteredEvaluations.length} évaluation(s)
        </span>
      </div>

      {/* Evaluations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Titre</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Coef.</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEvaluations.map((e) => {
                const typeLabel = e.type === "composition" ? "Composition" : e.type === "devoir" ? "Devoir" : e.type === "interrogation" ? "Interrogation" : "Examen";
                const classList = e.classes?.length > 0
                  ? e.classes.map((c: any) => c.libelle).join(", ")
                  : e.className;
                const displayTitle = `${typeLabel} en ${e.subject}${classList ? " (" + classList + ")" : ""}`;

                return (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 text-sm">{displayTitle}</p>
                      <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {typeLabel}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{e.date}</p>
                    </td>

                    <td className="px-5 py-4 font-black text-slate-900">{e.coefficient}</td>

                    <td className="px-5 py-4">
                      {e.status === "publie" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Notes saisies</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>En attente</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenGradebook(e)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Consulter les notes et le classement"
                      >
                        <Eye className="w-3.5 h-3.5 text-white" />
                        <span>Voir les Notes</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEvaluation(e.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Supprimer"
                      >
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

      {/* Gradebook Grid Modal (Read-Only) */}
      {activeGradebookEval && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Notes des élèves - {activeGradebookEval.title}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>Classe: <strong>{activeGradebookEval.className}</strong></span>
                  <span>| Matière: <strong>{activeGradebookEval.subject}</strong></span>
                  <span className="text-blue-600 font-bold flex items-center gap-1">
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    Rangées de la plus forte à la plus faible note
                  </span>
                </p>
              </div>
              <button
                onClick={() => setActiveGradebookEval(null)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Marks Table Sorted Descending */}
            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              <div className="bg-slate-50 p-3 font-bold text-slate-600 flex justify-between uppercase text-[10px]">
                <span>Rang & Élève</span>
                <span>Note attribuée par le professeur</span>
              </div>

              {students
                .filter((s) => s.classId === activeGradebookEval.classId)
                .sort((a, b) => (currentGrades[b.id] ?? 0) - (currentGrades[a.id] ?? 0))
                .map((st, idx) => {
                  const mark = currentGrades[st.id] ?? 0;
                  return (
                    <div key={st.id} className="p-3 flex items-center justify-between hover:bg-slate-50/80">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full font-black text-[10px] flex items-center justify-center ${
                          idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                          idx === 1 ? "bg-slate-200 text-slate-700" :
                          idx === 2 ? "bg-amber-800/10 text-amber-900" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-xs">
                          {st.firstName[0]}{st.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{st.firstName} {st.lastName}</p>
                          <p className="text-[10px] text-slate-400">{st.matricule}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-black text-blue-700 text-sm px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                          {(Math.round(mark * 10) / 10).toFixed(1)} / 20
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 italic">
                Mode consultation seule. Les notes sont saisies exclusivement par les professeurs.
              </span>
              <button
                onClick={() => setActiveGradebookEval(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Batch Evaluation Creation Modal */}
      {isCreatingEval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Création Groupée d'Évaluations</h3>
              </div>
              <button onClick={() => setIsCreatingEval(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type d'évaluation</label>
                  <select
                    value={batchForm.type}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, type: e.target.value as Evaluation["type"] })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    <option value="devoir">Devoir surveillé</option>
                    <option value="composition">Composition</option>
                    <option value="interrogation">Interrogation</option>
                    <option value="examen">Examen blanc</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Période</label>
                  <select
                    value={batchForm.periodeId}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, periodeId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    <option value="">-- Sélectionner --</option>
                    {periodes.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.libelle}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Classes selection checkboxes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Classes concernées ({batchForm.selectedClassIds.length} sélectionnée(s))
                </label>
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 max-h-28 overflow-y-auto">
                  {classes.map((cls) => {
                    const isSelected = batchForm.selectedClassIds.includes(cls.id);
                    return (
                      <button
                        type="button"
                        key={cls.id}
                        onClick={() => handleToggleClass(cls.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {cls.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subjects selection checkboxes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Matières concernées ({batchForm.selectedSubjects.length} sélectionnée(s))
                </label>
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 max-h-32 overflow-y-auto">
                  {subjectList.map((subj) => {
                    const isSelected = batchForm.selectedSubjects.includes(subj);
                    return (
                      <button
                        type="button"
                        key={subj}
                        onClick={() => handleToggleSubject(subj)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {subj}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Date prévisionnelle</label>
                <input
                  type="date"
                  value={batchForm.date}
                  onChange={(e) => setBatchForm({ ...batchForm, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-900">
                <strong className="block mb-0.5">Exemple de génération automatique :</strong>
                Sera généré : {batchForm.selectedClassIds.length * batchForm.selectedSubjects.length} évaluation(s) (ex: {batchForm.type} du {batchForm.term} en {batchForm.selectedSubjects[0] || "Maths"} ({classes.find(c => c.id === batchForm.selectedClassIds[0])?.name || "6ème A"}))
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingEval(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmittingBatch ? 'Création...' : 'Générer les évaluations'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
