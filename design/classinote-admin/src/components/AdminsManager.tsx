import React, { useEffect, useState } from "react";
import {
  UserCog,
  KeyRound,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Search,
  Building2,
  Loader2,
  X,
  ShieldCheck,
  ShieldOff,
  Mail,
  Shield,
} from "lucide-react";
import { apiFetch } from "../api";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  school?: { id: number; nom: string };
}

export const AdminsManager: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resettingPinId, setResettingPinId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/superadmin/schools");
      if (res.ok) {
        const data = await res.json();
        const ecoles = data.ecoles || data || [];
        setSchools(ecoles);
        const allAdmins: AdminUser[] = [];
        ecoles.forEach((ecole: any) => {
          (ecole.admins || []).forEach((admin: any) => {
            allAdmins.push({
              id: admin.id,
              name: admin.name || admin.nom || "—",
              email: admin.email,
              role: admin.role || "admin",
              active: admin.active !== false,
              school: { id: ecole.id, nom: ecole.nom },
            });
          });
        });
        setAdmins(allAdmins);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetPassword = async (admin: AdminUser) => {
    if (!confirm(`Réinitialiser le mot de passe de "${admin.name}" ?\nNouveau mot de passe: password`)) return;
    setResettingId(admin.id);
    setMsg(null);
    try {
      const res = await apiFetch(`/superadmin/admins/${admin.id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (res.ok || data.success) {
        setMsg({ type: "success", text: `Mot de passe de "${admin.name}" réinitialisé à "password"` });
        loadData();
      } else {
        setMsg({ type: "error", text: data.message || "Erreur" });
      }
    } catch {
      setMsg({ type: "error", text: "Erreur réseau" });
    }
    setResettingId(null);
  };

  const handleResetPin = async (admin: AdminUser) => {
    if (!confirm(`Réinitialiser le PIN de "${admin.name}" ?\nSon PIN sera supprimé.`)) return;
    setResettingPinId(admin.id);
    setMsg(null);
    try {
      const res = await apiFetch(`/superadmin/admins/${admin.id}/reset-pin`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: `PIN de "${admin.name}" réinitialisé` });
      } else {
        setMsg({ type: "error", text: data.message || "Erreur" });
      }
    } catch {
      setMsg({ type: "error", text: "Erreur réseau" });
    }
    setResettingPinId(null);
  };

  const filtered = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.school?.nom || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Administrateurs</h1>
        <p className="text-sm text-slate-500 mt-1">{admins.length} administrateur(s) — {schools.length} école(s)</p>
      </div>

      {/* Message */}
      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un administrateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      {/* Admins List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Aucun administrateur trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">École</th>
                <th className="px-5 py-3">Rôle</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900">{admin.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {admin.email}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {admin.school?.nom || "—"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      admin.role === "superadmin"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {admin.role === "superadmin" ? "Super Admin" : "Admin"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1 text-[11px] font-semibold ${
                      admin.active ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {admin.active ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                      {admin.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleResetPassword(admin)}
                        disabled={resettingId === admin.id}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-extrabold text-[11px] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {resettingId === admin.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <KeyRound className="w-3.5 h-3.5" />
                        )}
                        <span>Reset MDP</span>
                      </button>
                      <button
                        onClick={() => handleResetPin(admin)}
                        disabled={resettingPinId === admin.id}
                        className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 text-white font-extrabold text-[11px] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {resettingPinId === admin.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Shield className="w-3.5 h-3.5" />
                        )}
                        <span>Reset PIN</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
