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
  Eye,
} from "lucide-react";
import { apiFetch, generateAdminLink } from "../api";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  school?: { id: number; nom: string };
}

interface AdminsManagerProps {
  onViewSchool?: (schoolId: number, schoolName: string) => void;
}

export const AdminsManager: React.FC<AdminsManagerProps> = ({ onViewSchool }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resettingPinId, setResettingPinId] = useState<number | null>(null);

  // PIN verification for viewing school
  const [viewPinModal, setViewPinModal] = useState<{ schoolId: number; schoolName: string; adminId: number } | null>(null);
  const [viewPin, setViewPin] = useState("");
  const [viewPinError, setViewPinError] = useState<string | null>(null);
  const [viewPinLoading, setViewPinLoading] = useState(false);
  const [magicLink, setMagicLink] = useState<{ url: string; expiresIn: number } | null>(null);

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
    if (!confirm(`Réinitialiser le mot de passe de "${admin.name}" ?`)) return;
    setResettingId(admin.id);
    setMsg(null);
    try {
      const res = await apiFetch(`/superadmin/admins/${admin.id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (res.ok || data.success) {
        setMsg({
          type: "success",
          text: `Mot de passe de "${admin.name}" réinitialisé.\nNouveau mot de passe : ${data.temporary_password}\n\nCommuniquez-le à l'admin de manière sécurisée.`,
        });
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
    if (!confirm(`Réinitialiser le PIN de "${admin.name}" ?`)) return;
    setResettingPinId(admin.id);
    setMsg(null);
    try {
      const res = await apiFetch(`/superadmin/admins/${admin.id}/reset-pin`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMsg({
          type: "success",
          text: `PIN de "${admin.name}" réinitialisé.\nNouveau PIN : ${data.temporary_pin}\n\nCommuniquez-le à l'admin de manière sécurisée.`,
        });
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
                      {onViewSchool && admin.school && (
                        <button
                          onClick={() => {
                            setViewPinModal({ schoolId: admin.school!.id, schoolName: admin.school!.nom, adminId: admin.id });
                            setViewPin("");
                            setViewPinError(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Voir</span>
                        </button>
                      )}
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

      {/* View PIN Modal */}
      {viewPinModal && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Accès sécurisé</h3>
              <p className="text-xs text-slate-500 mt-1">
                Saisissez votre PIN superadmin pour accéder à <strong>{viewPinModal.schoolName}</strong>
              </p>
            </div>
            <input
              type="password"
              value={viewPin}
              onChange={(e) => setViewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
              maxLength={6}
              autoFocus
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {viewPinError && (
              <p className="text-xs text-red-600 text-center font-medium bg-red-50 p-2 rounded-lg border border-red-200">{viewPinError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setViewPinModal(null); setViewPin(""); setViewPinError(null); }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!viewPinModal || viewPin.length !== 6) return;
                  setViewPinLoading(true);
                  setViewPinError(null);
                  try {
                    const data = await generateAdminLink(viewPinModal.adminId, viewPin);
                    if (data.url) {
                      setMagicLink({ url: data.url, expiresIn: data.expires_in });
                      setViewPinModal(null);
                      setViewPin("");
                    } else {
                      setViewPinError(data.message || 'PIN incorrect');
                    }
                  } catch {
                    setViewPinError('Erreur de vérification');
                  } finally {
                    setViewPinLoading(false);
                  }
                }}
                disabled={viewPin.length !== 6 || viewPinLoading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {viewPinLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Accéder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Magic Link Modal */}
      {magicLink && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Lien généré</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ce lien est à usage unique et expire dans <strong>{magicLink.expiresIn} minutes</strong>
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 mb-2">Copiez ce lien et ouvrez-le dans un navigateur :</p>
              <p className="text-sm font-mono text-slate-800 break-all">{magicLink.url}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(magicLink.url);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copier le lien
              </button>
              <button
                onClick={() => setMagicLink(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
