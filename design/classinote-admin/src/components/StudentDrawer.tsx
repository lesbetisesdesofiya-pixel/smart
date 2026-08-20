import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Phone,
  Printer,
  Receipt,
  User,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  Filter,
  BarChart3,
  BookOpen,
  Loader2
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Student } from "../types";
import { apiFetch } from "../api";

interface StudentDrawerProps {
  student: Student | null;
  onClose: () => void;
  onGenerateReportCard?: (student: Student) => void;
  onOpenPaymentModal?: (student: Student) => void;
}

interface ProgressionNote {
  id: number;
  matiere: string;
  prof: string;
  periode: string;
  type_evaluation: string;
  valeur: number;
  date_evaluation: string;
  remarque: string | null;
  evaluation: string | null;
}

interface ProgressionAnnee {
  annee_scolaire: string;
  annee_id: string | number;
  notes: ProgressionNote[];
  moyenne: number;
  meilleure_note: number;
  plus_basse_note: number;
  nombre_notes: number;
}

interface ProgressionData {
  eleve: {
    id: number;
    nom: string;
    prenom: string;
    matricule: string;
    classe_actuelle: string | null;
    section: string | null;
  };
  progression: ProgressionAnnee[];
  resume: {
    total_notes: number;
    moyenne_generale: number | null;
    nb_annees: number;
  };
}

