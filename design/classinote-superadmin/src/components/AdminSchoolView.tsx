import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Calendar,
  BarChart3,
  Loader2,
} from "lucide-react";
import { apiFetch } from "../api";

interface AdminSchoolViewProps {
  schoolId: number;
  schoolName: string;
  onBack: () => void;
}

interface DashboardData {
  school: { id: number; nom: string; adresse: string; telephone: string; email: string };
  stats: { nb_classes: number; nb_eleves: number; nb_profs: number; nb_evaluations: number };
}

interface Classe { id: number; libelle: string; section?: { libelle: string }; eleves_count?: number; }
interface Eleve { id: number; nom: string; prenom: string; classe?: { libelle: string }; active: boolean; }
interface Prof { id: number; nom: string; prenom: string; affectations?: any[]; }
interface Evaluation { id: number; titre: string; type: string; date: string; coefficient: number; note_sur: number; matiere?: string; }

type Tab = "dashboard" | "classes" | "eleves" | "profs" | "evaluations";

export const AdminSchoolView: React.FC<AdminSchoolViewProps> = ({ schoolId, schoolName, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [resDash, resClasses, resEleves, resProfs, resEvals] = await Promise.all([
          apiFetch(`/superadmin/schools/${schoolId}/dashboard`).catch(() => null),
          apiFetch(`/superadmin/schools/${schoolId}/classes`).catch(() => null),
          apiFetch(`/superadmin/schools/${schoolId}/eleves`).catch(() => null),
          apiFetch(`/superadmin/schools/${schoolId}/profs`).catch(() => null),
          apiFetch(`/superadmin/schools/${schoolId}/evaluations`).catch(() => null),
        ]);

        if (resDash?.ok) setDashboard(await resDash.json());
        if (resClasses?.ok) { const d = await resClasses.json(); setClasses(d.classes || d || []); }
        if (resEleves?.ok) setEleves(await resEleves.json());
        if (resProfs?.ok) { const d = await resProfs.json(); setProfs(d.profs || d || []); }
        if (resEvals?.ok) { const d = await resEvals.json(); setEvaluations(d.evaluations || d || []); }
      } catch {}
      setLoading(false);
    };
    loadData();
  }, [schoolId]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "classes", label: "Classes", icon: <BookOpen className="w-4 h-4" /> },
    { key: "eleves", label: "Élèves", icon: <Users className="w-4 h-4" /> },
    { key: "profs", label: "Profs", icon: <GraduationCap className="w-4 h-4" /> },
    { key: "evaluations", label: "Évaluations", icon: <ClipboardList className="w-4 h-4" /> },
  ];

  const filteredClasses = classes.filter(c => c.libelle.toLowerCase().includes(search.toLowerCase()));
  const filteredEleves = eleves.filter(e => `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase()));
  const filteredProfs = profs.filter(p => `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase()));
  const filteredEvals = evaluations.filter(e => e.titre.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">{schoolName}</h1>
          <p className="text-sm text-slate-500">Vue administration complète</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "bg-amber-600 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== "dashboard" && (
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full px-4 py-2.5 pl-10 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-lg">search</span>
        </div>
      )}

      {/* Dashboard */}
      {activeTab === "dashboard" && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Classes", value: dashboard.stats.nb_classes, icon: <BookOpen className="w-6 h-6" />, color: "bg-blue-100 text-blue-600" },
              { label: "Élèves", value: dashboard.stats.nb_eleves, icon: <Users className="w-6 h-6" />, color: "bg-emerald-100 text-emerald-600" },
              { label: "Profs", value: dashboard.stats.nb_profs, icon: <GraduationCap className="w-6 h-6" />, color: "bg-purple-100 text-purple-600" },
              { label: "Évaluations", value: dashboard.stats.nb_evaluations, icon: <ClipboardList className="w-6 h-6" />, color: "bg-amber-100 text-amber-600" },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>{stat.icon}</div>
                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-3">Informations</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Adresse :</span> <span className="font-medium">{dashboard.school.adresse || '—'}</span></div>
              <div><span className="text-slate-500">Téléphone :</span> <span className="font-medium">{dashboard.school.telephone || '—'}</span></div>
              <div><span className="text-slate-500">Email :</span> <span className="font-medium">{dashboard.school.email || '—'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Classes */}
      {activeTab === "classes" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr><th className="px-5 py-3 text-left">Classe</th><th className="px-5 py-3 text-left">Section</th><th className="px-5 py-3 text-right">Élèves</th></tr>
            </thead>
            <tbody>
              {filteredClasses.map(c => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-bold">{c.libelle}</td>
                  <td className="px-5 py-3 text-slate-500">{c.section?.libelle || '—'}</td>
                  <td className="px-5 py-3 text-right font-medium">{c.eleves_count || 0}</td>
                </tr>
              ))}
              {filteredClasses.length === 0 && <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">Aucune classe</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Élèves */}
      {activeTab === "eleves" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr><th className="px-5 py-3 text-left">Nom</th><th className="px-5 py-3 text-left">Classe</th><th className="px-5 py-3 text-right">Statut</th></tr>
            </thead>
            <tbody>
              {filteredEleves.map(e => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-bold">{e.prenom} {e.nom}</td>
                  <td className="px-5 py-3 text-slate-500">{e.classe?.libelle || '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${e.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {e.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredEleves.length === 0 && <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">Aucun élève</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Profs */}
      {activeTab === "profs" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr><th className="px-5 py-3 text-left">Nom</th><th className="px-5 py-3 text-left">Matières</th></tr>
            </thead>
            <tbody>
              {filteredProfs.map(p => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-bold">{p.prenom} {p.nom}</td>
                  <td className="px-5 py-3 text-slate-500">{p.affectations?.map((a: any) => a.matiere?.libelle).filter(Boolean).join(', ') || '—'}</td>
                </tr>
              ))}
              {filteredProfs.length === 0 && <tr><td colSpan={2} className="px-5 py-8 text-center text-slate-400">Aucun professeur</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Évaluations */}
      {activeTab === "evaluations" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr><th className="px-5 py-3 text-left">Titre</th><th className="px-5 py-3 text-left">Matière</th><th className="px-5 py-3 text-left">Date</th><th className="px-5 py-3 text-right">Coeff</th></tr>
            </thead>
            <tbody>
              {filteredEvals.map(e => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-bold">{e.titre}</td>
                  <td className="px-5 py-3 text-slate-500">{e.matiere || '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{e.date || '—'}</td>
                  <td className="px-5 py-3 text-right font-medium">{e.coefficient}</td>
                </tr>
              ))}
              {filteredEvals.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Aucune évaluation</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
