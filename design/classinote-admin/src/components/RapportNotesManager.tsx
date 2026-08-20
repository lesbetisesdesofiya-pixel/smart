import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Filter,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "../api";
import { SchoolClass, SubjectItem } from "../types";

interface RapportNotesManagerProps {
  classes: SchoolClass[];
  subjects: SubjectItem[];
}

interface RapportStats {
  total_notes: number;
  moyenne_generale: number | null;
  note_max: number | null;
  note_min: number | null;
}

interface RapportEvaluation {
  evaluation_id: number;
  titre: string;
  type_evaluation: string;
  matiere: string;
  date: string;
  moyenne: number;
  min: number;
  max: number;
  nombre_eleves: number;
}

export const RapportNotesManager: React.FC<RapportNotesManagerProps> = ({
  classes,
  subjects,
}) => {
  const [stats, setStats] = useState<RapportStats | null>(null);
  const [evaluations, setEvaluations] = useState<RapportEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterClass !== "all") params.append("classe_id", filterClass);
      if (filterSubject !== "all") params.append("matiere_id", filterSubject);

      const qs = params.toString();
      const url = `/school-admin/rapport-notes${qs ? `?${qs}` : ""}`;
      const res = await apiFetch(url);
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        setEvaluations(data.par_evaluation || []);
      } else {
        setError(data.message || "Erreur lors du chargement du rapport.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterClass, filterSubject]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            Rapport des Notes
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Vue d'ensemble des résultats par évaluation et discipline
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
          <Filter className="w-4 h-4" /> Filtres
        </div>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          <option value="all">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          <option value="all">Toutes les matières</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          <span className="ml-3 text-slate-500 font-bold">Chargement du rapport...</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <p className="text-rose-700 text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">
              Total Notes
            </span>
            <span className="font-black text-slate-900 text-2xl">
              {stats.total_notes}
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">
              Moyenne Générale
            </span>
            <span className="font-black text-violet-600 text-2xl">
              {stats.moyenne_generale !== null ? `${stats.moyenne_generale}/20` : "—"}
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> Note Maximale
            </span>
            <span className="font-black text-emerald-600 text-2xl">
              {stats.note_max !== null ? `${stats.note_max}/20` : "—"}
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-rose-500" /> Note Minimale
            </span>
            <span className="font-black text-rose-600 text-2xl">
              {stats.note_min !== null ? `${stats.note_min}/20` : "—"}
            </span>
          </div>
        </div>
      )}

      {/* Evaluations Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800">
              Détail par Évaluation ({evaluations.length})
            </h3>
          </div>
          {evaluations.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">
                Aucune donnée de notes disponible pour les filtres sélectionnés.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Évaluation
                    </th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Type
                    </th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Matière
                    </th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Élèves
                    </th>
                    <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Moyenne
                    </th>
                    <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Min / Max
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluations.map((ev, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {ev.titre || `Évaluation #${ev.evaluation_id}`}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-100 text-violet-700">
                          {ev.type_evaluation || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {ev.matiere}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {ev.date
                          ? new Date(ev.date).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600">
                          <Users className="w-3 h-3" /> {ev.nombre_eleves}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`font-black text-sm ${
                            ev.moyenne >= 10
                              ? "text-emerald-600"
                              : ev.moyenne >= 8
                              ? "text-amber-600"
                              : "text-rose-600"
                          }`}
                        >
                          {ev.moyenne}/20
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-xs font-bold text-slate-500">
                        <span className="text-rose-500">{ev.min}</span>
                        {" / "}
                        <span className="text-emerald-500">{ev.max}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
