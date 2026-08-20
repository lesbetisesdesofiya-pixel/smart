import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  X,
  CreditCard,
  Layers,
  School,
  AlertCircle,
  Shield
} from "lucide-react";
import { apiFetch } from "../api";
import { SchoolSettings, SchoolClass, TuitionScheduleDefinition, TuitionTranche } from "../types";
import { SecurityTab } from "./SecurityTab";

interface SettingsManagerProps {
  settings: SchoolSettings;
  setSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
  classes: SchoolClass[];
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  settings,
  setSettings,
  classes
}) => {
  const [formData, setFormData] = useState<SchoolSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Active Tab: "general", "schedules", "periodes", or "security"
  const [activeTab, setActiveTab] = useState<"general" | "schedules" | "periodes" | "security">("schedules");

  // Périodes state
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [periodeType, setPeriodeType] = useState<"trimestre" | "semestre">("trimestre");
  const [periodeError, setPeriodeError] = useState("");
  const [periodeSuccess, setPeriodeSuccess] = useState("");

  // State for Tuition Schedule Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TuitionScheduleDefinition | null>(null);

  // Schedule Modal Form State
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [tranches, setTranches] = useState<TuitionTranche[]>([]);

  // Save Settings
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSettings(formData);
    localStorage.setItem("smarty_settings", JSON.stringify(formData));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Open Modal for New Schedule Definition
  const handleOpenNewModal = () => {
    setEditingSchedule(null);
    setScheduleTitle("");
    setSelectedClassIds(classes.map((c) => c.id)); // Default to all classes
    setTranches([
      {
        id: `TR-${Date.now()}-1`,
        name: "1ère Tranche (Inscription & Rentrée)",
        amountFCFA: 100000,
        dueDate: "2024-09-15"
      },
      {
        id: `TR-${Date.now()}-2`,
        name: "2ème Tranche (Mi-Trimestre 1)",
        amountFCFA: 80000,
        dueDate: "2024-12-05"
      },
      {
        id: `TR-${Date.now()}-3`,
        name: "3ème Tranche (Solde Début Trimestre 2)",
        amountFCFA: 70000,
        dueDate: "2025-02-15"
      }
    ]);
    setIsModalOpen(true);
  };

  // Open Modal for Editing an Existing Schedule
  const handleOpenEditModal = (schedule: TuitionScheduleDefinition) => {
    setEditingSchedule(schedule);
    setScheduleTitle(schedule.title);
    setSelectedClassIds([...schedule.targetClassIds]);
    setTranches([...schedule.tranches]);
    setIsModalOpen(true);
  };

  // Toggle Class Selection for Schedule
  const toggleClassSelection = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      setSelectedClassIds(selectedClassIds.filter((id) => id !== classId));
    } else {
      setSelectedClassIds([...selectedClassIds, classId]);
    }
  };

  const handleSelectAllClasses = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classes.map((c) => c.id));
    }
  };

  // Add Tranche row
  const handleAddTrancheRow = () => {
    const nextNum = tranches.length + 1;
    setTranches([
      ...tranches,
      {
        id: `TR-${Date.now()}-${nextNum}`,
        name: `${nextNum}ème Tranche`,
        amountFCFA: 50000,
        dueDate: new Date().toISOString().split("T")[0]
      }
    ]);
  };

  // Remove Tranche row
  const handleRemoveTrancheRow = (id: string) => {
    if (tranches.length <= 1) {
      alert("Une définition doit comporter au moins une tranche de scolarité.");
      return;
    }
    setTranches(tranches.filter((t) => t.id !== id));
  };

  // Save Schedule Definition
  const handleSaveScheduleDefinition = (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduleTitle.trim()) {
      alert("Veuillez saisir un nom pour cette définition d'échéancier.");
      return;
    }

    if (selectedClassIds.length === 0) {
      alert("Veuillez sélectionner au moins une classe concernée.");
      return;
    }

    if (tranches.length === 0) {
      alert("Veuillez ajouter au moins une tranche de scolarité.");
      return;
    }

    const currentSchedules = formData.tuitionSchedules || [];

    let updatedSchedules: TuitionScheduleDefinition[];
    if (editingSchedule) {
      // Edit mode
      updatedSchedules = currentSchedules.map((s) =>
        s.id === editingSchedule.id
          ? {
              ...s,
              title: scheduleTitle.trim(),
              targetClassIds: selectedClassIds,
              tranches
            }
          : s
      );
    } else {
      // Create mode
      const newSchedule: TuitionScheduleDefinition = {
        id: `SCHED-${Date.now()}`,
        title: scheduleTitle.trim(),
        targetClassIds: selectedClassIds,
        tranches
      };
      updatedSchedules = [...currentSchedules, newSchedule];
    }

    const newFormData = {
      ...formData,
      tuitionSchedules: updatedSchedules
    };

    setFormData(newFormData);
    setSettings(newFormData);
    localStorage.setItem("smarty_settings", JSON.stringify(newFormData));
    setIsModalOpen(false);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Delete Schedule Definition
  const handleDeleteSchedule = (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette définition d'échéancier ?")) {
      return;
    }

    const currentSchedules = formData.tuitionSchedules || [];
    const updated = currentSchedules.filter((s) => s.id !== id);
    const newFormData = {
      ...formData,
      tuitionSchedules: updated
    };

    setFormData(newFormData);
    setSettings(newFormData);
    localStorage.setItem("smarty_settings", JSON.stringify(newFormData));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // ===== PÉRIODES =====
  const fetchPeriodes = () => {
    apiFetch('/school-admin/periodes')
      .then((r) => r.json())
      .then((data) => setPeriodes(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPeriodes();
  }, []);

  const handleGeneratePeriodes = async () => {
    setPeriodeError("");
    setPeriodeSuccess("");

    const labels = periodeType === "trimestre"
      ? ["1er Trimestre", "2ème Trimestre", "3ème Trimestre"]
      : ["1er Semestre", "2ème Semestre"];

    let created = 0;
    for (let i = 0; i < labels.length; i++) {
      try {
        const res = await apiFetch('/school-admin/periodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            libelle: labels[i],
            type: periodeType,
            numero: i + 1,
          }),
        });
        if (res.ok) created++;
      } catch {}
    }

    if (created > 0) {
      setPeriodeSuccess(`${created} période(s) créée(s) avec succès !`);
      setTimeout(() => setPeriodeSuccess(""), 3000);
    } else {
      setPeriodeError("Erreur lors de la création des périodes.");
    }
    fetchPeriodes();
  };

  const handleDeletePeriode = async (id: number) => {
    if (!confirm("Supprimer cette période ? Les évaluations liées seront dissociées.")) return;
    try {
      const res = await apiFetch(`/school-admin/periodes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPeriodes();
    } catch {}
  };

  const currentSchedules = formData.tuitionSchedules || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>Paramètres de l'Établissement</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Configuration des tranches de scolarité avec leurs dates limites & informations de l'école
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab("schedules")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "schedules"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80 font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>Tranches & Échéanciers</span>
            <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px]">
              {currentSchedules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("general")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "general"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80 font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <School className="w-4 h-4 text-slate-600" />
            <span>Identité & Coordonnées</span>
          </button>

          <button
            onClick={() => setActiveTab("periodes")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "periodes"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80 font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Périodes</span>
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
              {periodes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "security"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80 font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className="w-4 h-4 text-rose-600" />
            <span>Sécurité</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Paramètres enregistrés avec succès !</span>
        </div>
      )}

      {/* TAB 1: SCHEDULES & TRANCHES */}
      {activeTab === "schedules" && (
        <div className="space-y-6">
          {/* Top Info Banner & Add Button */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-300" />
                <span>Définitions des Tranches de Scolarité & Dates Limites</span>
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Créez plusieurs définitions d'échéanciers pour adapter les tranches de paiement aux différentes classes (Collège, Lycée, Primaire). Chaque définition regroupe ses tranches, montants et dates limites.
              </p>
            </div>

            <button
              onClick={handleOpenNewModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une définition d'échéancier</span>
            </button>
          </div>

          {/* List of Existing Schedule Definitions */}
          {currentSchedules.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Aucun échéancier configuré</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cliquez sur le bouton ci-dessus pour définir les tranches de règlement de la scolarité et associer les classes concernées.
              </p>
              <button
                onClick={handleOpenNewModal}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un premier échéancier</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {currentSchedules.map((schedule) => {
                const totalAmount = schedule.tranches.reduce((sum, t) => sum + t.amountFCFA, 0);

                // Get class names for concerned ids
                const concernedClassNames = classes
                  .filter((c) => schedule.targetClassIds.includes(c.id))
                  .map((c) => c.name);

                return (
                  <div
                    key={schedule.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all overflow-hidden"
                  >
                    {/* Schedule Card Header */}
                    <div className="p-5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 text-base">{schedule.title}</h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[11px]">
                            {schedule.tranches.length} Tranche{schedule.tranches.length > 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Concerned Classes Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-xs font-semibold text-slate-500 mr-1">
                            Classes concernées :
                          </span>
                          {concernedClassNames.length === 0 ? (
                            <span className="text-xs italic text-slate-400">Aucune classe associée</span>
                          ) : (
                            concernedClassNames.map((cName) => (
                              <span
                                key={cName}
                                className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] shadow-2xs"
                              >
                                {cName}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Header Actions & Total */}
                      <div className="flex items-center gap-4 self-end md:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Scolarité</span>
                          <span className="text-lg font-black text-blue-700">
                            {totalAmount.toLocaleString("fr-FR")} FCFA
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                          <button
                            onClick={() => handleOpenEditModal(schedule)}
                            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Modifier cet échéancier"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden sm:inline">Modifier</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-400 text-xs font-bold transition-all cursor-pointer"
                            title="Supprimer cet échéancier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Tranches Table */}
                    <div className="p-5">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                              <th className="py-2.5 px-3">N° / Intitulé de la Tranche</th>
                              <th className="py-2.5 px-3">Montant (FCFA)</th>
                              <th className="py-2.5 px-3">Part (%)</th>
                              <th className="py-2.5 px-3 text-right">Date Limite de Paiement</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {schedule.tranches.map((tranche, idx) => {
                              const pct = totalAmount > 0 ? Math.round((tranche.amountFCFA / totalAmount) * 100) : 0;
                              return (
                                <tr key={tranche.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <span>{tranche.name}</span>
                                  </td>
                                  <td className="py-3 px-3 font-extrabold text-blue-700 text-sm">
                                    {tranche.amountFCFA.toLocaleString("fr-FR")} FCFA
                                  </td>
                                  <td className="py-3 px-3 font-semibold text-slate-500">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                                      {pct}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs">
                                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                      <span>
                                        {tranche.dueDate
                                          ? new Date(tranche.dueDate).toLocaleDateString("fr-FR", {
                                              day: "numeric",
                                              month: "long",
                                              year: "numeric"
                                            })
                                          : "Non définie"}
                                      </span>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GENERAL SCHOOL SETTINGS */}
      {activeTab === "general" && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Identité de l'Établissement Scolaire
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom Complet de l'Établissement</label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Sigle / Acronyme</label>
                <input
                  type="text"
                  value={formData.acronym}
                  onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Logo (URL de l'image)</label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom du Proviseur / Directeur</label>
                <input
                  type="text"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Coordonnées & Localisation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Adresse Physique</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ville</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pays</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Téléphone Secrétariat</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email de Contact</label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Année Scolaire Active</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-blue-700 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les Informations Générales</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL: CREATE / EDIT TUITION SCHEDULE DEFINITION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editingSchedule ? "Modifier l'Échéancier de Scolarité" : "Créer une Définition d'Échéancier"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Saisissez le nom, cochez les classes concernées et définissez les tranches avec dates limites
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveScheduleDefinition} className="p-6 space-y-6 text-xs">
              {/* 1. Schedule Title */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 text-xs block">
                  Intitulé de l'Échéancier / Groupe de Tranches <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Échéancier Général Collège (3 Tranches) ou Échéancier Lycée"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-slate-900 font-bold focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* 2. Target Classes Selection */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <School className="w-4 h-4 text-blue-600" />
                    <span>Classes Concernées <span className="text-red-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllClasses}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {selectedClassIds.length === classes.length ? "Désélectionner tout" : "Sélectionner tout"}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  {classes.map((cls) => {
                    const isChecked = selectedClassIds.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-blue-50 border-blue-300 text-blue-900 font-extrabold"
                            : "bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-100/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleClassSelection(cls.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{cls.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 3. Tranches & Dates Limites List */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Définition des Tranches & Dates Limites de Paiement</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTrancheRow}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une tranche</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {tranches.map((tranche, idx) => (
                    <div
                      key={tranche.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-1 text-center font-black text-slate-500">
                        #{idx + 1}
                      </div>

                      {/* Tranche Name */}
                      <div className="sm:col-span-5">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Intitulé de la Tranche
                        </label>
                        <input
                          type="text"
                          value={tranche.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTranches(
                              tranches.map((t) => (t.id === tranche.id ? { ...t, name: val } : t))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-bold text-slate-900 text-xs"
                          placeholder="Ex: 1ère Tranche"
                          required
                        />
                      </div>

                      {/* Amount FCFA */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Montant (FCFA)
                        </label>
                        <input
                          type="number"
                          value={tranche.amountFCFA}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setTranches(
                              tranches.map((t) => (t.id === tranche.id ? { ...t, amountFCFA: val } : t))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-black text-blue-700 text-xs"
                          placeholder="Montant FCFA"
                          min={0}
                          step={1000}
                          required
                        />
                      </div>

                      {/* Due Date */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Date Limite
                        </label>
                        <input
                          type="date"
                          value={tranche.dueDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTranches(
                              tranches.map((t) => (t.id === tranche.id ? { ...t, dueDate: val } : t))
                            );
                          }}
                          className="w-full px-2 py-1.5 border rounded-lg bg-white font-bold text-slate-800 text-[11px]"
                          required
                        />
                      </div>

                      {/* Delete Row Button */}
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveTrancheRow(tranche.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Supprimer cette tranche"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Calculated Summary */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs font-bold text-blue-900">
                  <span>Total Cumulé de la Scolarité :</span>
                  <span className="text-sm font-black text-blue-700">
                    {tranches.reduce((sum, t) => sum + (t.amountFCFA || 0), 0).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer cet Échéancier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: PÉRIODES */}
      {activeTab === "periodes" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-300" />
                <span>Périodes Scolaires (Trimestres / Semestres)</span>
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Générez les périodes de l'année scolaire active. Les évaluations seront associées à ces périodes.
              </p>
            </div>
          </div>

          {periodeError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {periodeError}
            </div>
          )}
          {periodeSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {periodeSuccess}
            </div>
          )}

          {/* Generate Button */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-800">Générer les périodes</h4>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="font-bold text-slate-700 block mb-1 text-xs">Mode</label>
                <select
                  value={periodeType}
                  onChange={(e) => setPeriodeType(e.target.value as "trimestre" | "semestre")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-xs"
                >
                  <option value="trimestre">Trimestre (3 périodes)</option>
                  <option value="semestre">Semestre (2 périodes)</option>
                </select>
              </div>
              <button
                onClick={handleGeneratePeriodes}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Générer</span>
              </button>
            </div>
          </div>

          {/* List of existing periods */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-800">Périodes existantes</h4>
            {periodes.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Aucune période créée. Utilisez le bouton ci-dessus pour en générer.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100">
                    <th className="pb-2 font-bold">Libellé</th>
                    <th className="pb-2 font-bold">Type</th>
                    <th className="pb-2 font-bold">N°</th>
                    <th className="pb-2 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {periodes.map((p: any) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-800">{p.libelle}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.type === "trimestre"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {p.type === "trimestre" ? "Trimestre" : "Semestre"}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600">{p.numero}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDeletePeriode(p.id)}
                          className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SÉCURITÉ */}
      {activeTab === "security" && <SecurityTab />}
    </div>
  );
};
