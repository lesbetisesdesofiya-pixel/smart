import React, { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Sparkles,
  Send,
  Trash2,
  X,
  Users,
  RefreshCw,
} from "lucide-react";
import { SchoolClass } from "../types";
import { AiNoticeModal } from "./AiNoticeModal";
import { apiFetch } from "../api";

interface AnnonceItem {
  id: number;
  titre: string;
  contenu: string;
  type: string;
  classe_id: number | null;
  classe: { id: number; libelle: string } | null;
  author: { name: string } | null;
  created_at: string;
}

interface AnnouncementsManagerProps {
  classes?: SchoolClass[];
}

export const AnnouncementsManager: React.FC<AnnouncementsManagerProps> = ({
  classes = []
}) => {
  const [annonces, setAnnonces] = useState<AnnonceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAddingNotice, setIsAddingNotice] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    type: "info",
    classe_id: "" as string,
  });

  const fetchAnnonces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/school-admin/annonces");
      if (res.ok) {
        const data = await res.json();
        setAnnonces(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnonces(); }, [fetchAnnonces]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titre || !formData.contenu) return;
    setSaving(true);
    try {
      const res = await apiFetch("/school-admin/annonces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: formData.titre,
          contenu: formData.contenu,
          type: formData.type,
          classe_id: formData.classe_id ? Number(formData.classe_id) : null,
        }),
      });
      if (res.ok) {
        const newAnnonce = await res.json();
        setAnnonces(prev => [newAnnonce, ...prev]);
        setIsAddingNotice(false);
        setFormData({ titre: "", contenu: "", type: "info", classe_id: "" });
      }
    } catch {}
    setSaving(false);
  };

  const handleAiGeneratedNotice = (title: string, content: string) => {
    setFormData({ ...formData, titre: title, contenu: content });
    setIsAddingNotice(true);
  };

  const typeColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-700",
    alerte: "bg-amber-100 text-amber-700",
    urgent: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            <span>Avis aux Parents</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Publiez des communiqués ciblés par classe ou pour toute l'école
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnnonces}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualiser
          </button>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Rédiger avec l'IA</span>
          </button>
          <button
            onClick={() => setIsAddingNotice(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Avis</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Chargement...</p>
          </div>
        ) : annonces.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Aucun avis publié</p>
          </div>
        ) : (
          annonces.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">{a.titre}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${typeColors[a.type] || "bg-slate-100 text-slate-600"}`}>
                      {a.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Destinataires : <strong className="text-slate-800">
                        {a.classe ? `Classe de ${a.classe.libelle}` : "Toutes les classes"}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>{a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : ""}</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {a.contenu}
              </p>
              <div className="flex justify-end text-[11px] text-slate-400 font-medium">
                Publié par : {a.author?.name || "Administration"}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddingNotice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Publier un Avis</h3>
              <button onClick={() => setIsAddingNotice(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Titre</label>
                <input
                  type="text"
                  required
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Ex: Réunion parents d'élèves"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Classe cible</label>
                  <select
                    value={formData.classe_id}
                    onChange={(e) => setFormData({ ...formData, classe_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold outline-none"
                  >
                    <option value="">Toutes les classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold outline-none"
                  >
                    <option value="info">Information</option>
                    <option value="alerte">Alerte</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  placeholder="Rédigez l'avis aux parents..."
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNotice(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Publier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AiNoticeModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onNoticeGenerated={handleAiGeneratedNotice}
      />
    </div>
  );
};
