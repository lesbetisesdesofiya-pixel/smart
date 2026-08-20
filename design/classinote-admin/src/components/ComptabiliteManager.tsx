import React, { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Loader2, Filter, X } from "lucide-react";
import { apiFetch } from "../api";

interface DashboardData {
  resume: { total_encaisse: number; total_decaisse: number; solde: number };
  encaissements: { par_type: Record<string, number>; par_mois: Record<string, number> };
  decaissements: { par_categorie: Record<string, number> };
}

interface Decaissement {
  id: string;
  libelle: string;
  categorie: string;
  montant: number;
  date: string;
  beneficiaire: string;
  methode_paiement: string;
}

const CATEGORIES = [
  { value: "salaire", label: "Salaires" },
  { value: "loyer", label: "Loyer" },
  { value: "fournitures", label: "Fournitures" },
  { value: "transport", label: "Transport" },
  { value: "entretien", label: "Entretien" },
  { value: "autre", label: "Autre" },
];

export const ComptabiliteManager: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    libelle: "",
    categorie: "autre",
    montant: 0,
    date: new Date().toISOString().split("T")[0],
    beneficiaire: "",
    methode_paiement: "especes",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resDash, resDec] = await Promise.all([
        apiFetch("/school-admin/comptabilite/dashboard"),
        apiFetch("/school-admin/comptabilite/decaissements"),
      ]);

      if (resDash.ok) {
        const data = await resDash.json();
        setDashboard(data);
      }
      if (resDec.ok) {
        const data = await resDec.json();
        setDecaissements(data.decaissements?.data || data.decaissements || []);
      }
    } catch {}
    setLoading(false);
  };

  const handleSaveDecaissement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch("/school-admin/comptabilite/decaissements", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ libelle: "", categorie: "autre", montant: 0, date: new Date().toISOString().split("T")[0], beneficiaire: "", methode_paiement: "especes", notes: "" });
        loadData();
      }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce décaissement ?")) return;
    try {
      await apiFetch(`/school-admin/comptabilite/decaissements/${id}`, { method: "DELETE" });
      setDecaissements((prev) => prev.filter((d) => d.id !== id));
    } catch {}
  };

  const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <span>Comptabilité</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">Rapports financiers, encaissements et décaissements</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un décaissement
        </button>
      </div>

      {/* Dashboard Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase">Encaissements</span>
            </div>
            <p className="text-2xl font-black text-emerald-900">{fmt(dashboard.resume.total_encaisse)}</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              <span className="text-xs font-bold text-rose-700 uppercase">Décaissements</span>
            </div>
            <p className="text-2xl font-black text-rose-900">{fmt(dashboard.resume.total_decaisse)}</p>
          </div>
          <div className={`border rounded-2xl p-5 ${dashboard.resume.solde >= 0 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={`w-5 h-5 ${dashboard.resume.solde >= 0 ? "text-blue-600" : "text-amber-600"}`} />
              <span className={`text-xs font-bold uppercase ${dashboard.resume.solde >= 0 ? "text-blue-700" : "text-amber-700"}`}>Solde</span>
            </div>
            <p className={`text-2xl font-black ${dashboard.resume.solde >= 0 ? "text-blue-900" : "text-amber-900"}`}>{fmt(dashboard.resume.solde)}</p>
          </div>
        </div>
      )}

      {/* Encaissements par type */}
      {dashboard?.encaissements?.par_type && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 mb-3">Encaissements par type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(dashboard.encaissements.par_type).map(([type, total]) => (
              <div key={type} className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase">{type}</p>
                <p className="text-lg font-black text-slate-900">{fmt(Number(total))}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Décaissements List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Décaissements ({decaissements.length})</h3>
        {decaissements.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Aucun décaissement enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Libellé</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Catégorie</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Bénéficiaire</th>
                  <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Montant</th>
                  <th className="text-center py-2 px-3 text-xs font-bold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {decaissements.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-600">{d.date}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{d.libelle}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {CATEGORIES.find((c) => c.value === d.categorie)?.label || d.categorie}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{d.beneficiaire || "—"}</td>
                    <td className="py-2 px-3 text-right font-black text-rose-700">{fmt(d.montant)}</td>
                    <td className="py-2 px-3 text-center">
                      <button onClick={() => handleDelete(d.id)} className="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Decaissement Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Nouveau Décaissement</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDecaissement} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Libellé</label>
                <input type="text" required value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catégorie</label>
                  <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Montant (FCFA)</label>
                  <input type="number" min={0} required value={form.montant} onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bénéficiaire</label>
                  <input type="text" value={form.beneficiaire} onChange={(e) => setForm({ ...form, beneficiaire: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Annuler</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold shadow-md disabled:opacity-60 flex items-center gap-1.5">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
