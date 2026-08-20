import React, { useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Phone,
  Mail,
  Trash2,
  Eye,
  X,
  Lock,
  Unlock,
  Loader2,
  Shield,
  Copy,
  KeyRound,
  CheckCircle,
} from "lucide-react";
import { Teacher } from "../types";
import { apiFetch } from "../api";

interface TeachersManagerProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}

export const TeachersManager: React.FC<TeachersManagerProps> = ({ teachers, setTeachers }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccess, setSelectedAccess] = useState("all");
  const [activeTeacherModal, setActiveTeacherModal] = useState<Teacher | null>(null);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [resettingPinId, setResettingPinId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      `${t.firstName} ${t.lastName} ${t.mainSubject} ${t.phone}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesAccess =
      selectedAccess === "all" ||
      (selectedAccess === "active" && !(t as any).active) ||
      (selectedAccess === "blocked" && (t as any).active);
    return matchesSearch && matchesAccess;
  });

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    try {
      const res = await apiFetch('/school-admin/profs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: formData.lastName,
          prenom: formData.firstName,
          email: formData.email || undefined,
          telephone: formData.phone || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        const newTeacher: Teacher = {
          id: String(data.id),
          matricule: `PRF-${data.id}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          photo: '',
          mainSubject: 'Enseignant',
          secondarySubjects: [],
          assignedClassIds: [],
          assignedClassNames: [],
          phone: formData.phone || '',
          email: formData.email || '',
          status: "actif",
          weeklyHours: 0,
          maxWeeklyHours: 0,
          diploma: '',
          hireDate: new Date().toISOString().split("T")[0],
          code: data.code,
          magic_token: data.magic_token,
        } as any;
        (newTeacher as any).active = true;
        setTeachers([newTeacher, ...teachers]);
        setIsAddingTeacher(false);
        setFormData({ firstName: "", lastName: "", phone: "", email: "" });
      } else {
        alert(data.message || "Erreur lors de la création");
      }
    } catch {
      alert("Erreur réseau");
    }
  };

  const handleToggleAccess = async (teacher: Teacher) => {
    const isActive = (teacher as any).active;
    const action = isActive ? "bloquer" : "débloquer";
    if (!confirm(`Voulez-vous ${action} ${teacher.firstName} ${teacher.lastName} ?`)) return;

    setIsToggling(true);
    try {
      const numericId = parseInt(teacher.id, 10);
      const res = await apiFetch(`/school-admin/profs/${numericId}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTeachers((prev: any[]) =>
          prev.map((t) =>
            t.id === teacher.id ? { ...t, active: !isActive } : t
          )
        );
      } else {
        alert(data.message || "Erreur");
      }
    } catch {
      alert("Erreur lors du blocage");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce professeur ?")) {
      setTeachers(teachers.filter((t) => t.id !== id));
    }
  };

  const handleResetPin = async (teacher: Teacher) => {
    if (!confirm(`Réinitialiser le PIN de "${teacher.firstName} ${teacher.lastName}" ?`)) return;
    setResettingPinId(teacher.id);
    try {
      const numericId = parseInt(teacher.id, 10);
      const res = await apiFetch(`/school-admin/profs/${numericId}/reset-pin`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`PIN de ${teacher.firstName} ${teacher.lastName} réinitialisé.\nNouveau PIN : ${data.temporary_pin}\n\nCommuniquez-le au professeur de manière sécurisée.`);
      } else {
        alert(data.message || "Erreur");
      }
    } catch {
      alert("Erreur lors de la réinitialisation du PIN");
    } finally {
      setResettingPinId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span>Gestion des Professeurs</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Répertoire du corps enseignant, affectations et gestion d'accès
          </p>
        </div>
        <button
          id="btn-add-teacher"
          onClick={() => setIsAddingTeacher(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Professeur</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-teacher"
            type="text"
            placeholder="Rechercher par nom, prénom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          id="select-access-filter"
          value={selectedAccess}
          onChange={(e) => setSelectedAccess(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Tous les accès</option>
          <option value="active">Autorisé</option>
          <option value="blocked">Bloqué</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Professeur</th>
                  <th className="px-5 py-3.5">Code d'accès</th>
                  <th className="px-5 py-3.5">Classes Assignées</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Accès</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTeachers.map((t) => {
                const isActive = (t as any).active !== false;
                return (
                  <tr key={t.id} className={`transition-colors ${!isActive ? 'bg-rose-50/50' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold border ${
                          !isActive ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
                          {t.firstName[0]}{t.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{t.firstName} {t.lastName}</p>
                          <p className="text-[11px] text-slate-400">{t.matricule}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {(t as any).code ? (
                        <button
                          onClick={() => navigator.clipboard.writeText((t as any).code)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer group"
                          title="Copier le code"
                        >
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          <span className="font-mono text-xs font-bold text-amber-800 tracking-wider">{(t as any).code}</span>
                          <Copy className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (t as any).code_used ? (
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Activé
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">Non généré</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {t.assignedClassNames.length > 0 ? (
                          t.assignedClassNames.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Aucune affectation</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 space-y-0.5">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{t.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[140px]">{t.email}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {isActive ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1 w-fit">
                          <Unlock className="w-3 h-3" /> Autorisé
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200 flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3" /> Bloqué
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setActiveTeacherModal(t)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Voir la fiche"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPin(t)}
                          disabled={resettingPinId === t.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50"
                          title="Réinitialiser le PIN"
                        >
                          {resettingPinId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleToggleAccess(t)}
                          disabled={isToggling}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                            !isActive
                              ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                          title={!isActive ? "Débloquer" : "Bloquer"}
                        >
                          {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : (!isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />)}
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(t.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredTeachers.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            Aucun professeur trouvé.
          </div>
        )}
      </div>

      {activeTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center">
                  {activeTeacherModal.firstName[0]}{activeTeacherModal.lastName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {activeTeacherModal.firstName} {activeTeacherModal.lastName}
                  </h3>
                  <p className="text-xs font-medium text-blue-600">{activeTeacherModal.mainSubject}</p>
                  <p className="text-[11px] text-slate-400">{activeTeacherModal.matricule}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTeacherModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 block">Classes actuellement enseignées:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeTeacherModal.assignedClassNames.length > 0 ? (
                    activeTeacherModal.assignedClassNames.map((c) => (
                      <span key={c} className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Aucune affectation</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Téléphone :</span>
                  <strong className="text-slate-900">{activeTeacherModal.phone}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Email professionnel :</span>
                  <strong className="text-slate-900">{activeTeacherModal.email}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Date d'embauche :</span>
                  <strong className="text-slate-900">{activeTeacherModal.hireDate}</strong>
                </div>
              </div>

              {(activeTeacherModal as any).magic_token && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="font-bold text-slate-800 block">Lien magique d'activation :</span>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`${window.location.origin}/smart/public/app/prof/activate/${(activeTeacherModal as any).magic_token}`}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600 truncate"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/smart/public/app/prof/activate/${(activeTeacherModal as any).magic_token}`);
                      }}
                      className="px-3 py-2 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Copier
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">Ce lien permet à l'enseignant d'activer son compte et de définir son PIN.</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveTeacherModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Nouveau Professeur</h3>
              <button onClick={() => setIsAddingTeacher(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Prénom</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Ex: Ibrahim"
                  className="w-full px-3 py-2 border rounded-xl focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom de famille</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Ex: Touré"
                  className="w-full px-3 py-2 border rounded-xl focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Téléphone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+225 07..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="prof@ecole.com"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTeacher(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Enregistrer Professeur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
