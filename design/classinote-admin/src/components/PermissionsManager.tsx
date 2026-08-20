import React, { useState, useEffect, useCallback } from "react";
import { Shield, CheckCircle, XCircle, Clock, Loader2, User, AlertTriangle } from "lucide-react";
import { apiFetch } from "../api";

interface DemandeAcces {
  id: number;
  parent_id: number;
  eleve_id: number;
  school_id: number;
  type: "unlock_access" | "view_grades" | "view_notes";
  raison: string | null;
  statut: "en_attente" | "approuve" | "rejete";
  reponse_admin: string | null;
  created_at: string;
  parent?: { telephone: string; code: string };
  eleve?: { nom: string; prenom: string; classe?: { libelle: string } };
}

export const PermissionsManager: React.FC = () => {
  const [demandes, setDemandes] = useState<DemandeAcces[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [selectedDemande, setSelectedDemande] = useState<DemandeAcces | null>(null);
  const [filter, setFilter] = useState<"all" | "en_attente" | "approuve" | "rejete">("all");

  const loadDemandes = useCallback(async () => {
    try {
      const res = await apiFetch("/school-admin/demandes-acces");
      if (res.ok) {
        const data = await res.json();
        setDemandes(Array.isArray(data) ? data : data?.demandes || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDemandes();
  }, [loadDemandes]);

  const handleUpdate = async (demandeId: number, statut: "approuve" | "rejete") => {
    setProcessingId(demandeId);
    try {
      const res = await apiFetch(`/school-admin/demandes-acces/${demandeId}`, {
        method: "PUT",
        body: JSON.stringify({ statut, reponse_admin: responseText || null }),
      });
      if (res.ok) {
        setDemandes((prev) =>
          prev.map((d) =>
            d.id === demandeId
              ? { ...d, statut, reponse_admin: responseText || null }
              : d
          )
        );
        setSelectedDemande(null);
        setResponseText("");
      }
    } catch {
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = filter === "all" ? demandes : demandes.filter((d) => d.statut === filter);
  const pendingCount = demandes.filter((d) => d.statut === "en_attente").length;

  const typeLabels: Record<string, { label: string; icon: string }> = {
    unlock_access: { label: "Déverrouiller l'accès", icon: "lock_open" },
    view_grades: { label: "Voir les notes", icon: "grading" },
    view_notes: { label: "Voir les appréciations", icon: "sticky_note_2" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>Permissions & Demandes d'Accès</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Gérer les demandes d'accès des parents
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            {pendingCount} en attente
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: demandes.length, color: "text-slate-700", bg: "bg-slate-50" },
          { label: "En attente", value: demandes.filter((d) => d.statut === "en_attente").length, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Approuvées", value: demandes.filter((d) => d.statut === "approuve").length, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Rejetées", value: demandes.filter((d) => d.statut === "rejete").length, color: "text-rose-700", bg: "bg-rose-50" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} p-4 rounded-2xl border border-slate-100`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color} mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1">
        {(["all", "en_attente", "approuve", "rejete"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === f
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {f === "all" ? "Toutes" : f === "en_attente" ? "En attente" : f === "approuve" ? "Approuvées" : "Rejetées"}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-xs">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Aucune demande</p>
          <p className="text-xs text-slate-400 mt-1">
            {filter === "all" ? "Aucune demande d'accès reçue pour le moment." : `Aucune demande avec le statut "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((demande) => {
            const typeInfo = typeLabels[demande.type] || { label: demande.type, icon: "help" };
            return (
              <div
                key={demande.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md ${
                  demande.statut === "en_attente" ? "border-amber-200" : "border-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      demande.statut === "en_attente" ? "bg-amber-100 text-amber-600" :
                      demande.statut === "approuve" ? "bg-emerald-100 text-emerald-600" :
                      "bg-rose-100 text-rose-600"
                    }`}>
                      <span className="material-symbols-outlined text-xl">{typeInfo.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">{typeInfo.label}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          demande.statut === "en_attente" ? "bg-amber-100 text-amber-700" :
                          demande.statut === "approuve" ? "bg-emerald-100 text-emerald-700" :
                          "bg-rose-100 text-rose-700"
                        }`}>
                          {demande.statut === "en_attente" ? "En attente" : demande.statut === "approuve" ? "Approuvée" : "Rejetée"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Parent: {demande.parent?.telephone || "N/A"} — Élève:{" "}
                        {demande.eleve ? `${demande.eleve.prenom} ${demande.eleve.nom}` : "N/A"}
                        {demande.eleve?.classe ? ` (${demande.eleve.classe.libelle})` : ""}
                      </p>
                      {demande.raison && (
                        <p className="text-xs text-slate-400 mt-1 italic">"{demande.raison}"</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(demande.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      {demande.reponse_admin && (
                        <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          Réponse: {demande.reponse_admin}
                        </p>
                      )}
                    </div>
                  </div>

                  {demande.statut === "en_attente" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedDemande(demande)}
                        disabled={processingId === demande.id}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Approuver"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDemande(demande);
                          setResponseText("");
                        }}
                        disabled={processingId === demande.id}
                        className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Rejeter"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {selectedDemande && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Traiter la demande #{selectedDemande.id}
              </h3>
              <button
                onClick={() => { setSelectedDemande(null); setResponseText(""); }}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2">
              <p><strong>Type:</strong> {typeLabels[selectedDemande.type]?.label || selectedDemande.type}</p>
              <p><strong>Parent:</strong> {selectedDemande.parent?.telephone || "N/A"}</p>
              <p><strong>Élève:</strong> {selectedDemande.eleve ? `${selectedDemande.eleve.prenom} ${selectedDemande.eleve.nom}` : "N/A"}</p>
              {selectedDemande.raison && <p><strong>Raison:</strong> {selectedDemande.raison}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Réponse (optionnel)</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Message pour le parent..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedDemande(null); setResponseText(""); }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                onClick={() => handleUpdate(selectedDemande.id, "rejete")}
                disabled={processingId === selectedDemande.id}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {processingId === selectedDemande.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Rejeter
              </button>
              <button
                onClick={() => handleUpdate(selectedDemande.id, "approuve")}
                disabled={processingId === selectedDemande.id}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {processingId === selectedDemande.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Approuver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
