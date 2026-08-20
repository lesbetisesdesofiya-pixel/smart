import React, { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Trash2,
  Edit3,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  KeyRound,
  User,
  RefreshCw,
  FileJson,
  Brain,
  Shield,
  Copy,
  Eye,
} from "lucide-react";
import { apiFetch, generateAdminLink } from "../api";
import { ImportPreview } from "./ImportPreview";

interface SchoolData {
  id: number;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  ville: string | null;
  pays: string;
  devise: string;
  active: boolean;
  ai_notes_enabled?: boolean;
  admins?: { id: number; name: string; email: string; role: string; active: boolean }[];
  eleves_count?: number;
  profs_count?: number;
  classes_count?: number;
}

interface SchoolsManagerProps {
  onViewSchool?: (schoolId: number, schoolName: string) => void;
}

export const SchoolsManager: React.FC<SchoolsManagerProps> = ({ onViewSchool }) => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState("");
  const [importSchoolId, setImportSchoolId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // PIN verification for viewing school
  const [viewPinModal, setViewPinModal] = useState<{ schoolId: number; schoolName: string; adminId: number } | null>(null);
  const [viewPin, setViewPin] = useState("");
  const [viewPinError, setViewPinError] = useState<string | null>(null);
  const [viewPinLoading, setViewPinLoading] = useState(false);
  const [magicLink, setMagicLink] = useState<{ url: string; expiresIn: number } | null>(null);
  const [resettingAdminId, setResettingAdminId] = useState<number | null>(null);
  const [parsedImportData, setParsedImportData] = useState<Record<string, any[]> | null>(null);
  const [importSchoolName, setImportSchoolName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [resettingAdminPinId, setResettingAdminPinId] = useState<number | null>(null);
  const [togglingAiNotesId, setTogglingAiNotesId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nom: "",
    adresse: "",
    telephone: "",
    email: "",
    ville: "",
    pays: "Togo",
    devise: "FCFA",
    admin_email: "",
  });

  const loadSchools = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/superadmin/schools");
      if (res.ok) {
        const data = await res.json();
        setSchools(Array.isArray(data) ? data : data.ecoles || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const filtered = schools.filter(
    (s) =>
      s.nom.toLowerCase().includes(search.toLowerCase()) ||
      (s.ville || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.admin_email.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const url = editingSchool
        ? `/superadmin/schools/${editingSchool.id}`
        : "/superadmin/schools";
      const method = editingSchool ? "PUT" : "POST";
      const body = editingSchool
        ? { nom: form.nom, adresse: form.adresse, telephone: form.telephone, email: form.email, ville: form.ville, pays: form.pays, devise: form.devise }
        : form;
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        const adminInfo = data.admin ? `\nAdmin: ${data.admin.email}\nMDP: ${data.admin.temp_password}` : "";
        setMsg({
          type: "success",
          text: editingSchool ? "École modifiée" : `École créée${adminInfo}`,
        });
        setShowForm(false);
        setEditingSchool(null);
        resetForm();
        loadSchools();
      } else {
        setMsg({ type: "error", text: data.message || "Erreur" });
      }
    } catch {
      setMsg({ type: "error", text: "Erreur réseau" });
    }
    setSaving(false);
  };

  const handleEdit = (school: SchoolData) => {
    setEditingSchool(school);
    setForm({
      nom: school.nom,
      adresse: school.adresse || "",
      telephone: school.telephone || "",
      email: school.email || "",
      ville: school.ville || "",
      pays: school.pays,
      devise: school.devise,
      admin_email: "",
    });
    setShowForm(true);
  };

  const handleDelete = async (school: SchoolData) => {
    if (!confirm(`Supprimer "${school.nom}" ? Cette action est irréversible.`)) return;
    setDeleting(school.id);
    try {
      const res = await apiFetch(`/superadmin/schools/${school.id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg({ type: "success", text: "École supprimée" });
        loadSchools();
      } else {
        const data = await res.json();
        setMsg({ type: "error", text: data.message || "Erreur" });
      }
    } catch {
      setMsg({ type: "error", text: "Erreur réseau" });
    }
    setDeleting(null);
  };

  const handleResetAdminPassword = async (adminId: number, adminName: string) => {
    if (!confirm(`Réinitialiser le mot de passe de "${adminName}" ?\nNouveau mot de passe: password`)) return;
    setResettingAdminId(adminId);
    setMsg(null);
    try {
      const res = await apiFetch(`/superadmin/admins/${adminId}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: `MDP de "${adminName}" réinitialisé à "password"` });
        loadSchools();
      } else {
        setMsg({ type: "error", text: data.message || "Erreur" });
      }
    } catch {
      setMsg({ type: "error", text: "Erreur réseau" });
    }
    setResettingAdminId(null);
  };

  const handleAnalyzeImport = () => {
    if (!importData.trim()) return;
    setParseError(null);
    try {
      const parsed = JSON.parse(importData);
      setParsedImportData(parsed);
    } catch {
      setParseError("JSON invalide — vérifiez la syntaxe");
    }
  };

  const handleImportFromPreview = async (result: any) => {
    setMsg({ type: "success", text: `Import réussi!\n${Object.entries(result.report || {}).map(([k, v]: [string, any]) => `${ENTITY_LABELS[k] || k}: ${typeof v === 'object' ? v.created || 0 : v}`).join("\n")}` });
    setShowImport(false);
    setImportData("");
    setImportSchoolId(null);
    setParsedImportData(null);
    setParseError(null);
  };

  const resetForm = () => {
    setForm({ nom: "", adresse: "", telephone: "", email: "", ville: "", pays: "Togo", devise: "FCFA", admin_email: "" });
  };

  const handleResetAdminPin = async (adminId: number, adminName: string) => {
    if (!confirm(`Réinitialiser le PIN de "${adminName}" ?\nSon PIN sera supprimé, il devra utiliser email + mot de passe.`)) return;
    setResettingAdminPinId(adminId);
    setMsg(null);
    try {
      const res = await apiFetch(`/superadmin/admins/${adminId}/reset-pin`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: `PIN de "${adminName}" réinitialisé` });
      } else {
        setMsg({ type: "error", text: data.message || "Erreur" });
      }
    } catch {
      setMsg({ type: "error", text: "Erreur réseau" });
    }
    setResettingAdminPinId(null);
  };

  const handleToggleAiNotes = async (school: SchoolData) => {
    setTogglingAiNotesId(school.id);
    setMsg(null);
    try {
      const res = await apiFetch(`/superadmin/schools/${school.id}/toggle-ai-notes`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSchools(prev => prev.map(s => s.id === school.id ? { ...s, ai_notes_enabled: data.ai_notes_enabled } : s));
        setMsg({ type: "success", text: `Notes IA ${data.ai_notes_enabled ? 'activées' : 'désactivées'} pour "${school.nom}"` });
      } else {
        setMsg({ type: "error", text: data.message || "Erreur" });
      }
    } catch {
      setMsg({ type: "error", text: "Erreur réseau" });
    }
    setTogglingAiNotesId(null);
  };

  const ENTITY_LABELS: Record<string, string> = {
    sections: "Sections",
    classes: "Classes",
    matieres: "Matières",
    profs: "Professeurs",
    eleves: "Élèves",
    affectations: "Affectations",
    periodes: "Périodes",
    emploi_du_temps: "Emploi du Temps",
    evaluations: "Évaluations",
    notes: "Notes",
    frais: "Frais",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gestion des Écoles</h1>
          <p className="text-sm text-slate-500 mt-1">{schools.length} école(s) enregistrée(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowImport(true); setMsg(null); }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Importer</span>
          </button>
          <button
            onClick={() => { resetForm(); setEditingSchool(null); setShowForm(true); setMsg(null); }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle École</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className={`flex items-start gap-2 p-3 rounded-xl text-xs font-semibold whitespace-pre-line ${msg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.type === "success" ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span className="flex-1">{msg.text}</span>
          <button onClick={() => setMsg(null)} className="shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher une école..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      {/* Schools Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Aucune école trouvée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((school) => {
            const admin = school.admins?.[0];
            return (
              <div key={school.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {school.nom.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{school.nom}</h3>
                      {school.ville && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {school.ville}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${school.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {school.active ? "Actif" : "Inactif"}
                    </span>
                    <button
                      onClick={() => handleToggleAiNotes(school)}
                      disabled={togglingAiNotesId === school.id}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50 ${
                        school.ai_notes_enabled
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                      title={school.ai_notes_enabled ? "Notes IA activées - cliquer pour désactiver" : "Notes IA désactivées - cliquer pour activer"}
                    >
                      {togglingAiNotesId === school.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Brain className="w-3 h-3" />
                      )}
                      Notes IA
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4 text-[11px] text-slate-500">
                  {school.telephone && (
                    <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {school.telephone}</div>
                  )}
                  {school.email && (
                    <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {school.email}</div>
                  )}
                </div>

                {/* Admin info */}
                {admin && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">{admin.name}</p>
                          <p className="text-[11px] text-slate-500">{admin.email}</p>
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${admin.role === "superadmin" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                        {admin.role === "superadmin" ? "SUPER" : "ADMIN"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResetAdminPassword(admin.id, admin.name)}
                        disabled={resettingAdminId === admin.id}
                        className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {resettingAdminId === admin.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <KeyRound className="w-3 h-3" />
                        )}
                        Reset MDP
                      </button>
                      <button
                        onClick={() => handleResetAdminPin(admin.id, admin.name)}
                        disabled={resettingAdminPinId === admin.id}
                        className="px-2 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {resettingAdminPinId === admin.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Shield className="w-3 h-3" />
                        )}
                        Reset PIN
                      </button>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {onViewSchool && school.admins && school.admins.length > 0 && (
                    <button
                      onClick={() => {
                        setViewPinModal({ schoolId: school.id, schoolName: school.nom, adminId: school.admins![0].id });
                        setViewPin("");
                        setViewPinError(null);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Voir
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(school)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button
                    onClick={() => { setImportSchoolId(school.id); setShowImport(true); }}
                    className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(school)}
                    disabled={deleting === school.id}
                    className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[11px] flex items-center justify-center disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {deleting === school.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingSchool ? "Modifier l'école" : "Nouvelle École"}
              </h2>
              {!editingSchool && (
                <p className="text-xs text-slate-500 mt-1">Un compte admin sera créé avec l'email ci-dessous. Mot de passe par défaut: <span className="font-mono font-bold text-slate-700">classinote2026</span></p>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nom de l'école *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: École La Réussite"
                  autoFocus
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {!editingSchool && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email de l'administrateur *</label>
                  <input
                    type="email"
                    value={form.admin_email}
                    onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                    placeholder="admin@ecole.com"
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ville</label>
                  <input
                    type="text"
                    value={form.ville}
                    onChange={(e) => setForm({ ...form, ville: e.target.value })}
                    placeholder="Abidjan"
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Pays</label>
                  <input
                    type="text"
                    value={form.pays}
                    onChange={(e) => setForm({ ...form, pays: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Adresse</label>
                <input
                  type="text"
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  placeholder="Quartier, rue..."
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Téléphone école</label>
                  <input
                    type="text"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    placeholder="+225 XX XX XX XX XX"
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email école</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@ecole.com"
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving || !form.nom.trim() || (!editingSchool && !form.admin_email.trim())}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {editingSchool ? "Enregistrer" : "Créer l'école"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingSchool(null); }}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Step 1: Paste JSON */}
      {showImport && !parsedImportData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Importer des Données</h2>
              <p className="text-xs text-slate-500 mt-1">
                Collez le JSON puis cliquez "Analyser" pour prévisualiser avant d'importer.
              </p>
            </div>
            <div className="p-6 space-y-4">
              {!importSchoolId && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">École cible</label>
                  <select
                    value={importSchoolId || ""}
                    onChange={(e) => setImportSchoolId(Number(e.target.value))}
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Sélectionner une école</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.nom}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-600">Données JSON</label>
                  <button
                    type="button"
                    onClick={() => {
                      const example = JSON.stringify({
                        "sections": [{"libelle": "Secondaire"}],
                        "classes": [{"section": "Secondaire", "libelle": "6ème A", "ecolage": 25000}, {"section": "Secondaire", "libelle": "5ème B", "ecolage": 30000}],
                        "matieres": [{"libelle": "Mathématiques", "categorie": "Scientifique"}, {"libelle": "Français", "categorie": "Littéraire"}],
                        "profs": [{"nom": "Dupont", "prenom": "Jean", "email": "dupont@ecole.com", "telephone": "+22501020304"}],
                        "eleves": [{"nom": "Kouassi", "prenom": "Jean", "classe": "6ème A", "date_naissance": "2012-05-15", "parent_telephone": "+22507080910"}],
                        "affectations": [{"prof": "Dupont Jean", "matiere": "Mathématiques", "classe": "6ème A", "coefficient": 3}],
                        "periodes": [{"libelle": "1er Trimestre", "type": "trimestre", "numero": 1}, {"libelle": "2ème Trimestre", "type": "trimestre", "numero": 2}],
                        "emploi_du_temps": [{"classe": "6ème A", "matiere": "Mathématiques", "prof": "Dupont Jean", "jour": "lundi", "heure_debut": "8h00", "heure_fin": "10h00"}],
                        "frais": [{"libelle": "Frais de scolarité", "montant": 50000, "classes": ["6ème A", "5ème B"]}]
                      }, null, 2);
                      navigator.clipboard.writeText(example);
                    }}
                    className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copier l'exemple
                  </button>
                </div>
                <textarea
                  value={importData}
                  onChange={(e) => { setImportData(e.target.value); setParseError(null); }}
                  placeholder={`{\n  "sections": [{"libelle": "Secondaire"}],\n  "classes": [{"section": "Secondaire", "libelle": "6ème A", "ecolage": 25000}],\n  "matieres": [{"libelle": "Mathématiques"}],\n  "profs": [{"nom": "Dupont", "prenom": "Jean"}],\n  "eleves": [{"nom": "Kouassi", "prenom": "Jean", "classe": "6ème A"}],\n  "affectations": [{"prof": "Dupont Jean", "matiere": "Mathématiques", "classe": "6ème A", "coefficient": 3}],\n  "emploi_du_temps": [{"classe": "6ème A", "jour": "lundi", "heure_debut": "8h00", "heure_fin": "10h00"}]\n}`}
                  rows={12}
                  className="w-full px-4 py-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>
              {parseError && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {parseError}
                </p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAnalyzeImport}
                  disabled={!importData.trim() || !importSchoolId}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileJson className="w-4 h-4" />
                  Analyser
                </button>
                <button
                  onClick={() => { setShowImport(false); setImportData(""); setImportSchoolId(null); setParseError(null); }}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Step 2: Preview editable tables */}
      {showImport && parsedImportData && importSchoolId && (
        <ImportPreview
          data={parsedImportData}
          schoolId={importSchoolId}
          schoolName={schools.find((s) => s.id === importSchoolId)?.nom || ""}
          onImported={handleImportFromPreview}
          onClose={() => { setParsedImportData(null); setParseError(null); }}
        />
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
