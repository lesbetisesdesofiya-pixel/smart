import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";
import {
  ArrowLeft,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CalendarDays,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Layers,
  Clock,
  User,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface AdminDashboardViewProps {
  schoolId: number;
  schoolName: string;
  onBack: () => void;
}

interface SchoolInfo {
  id: number;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  ville: string | null;
  pays: string;
  devise: string;
  active: boolean;
}

interface SchoolStats {
  classes_count: number;
  eleves_count: number;
  profs_count: number;
  evaluations_count: number;
  matieres_count: number;
  affectations_count: number;
}

interface Classe {
  id: number;
  libelle: string;
  section?: string;
  ecolage?: number;
  eleves_count?: number;
}

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  date_naissance?: string | null;
  sexe?: string;
  classe_libelle?: string;
  parent_telephone?: string;
  parent_nom?: string;
  actif?: boolean;
}

interface Prof {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  matieres_count?: number;
}

interface Evaluation {
  id: number;
  libelle: string;
  type?: string;
  periode?: string;
  classe_libelle?: string;
  matiere_libelle?: string;
  date?: string;
  coeff?: number;
}

interface Matiere {
  id: number;
  libelle: string;
  categorie?: string;
}

interface Affectation {
  id: number;
  prof_nom?: string;
  matiere_libelle?: string;
  classe_libelle?: string;
  coefficient?: number;
}

type TabKey = "dashboard" | "classes" | "eleves" | "profs" | "evaluations" | "emploi";

// ─── Component ──────────────────────────────────────────────

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ schoolId, schoolName, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [affectations, setAffectations] = useState<Affectation[]>([]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        apiFetch(`/superadmin/schools/${schoolId}/dashboard`),
        apiFetch(`/superadmin/schools/${schoolId}/classes`),
        apiFetch(`/superadmin/schools/${schoolId}/eleves`),
        apiFetch(`/superadmin/schools/${schoolId}/profs`),
        apiFetch(`/superadmin/schools/${schoolId}/evaluations`),
        apiFetch(`/superadmin/schools/${schoolId}/matieres`),
        apiFetch(`/superadmin/schools/${schoolId}/affectations`),
      ]);

      const [dashRes, clsRes, eleRes, profRes, evalRes, matRes, affRes] = results;

      if (dashRes.status === "fulfilled" && dashRes.value.ok) {
        const data = await dashRes.value.json();
        setSchool(data.school ?? data);
        setStats(data.stats ?? null);
      }

      if (clsRes.status === "fulfilled" && clsRes.value.ok) {
        const data = await clsRes.value.json();
        setClasses(Array.isArray(data) ? data : data.classes ?? []);
      }

      if (eleRes.status === "fulfilled" && eleRes.value.ok) {
        const data = await eleRes.value.json();
        setEleves(Array.isArray(data) ? data : data.eleves ?? []);
      }

      if (profRes.status === "fulfilled" && profRes.value.ok) {
        const data = await profRes.value.json();
        setProfs(Array.isArray(data) ? data : data.profs ?? []);
      }

      if (evalRes.status === "fulfilled" && evalRes.value.ok) {
        const data = await evalRes.value.json();
        setEvaluations(Array.isArray(data) ? data : data.evaluations ?? []);
      }

      if (matRes.status === "fulfilled" && matRes.value.ok) {
        const data = await matRes.value.json();
        setMatieres(Array.isArray(data) ? data : data.matieres ?? []);
      }

      if (affRes.status === "fulfilled" && affRes.value.ok) {
        const data = await affRes.value.json();
        setAffectations(Array.isArray(data) ? data : data.affectations ?? []);
      }
    } catch {
      setError("Erreur lors du chargement des données");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [schoolId]);

  // ─── Tabs config ───────────────────────────────────────────

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <Building2 className="w-4 h-4" /> },
    { key: "classes", label: "Classes", icon: <Layers className="w-4 h-4" /> },
    { key: "eleves", label: "Élèves", icon: <GraduationCap className="w-4 h-4" /> },
    { key: "profs", label: "Profs", icon: <Users className="w-4 h-4" /> },
    { key: "evaluations", label: "Évaluations", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "emploi", label: "Emploi du temps", icon: <CalendarDays className="w-4 h-4" /> },
  ];

  // ─── Stat cards ────────────────────────────────────────────

  const statCards = [
    { label: "Classes", value: stats?.classes_count ?? classes.length, icon: <Layers className="w-5 h-5" />, color: "from-blue-500 to-indigo-600" },
    { label: "Élèves", value: stats?.eleves_count ?? eleves.length, icon: <GraduationCap className="w-5 h-5" />, color: "from-emerald-500 to-teal-600" },
    { label: "Profs", value: stats?.profs_count ?? profs.length, icon: <Users className="w-5 h-5" />, color: "from-amber-500 to-orange-600" },
    { label: "Évaluations", value: stats?.evaluations_count ?? evaluations.length, icon: <ClipboardList className="w-5 h-5" />, color: "from-purple-500 to-pink-600" },
  ];

  // ─── Loading / Error ───────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-semibold">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{school?.nom ?? schoolName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
              {school?.ville && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {school.ville}{school.pays ? `, ${school.pays}` : ""}</span>
              )}
              {school?.telephone && (
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {school.telephone}</span>
              )}
              {school?.email && (
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {school.email}</span>
              )}
              {school?.active !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${school.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {school.active ? "Actif" : "Inactif"}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={loadAll}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" && (
        <DashboardTab stats={statCards} classes={classes} eleves={eleves} profs={profs} evaluations={evaluations} matieres={matieres} affectations={affectations} />
      )}
      {activeTab === "classes" && <ClassesTab classes={classes} />}
      {activeTab === "eleves" && <ElevesTab eleves={eleves} />}
      {activeTab === "profs" && <ProfsTab profs={profs} />}
      {activeTab === "evaluations" && <EvaluationsTab evaluations={evaluations} />}
      {activeTab === "emploi" && <EmploiTab schoolId={schoolId} />}
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────