export const StudentDrawer: React.FC<StudentDrawerProps> = ({
  student,
  onClose,
  onOpenPaymentModal
}) => {
  if (!student) return null;

  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [progression, setProgression] = useState<ProgressionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const remainingTuition = Math.max(0, student.tuitionTotal - student.tuitionPaid);

  useEffect(() => {
    let cancelled = false;
    async function loadProgression() {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch(`/school-admin/eleves/${student.id}/progression`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && !cancelled) {
            setProgression(data);
          }
        } else {
          if (!cancelled) setError("Impossible de charger la progression");
        }
      } catch {
        if (!cancelled) setError("Erreur de connexion");
      }
      if (!cancelled) setLoading(false);
    }
    loadProgression();
    return () => { cancelled = true; };
  }, [student.id]);

  const years = useMemo(() => {
    if (!progression) return [];
    return progression.progression.map(p => p.annee_scolaire);
  }, [progression]);

  const allNotes = useMemo(() => {
    if (!progression) return [];
    if (selectedYear === "all") {
      return progression.progression.flatMap(a => a.notes);
    }
    const yearData = progression.progression.find(a => a.annee_scolaire === selectedYear);
    return yearData ? yearData.notes : [];
  }, [progression, selectedYear]);

  const filteredGrades = useMemo(() => {
    return allNotes.filter((g) => {
      const matchesTerm = selectedTerm === "all" || g.periode === selectedTerm;
      const matchesSubject = selectedSubject === "all" || g.matiere === selectedSubject;
      return matchesTerm && matchesSubject;
    });
  }, [allNotes, selectedTerm, selectedSubject]);

  const filteredAverage = useMemo(() => {
    if (filteredGrades.length === 0) return 0;
    const sum = filteredGrades.reduce((acc, g) => acc + g.valeur, 0);
    return Math.round((sum / filteredGrades.length) * 10) / 10;
  }, [filteredGrades]);

  const chartData = useMemo(() => {
    return filteredGrades.map((g) => ({
      name: `${g.date_evaluation} (${g.matiere.substring(0, 5)}.)`,
      note: Number(g.valeur.toFixed(1)),
      titre: `${g.evaluation || g.type_evaluation} - ${g.matiere}`
    }));
  }, [filteredGrades]);

  const subjects = useMemo(() => {
    const set = new Set(allNotes.map(n => n.matiere));
    return Array.from(set).sort();
  }, [allNotes]);

  const terms = useMemo(() => {
    const set = new Set(allNotes.map(n => n.periode));
    return Array.from(set).sort();
  }, [allNotes]);

  const currentYearData = useMemo(() => {
    if (!progression) return null;
    if (selectedYear === "all") {
      return {
        moyenne: progression.resume.moyenne_generale,
        nombre_notes: progression.resume.total_notes,
        meilleure_note: Math.max(...progression.progression.map(p => p.meilleure_note)),
        plus_basse_note: Math.min(...progression.progression.map(p => p.plus_basse_note)),
      };
    }
    return progression.progression.find(a => a.annee_scolaire === selectedYear) || null;
  }, [progression, selectedYear]);

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg">
              {student.firstName[0]}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Dossier & Évolution Élève</h3>
              <p className="text-xs text-slate-300">Matricule: {student.matricule}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-700 custom-scrollbar">
          {/* Profile Overview */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-base">
                {student.firstName} {student.lastName}
              </h4>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px]">
                  Classe: {student.className}
                </span>
              </div>
              <p className="text-slate-500">Inscrit le {student.registrationDate}</p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-sm text-slate-500">Chargement de la progression...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm text-center">
              {error}
            </div>
          )}

          {!loading && !error && progression && (
            <>
              {/* Multi-Year Progression Summary */}
              {progression.progression.length > 1 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 space-y-3">
                  <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Évolution sur {progression.progression.length} années
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {progression.progression.map((a) => (
                      <div
                        key={a.annee_scolaire}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedYear === a.annee_scolaire
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white border-slate-200 hover:border-blue-300"
                        }`}
                        onClick={() => setSelectedYear(a.annee_scolaire)}
                      >
                        <p className={`font-bold text-[11px] ${selectedYear === a.annee_scolaire ? "text-blue-100" : "text-slate-500"}`}>
                          {a.annee_scolaire}
                        </p>
                        <p className={`font-black text-lg ${selectedYear === a.annee_scolaire ? "text-white" : "text-blue-700"}`}>
                          {a.moyenne.toFixed(1)} / 20
                        </p>
                        <p className={`text-[10px] ${selectedYear === a.annee_scolaire ? "text-blue-200" : "text-slate-400"}`}>
                          {a.nombre_notes} notes
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedYear("all")}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedYear === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                    }`}
                  >
                    Toutes les années confondues
                  </button>
                </div>
              )}

              {/* ACADEMIC EVOLUTION & NOTES SECTION */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h5 className="font-extrabold text-slate-900 text-sm">
                      Performance & Courbe d'Évolution
                    </h5>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-xl font-extrabold text-xs">
                    <span>Moyenne calculée :</span>
                    <span className="text-sm">{(Math.round(filteredAverage * 10) / 10).toFixed(1)} / 20</span>
                  </div>
                </div>

                {currentYearData && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Meilleure</p>
                      <p className="font-black text-emerald-700 text-sm">{currentYearData.meilleure_note.toFixed(1)}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <p className="text-[10px] font-bold text-amber-600 uppercase">Plus basse</p>
                      <p className="font-black text-amber-700 text-sm">{currentYearData.plus_basse_note.toFixed(1)}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                      <p className="text-[10px] font-bold text-blue-600 uppercase">Notes</p>
                      <p className="font-black text-blue-700 text-sm">{currentYearData.nombre_notes}</p>
                    </div>
                  </div>
                )}

                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-slate-400" />
                      <span>Trimestre :</span>
                    </label>
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
                    >
                      <option value="all">Tous</option>
                      {terms.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span>Matière :</span>
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
                    >
                      <option value="all">Toutes</option>
                      {subjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {years.length > 1 && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                        <span>Année :</span>
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
                      >
                        <option value="all">Toutes</option>
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Recharts Evolution Curve */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Graphique d'évolution des notes (/20)
                  </span>
                  {chartData.length > 0 ? (
                    <div className="w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                          <YAxis domain={[0, 20]} tick={{ fontSize: 10, fill: "#64748b" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderRadius: "12px",
                              color: "#fff",
                              fontSize: "11px",
                              border: "none"
                            }}
                            formatter={(val: any) => [`${val} / 20`, "Note"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="note"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ r: 5, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 font-medium text-xs">
                      Aucune note enregistrée pour ces filtres.
                    </div>
                  )}
                </div>

                {/* List of Filtered Notes */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 text-xs block flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>Liste des notes évaluées ({filteredGrades.length})</span>
                  </span>

                  <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                    {filteredGrades.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">Aucune note trouvée</div>
                    ) : (
                      filteredGrades.map((g) => (
                        <div key={g.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 text-xs">{g.evaluation || g.type_evaluation} - {g.matiere}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">{g.periode}</span>
                              <span>{g.date_evaluation}</span>
                              {g.prof && <span className="text-slate-400">• {g.prof}</span>}
                              {g.remarque && <span className="text-emerald-700 italic">• {g.remarque}</span>}
                            </div>
                          </div>
                          <span className="font-black text-blue-700 text-sm px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-100">
                            {g.valeur.toFixed(1)} / 20
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tuition & Payment Status Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Scolarité
              </span>
              {student.paymentStatus === "a_jour" && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  À jour
                </span>
              )}
              {student.paymentStatus === "partiel" && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                  Paiement partiel
                </span>
              )}
              {student.paymentStatus === "en_retard" && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                  En retard
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span>Total Scolarité: {student.tuitionTotal.toLocaleString("fr-FR")} FCFA</span>
                <span className="text-emerald-600 font-bold">
                  Payé: {student.tuitionPaid.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((student.tuitionPaid / student.tuitionTotal) * 100)
                    )}%`
                  }}
                />
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between mt-2">
                <span className="font-bold text-amber-900 text-xs">Scolarité Restante à Payer :</span>
                <span className="font-black text-amber-900 text-sm">
                  {remainingTuition.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Parent / Legal Guardian Contact Details */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3">
            <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              Coordonnées de Contact Parent
            </h5>

            <div className="space-y-2 text-slate-700">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Téléphone:</span>
                <a href={`tel:${student.parentPhone}`} className="text-blue-600 font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {student.parentPhone}
                </a>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Email:</span>
                <strong className="text-slate-800">{student.parentEmail}</strong>
              </div>

              <div className="flex items-start justify-between py-1">
                <span className="text-slate-500">Adresse:</span>
                <strong className="text-slate-800 text-right">{student.parentAddress}</strong>
              </div>
            </div>

            {student.parentMagicToken && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <span className="text-slate-500 text-[11px] font-bold uppercase">Lien magique parent:</span>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/smart/public/app/parent/activate/${student.parentMagicToken}`}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600 truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/smart/public/app/parent/activate/${student.parentMagicToken}`);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Copier
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Ce lien permet au parent d'activer son compte et de définir son PIN.</p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={handlePrintDossier}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimer Fiche</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
