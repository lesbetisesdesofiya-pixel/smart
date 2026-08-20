import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api";
import { FileCheck, Image, CheckCircle, Clock, Loader2, X } from "lucide-react";

interface GradeSubmission {
  id: number;
  prof: string;
  school: string;
  classe: string;
  matiere: string;
  image_url: string | null;
  status: "pending" | "processed";
  json_data: any[] | null;
  created_at: string;
}

interface Evaluation {
  id: number;
  titre: string;
  matiere: { id: number; libelle: string } | null;
}

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
}

export const GradeSubmissionsManager: React.FC = () => {
  const [submissions, setSubmissions] = useState<GradeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GradeSubmission | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvalId, setSelectedEvalId] = useState<number | null>(null);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [showImage, setShowImage] = useState(false);

  const loadSubmissions = useCallback(async () => {
    try {
      const res = await apiFetch("/superadmin/grade-submissions");
      if (res.ok) {
        setSubmissions(await res.json());
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

  const loadEvaluations = async (schoolId: number, classeId: number) => {
    try {
      const res = await apiFetch(`/superadmin/schools/${schoolId}/evaluations`);
      if (res.ok) {
        const data = await res.json();
        const filtered = Array.isArray(data) ? data.filter((e: any) => e.classe_id === classeId) : [];
        setEvaluations(filtered.map((e: any) => ({
          id: e.id,
          titre: e.titre,
          matiere: e.matiere,
        })));
      }
    } catch {}
  };

  const loadEleves = async (schoolId: number, classeId: number) => {
    try {
      const res = await apiFetch(`/superadmin/schools/${schoolId}/eleves`);
      if (res.ok) {
        const data = await res.json();
        const filtered = Array.isArray(data) ? data.filter((e: any) => e.classe_id === classeId) : [];
        setEleves(filtered.map((e: any) => ({ id: e.id, nom: e.nom, prenom: e.prenom })));
      }
    } catch {}
  };

  const handleSelect = (sub: GradeSubmission) => {
    setSelected(sub);
    setJsonInput("");
    setMessage(null);
    setSelectedEvalId(null);

    if (sub.classe !== "—" && sub.school !== "—") {
      const schoolId = submissions.find(s => s.id === sub.id)?.school;
    }
  };

  const handleProcess = async () => {
    if (!selected || !selectedEvalId || !jsonInput.trim()) return;

    setProcessing(true);
    setMessage(null);

    try {
      let notes: any[];
      try {
        notes = JSON.parse(jsonInput);
      } catch {
        setMessage("JSON invalide");
        setProcessing(false);
        return;
      }

      const res = await apiFetch(`/superadmin/grade-submissions/${selected.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluation_id: selectedEvalId,
          notes: notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message || "Notes enregistrées");
        loadSubmissions();
      } else {
        const err = await res.json();
        setMessage(err.message || "Erreur lors du traitement");
      }
    } catch {
        setMessage("Erreur réseau");
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = submissions.filter(s => s.status === "pending").length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Notes reçues</h1>
          <p className="text-sm text-slate-400 mt-1">
            {pendingCount} en attente / {submissions.length} total
          </p>
        </div>
        <button onClick={loadSubmissions} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm">
          Actualiser
        </button>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune soumission de notes.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {submissions.map(sub => (
            <div
              key={sub.id}
              className={`bg-slate-800 rounded-xl p-5 border transition-all cursor-pointer hover:border-amber-500/50 ${
                sub.status === "pending" ? "border-amber-500/30" : "border-slate-700"
              } ${selected?.id === sub.id ? "ring-2 ring-amber-500/50" : ""}`}
              onClick={() => handleSelect(sub)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">{sub.prof}</span>
                    {sub.status === "pending" ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> En attente
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Traité
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {sub.school} — {sub.classe} — {sub.matiere}
                  </p>
                  <p className="text-[10px] text-slate-500">{sub.created_at}</p>
                </div>
                {sub.image_url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelected(sub); setShowImage(true); }}
                    className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-slate-300"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                )}
              </div>

              {selected?.id === sub.id && sub.status === "pending" && (
                <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Évaluation</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                      value={selectedEvalId ?? ""}
                      onChange={(e) => setSelectedEvalId(Number(e.target.value) || null)}
                    >
                      <option value="">Choisir une évaluation...</option>
                      {evaluations.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.titre} {ev.matiere ? `(${ev.matiere.libelle})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      JSON des notes
                      <span className="font-normal text-slate-500 ml-2">
                        Format : [{"{"}"eleve_id": 1, "note": 14{"}"}]
                      </span>
                    </label>
                    <textarea
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono h-32"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='[{"eleve_id": 1, "note": 14, "appreciation": "Bien"}, {"eleve_id": 2, "note": 16}]'
                    />
                  </div>

                  {message && (
                    <div className={`text-sm p-2 rounded-lg ${message.includes("Erreur") ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                      {message}
                    </div>
                  )}

                  <button
                    onClick={handleProcess}
                    disabled={processing || !selectedEvalId || !jsonInput.trim()}
                    className="w-full py-2.5 bg-amber-500 text-slate-900 font-bold text-sm rounded-lg hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Traiter les notes
                  </button>
                </div>
              )}

              {selected?.id === sub.id && sub.status === "processed" && sub.json_data && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs font-semibold text-slate-300 mb-2">Notes traitées :</p>
                  <div className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-slate-400 max-h-40 overflow-auto">
                    {JSON.stringify(sub.json_data, null, 2)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image modal */}
      {showImage && selected?.image_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowImage(false)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowImage(false)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <img
              src={selected.image_url}
              alt="Notes envoyées"
              className="w-full rounded-xl shadow-2xl"
            />
            <div className="mt-3 text-center">
              <p className="text-sm text-white/80">{selected.prof} — {selected.classe} — {selected.matiere}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