interface StatCardData {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const DashboardTab: React.FC<{
  stats: StatCardData[];
  classes: Classe[];
  eleves: Eleve[];
  profs: Prof[];
  evaluations: Evaluation[];
  matieres: Matiere[];
  affectations: Affectation[];
}> = ({ stats, classes, eleves, profs, evaluations, matieres, affectations }) => (
  <div className="space-y-6">
    {/* Stat cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-sm`}>
              {s.icon}
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{s.value}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>

    {/* Quick lists */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Matières */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" /> Matières ({matieres.length})
        </h3>
        {matieres.length === 0 ? (
          <p className="text-xs text-slate-400">Aucune matière</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {matieres.slice(0, 12).map((m) => (
              <span key={m.id} className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                {m.libelle}
              </span>
            ))}
            {matieres.length > 12 && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-semibold text-blue-700">+{matieres.length - 12}</span>
            )}
          </div>
        )}
      </div>

      {/* Affectations récentes */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-400" /> Affectations ({affectations.length})
        </h3>
        {affectations.length === 0 ? (
          <p className="text-xs text-slate-400">Aucune affectation</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {affectations.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                <span className="font-semibold text-slate-700">{a.prof_nom}</span>
                <span className="text-slate-500">{a.matiere_libelle} — {a.classe_libelle}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const ClassesTab: React.FC<{ classes: Classe[] }> = ({ classes }) => {
  const [search, setSearch] = useState("");
  const filtered = classes.filter((c) => c.libelle.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher une classe..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">Aucune classe</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {c.libelle.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{c.libelle}</h3>
                  {c.section && <p className="text-[11px] text-slate-500">{c.section}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                <span>{c.eleves_count ?? "—"} élèves</span>
                {c.ecolage != null && <span className="font-semibold text-slate-700">{c.ecolage.toLocaleString()} F</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ElevesTab: React.FC<{ eleves: Eleve[] }> = ({ eleves }) => {
  const [search, setSearch] = useState("");
  const filtered = eleves.filter(
    (e) =>
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.prenom.toLowerCase().includes(search.toLowerCase()) ||
      (e.classe_libelle || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher un élève..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">Aucun élève</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Nom</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Prénom</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Classe</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Naissance</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Parent</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{e.nom}</td>
                    <td className="px-4 py-3 text-slate-700">{e.prenom}</td>
                    <td className="px-4 py-3">
                      {e.classe_libelle && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold">{e.classe_libelle}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{e.date_naissance || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{e.parent_nom || e.parent_telephone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.actif !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {e.actif !== false ? "Actif" : "Inactif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
            {filtered.length} élève(s)
          </div>
        </div>
      )}
    </div>
  );
};

const ProfsTab: React.FC<{ profs: Prof[] }> = ({ profs }) => {
  const [search, setSearch] = useState("");
  const filtered = profs.filter(
    (p) =>
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.prenom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher un professeur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">Aucun professeur</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {p.prenom.charAt(0)}{p.nom.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{p.prenom} {p.nom}</h3>
                  {p.email && <p className="text-[11px] text-slate-500">{p.email}</p>}
                </div>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-500">
                {p.telephone && (
                  <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {p.telephone}</div>
                )}
                {p.matieres_count != null && (
                  <div className="flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> {p.matieres_count} matière(s)</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EvaluationsTab: React.FC<{ evaluations: Evaluation[] }> = ({ evaluations }) => {
  const [search, setSearch] = useState("");
  const filtered = evaluations.filter(
    (ev) =>
      ev.libelle.toLowerCase().includes(search.toLowerCase()) ||
      (ev.classe_libelle || "").toLowerCase().includes(search.toLowerCase()) ||
      (ev.matiere_libelle || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher une évaluation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">Aucune évaluation</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Libellé</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Type</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Classe</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Matière</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Période</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => (
                  <tr key={ev.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{ev.libelle}</td>
                    <td className="px-4 py-3">
                      {ev.type && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-[11px] font-semibold">{ev.type}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{ev.classe_libelle || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{ev.matiere_libelle || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{ev.periode || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{ev.date || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
            {filtered.length} évaluation(s)
          </div>
        </div>
      )}
    </div>
  );
};

const EmploiTab: React.FC<{ schoolId: number }> = ({ schoolId }) => {
  const [loading, setLoading] = useState(true);
  const [emploi, setEmploi] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/superadmin/schools/${schoolId}/emploi-du-temps`);
        if (res.ok) {
          const data = await res.json();
          setEmploi(Array.isArray(data) ? data : data.emploi_du_temps ?? data.creneaux ?? []);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [schoolId]);

  const jours = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const grouped: Record<string, any[]> = {};
  jours.forEach((j) => { grouped[j] = []; });
  emploi.forEach((c) => {
    const jour = (c.jour || "").toLowerCase();
    if (grouped[jour]) grouped[jour].push(c);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (emploi.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-500">Aucun emploi du temps configuré</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {jours.map((jour) => (
        <div key={jour} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> {jour}
            </h3>
          </div>
          <div className="p-3 space-y-2">
            {grouped[jour].length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">—</p>
            ) : (
              grouped[jour]
                .sort((a, b) => (a.heure_debut || "").localeCompare(b.heure_debut || ""))
                .map((c, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{c.matiere_libelle || c.matiere || "—"}</span>
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {c.heure_debut} — {c.heure_fin}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      {c.classe_libelle || c.classe ? (
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {c.classe_libelle || c.classe}</span>
                      ) : null}
                      {c.prof_nom || c.prof ? (
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {c.prof_nom || c.prof}</span>
                      ) : null}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
