import React, { useState } from "react";
import {
  School,
  Plus,
  Users,
  GraduationCap,
  Trash2,
  X,
  CheckCircle2
} from "lucide-react";
import { SchoolClass, Teacher, SchoolLevel } from "../types";

interface ClassesManagerProps {
  classes: SchoolClass[];
  setClasses: React.Dispatch<React.SetStateAction<SchoolClass[]>>;
  teachers: Teacher[];
  onSelectClassFilter?: (classId: string) => void;
}

export const ClassesManager: React.FC<ClassesManagerProps> = ({
  classes,
  setClasses,
  teachers,
  onSelectClassFilter
}) => {
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [isAddingClass, setIsAddingClass] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    level: "college" as SchoolLevel,
    headTeacherId: teachers[0]?.id || "T1",
    ecolage: 0
  });

  const filteredClasses = classes.filter(
    (c) => selectedLevel === "all" || c.level === selectedLevel
  );

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const headTeacher = teachers.find((t) => t.id === formData.headTeacherId);
    const newClass: SchoolClass = {
      id: `C${Date.now()}`,
      name: formData.name,
      level: formData.level,
      headTeacherId: formData.headTeacherId,
      headTeacherName: headTeacher ? `${headTeacher.firstName} ${headTeacher.lastName}` : "Non assigné",
      studentCount: 0,
      delegateName: "À désigner",
      attendanceRate: 98.0
    };

    setClasses([...classes, newClass]);
    setIsAddingClass(false);
    setFormData({
      name: "",
      level: "college",
      headTeacherId: teachers[0]?.id || "T1",
      ecolage: 0
    });
  };

  const handleDeleteClass = (id: string) => {
    if (confirm("Voulez-vous supprimer cette classe ?")) {
      setClasses(classes.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <School className="w-6 h-6 text-blue-600" />
            <span>Gestion des Classes ({classes.length})</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Professeurs principaux, délégués et effectifs d'élèves par niveau
          </p>
        </div>

        <button
          id="btn-add-class"
          onClick={() => setIsAddingClass(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Classe</span>
        </button>
      </div>

      {/* Level Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: "all", label: "Toutes les classes" },
          { id: "college", label: "Collège" },
          { id: "lycee", label: "Lycée" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedLevel(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              selectedLevel === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Classes Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClasses.map((c) => {
          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{c.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] uppercase border border-blue-100">
                        {c.level}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteClass(c.id)}
                    className="text-slate-300 hover:text-rose-600 p-1 rounded"
                    title="Supprimer la classe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Head Teacher Info */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Professeur Principal :</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-xs">{c.headTeacherName}</p>
                </div>

                {/* Delegate */}
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Délégué(e) :</span>
                  <strong className="text-slate-800">{c.delegateName}</strong>
                </div>

                {/* Student Count */}
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/80 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Effectif total</span>
                  </span>
                  <span className="font-black text-slate-900 text-sm">
                    {c.studentCount} élèves
                  </span>
                </div>

                {/* Ecolage */}
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/80 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Scolarité</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {c.ecolage ? `${c.ecolage.toLocaleString()} FCFA` : 'Non définie'}
                  </span>
                </div>
              </div>

              {/* Attendance Rate & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{c.attendanceRate}% présence</span>
                </div>

                {onSelectClassFilter && (
                  <button
                    onClick={() => onSelectClassFilter(c.id)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Voir élèves</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Class Modal */}
      {isAddingClass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Créer une Nouvelle Classe</h3>
              <button onClick={() => setIsAddingClass(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom de la Classe</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: 4ème B ou CE2 A"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Niveau</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as SchoolLevel })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="college">Collège</option>
                  <option value="lycee">Lycée</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Professeur Principal</label>
                <select
                  value={formData.headTeacherId}
                  onChange={(e) => setFormData({ ...formData, headTeacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.mainSubject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Scolarité (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.ecolage}
                  onChange={(e) => setFormData({ ...formData, ecolage: Number(e.target.value) })}
                  placeholder="Ex: 50000"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingClass(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Créer la classe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
