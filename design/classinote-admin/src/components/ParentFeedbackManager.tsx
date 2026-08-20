import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api";
import { MessageSquare, RefreshCw, CheckCircle, Filter } from "lucide-react";

interface FeedbackItem {
  id: number;
  type: string;
  subject: string | null;
  contenu: string;
  lu: boolean;
  parent_telephone: string | null;
  created_at: string;
}

export const ParentFeedbackManager: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/school-admin/parent-feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const handleMarkRead = async (id: number) => {
    try {
      const res = await apiFetch(`/school-admin/parent-feedback/${id}/read`, { method: "POST" });
      if (res.ok) {
        setFeedback(prev => prev.map(f => f.id === id ? { ...f, lu: true } : f));
      }
    } catch {}
  };

  const filtered = feedback.filter(f => {
    if (filterType === "all") return true;
    if (filterType === "unread") return !f.lu;
    return f.type === filterType;
  });

  const typeColors: Record<string, string> = {
    avis: "bg-emerald-100 text-emerald-700",
    suggestion: "bg-blue-100 text-blue-700",
    bug: "bg-red-100 text-red-700",
  };

  const typeLabels: Record<string, string> = {
    avis: "Avis",
    suggestion: "Suggestion",
    bug: "Bug",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-600 text-white shadow-lg">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Avis des Parents</h1>
            <p className="text-sm text-slate-500">Retours et suggestions des parents</p>
          </div>
        </div>
        <button
          onClick={fetchFeedback}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        {["all", "unread", "avis", "suggestion", "bug"].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === t
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t === "all" ? "Tous" : t === "unread" ? "Non lus" : typeLabels[t] || t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Aucun avis pour le moment</p>
          </div>
        ) : (
          filtered.map(f => (
            <div
              key={f.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${
                f.lu ? "border-slate-100 opacity-70" : "border-purple-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${typeColors[f.type] || "bg-slate-100 text-slate-600"}`}>
                    {typeLabels[f.type] || f.type}
                  </span>
                  {!f.lu && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">{f.created_at}</span>
                  {!f.lu && (
                    <button
                      onClick={() => handleMarkRead(f.id)}
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      title="Marquer comme lu"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {f.subject && (
                <p className="text-sm font-bold text-slate-900 mb-1">{f.subject}</p>
              )}
              <p className="text-sm text-slate-600 leading-relaxed">{f.contenu}</p>
              {f.parent_telephone && (
                <p className="text-[11px] text-slate-400 mt-2">Parent : {f.parent_telephone}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
