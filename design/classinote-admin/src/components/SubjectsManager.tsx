import React, { useState } from "react";
import { BookOpen, Plus, Search, Trash2, Edit2, X, Check } from "lucide-react";
import { SubjectItem } from "../types";

interface SubjectsManagerProps {
  subjects: SubjectItem[];
  setSubjects: React.Dispatch<React.SetStateAction<SubjectItem[]>>;
}

export const SubjectsManager: React.FC<SubjectsManagerProps> = ({
  subjects,
  setSubjects
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "Scientifique" as SubjectItem["category"],
    coefficientDefault: 2
  });

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (editingSubject) {
      setSubjects(
        subjects.map((s) =>
          s.id === editingSubject.id
            ? { ...s, ...formData }
            : s
        )
      );
      setEditingSubject(null);
    } else {
      const newSubject: SubjectItem = {
        id: `SUB${Date.now()}`,
        name: formData.name,
        code: formData.code.toUpperCase(),
        category: formData.category,
        coefficientDefault: Number(formData.coefficientDefault)
      };
      setSubjects([...subjects, newSubject]);
    }

    setIsAddingSubject(false);
    setFormData({
      name: "",
      code: "",
      category: "Scientifique",
      coefficientDefault: 2
    });
  };

  const handleStartEdit = (subject: SubjectItem) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      category: subject.category,
      coefficientDefault: subject.coefficientDefault
    });
    setIsAddingSubject(true);
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm("Voulez-vous supprimer cette matière ?")) {
      setSubjects(subjects.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Gestion des Matières & Disciplines ({subjects.length})</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Créer et configurer les matières enseignées et leurs coefficients par défaut
          </p>
        </div>

        <button
          id="btn-add-subject"
          onClick={() => {
            setEditingSubject(null);
            setFormData({ name: "", code: "", category: "Scientifique", coefficientDefault: 2 });
            setIsAddingSubject(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une Matière</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          placeholder="Rechercher une matière par nom, code ou catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs font-medium focus:outline-none"
        />
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-extrabold text-[10px] tracking-wide uppercase border border-slate-200">
                    {s.code}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1.5">{s.name}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(s)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(s.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                  {s.category}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Coeff par défaut: <strong className="text-slate-900">{s.coefficientDefault}</strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Subject */}
      {isAddingSubject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingSubject ? "Modifier la Matière" : "Ajouter une Matière"}
              </h3>
              <button
                onClick={() => setIsAddingSubject(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom de la Matière</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Mathématiques, Français, Physique-Chimie"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Code Abrégé</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: MATH, PHYS"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coefficient par Défaut</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={formData.coefficientDefault}
                    onChange={(e) => setFormData({ ...formData, coefficientDefault: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catégorie Discipline</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as SubjectItem["category"] })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                >
                  <option value="Scientifique">Scientifique</option>
                  <option value="Littéraire">Littéraire</option>
                  <option value="Langue">Langue Vivante</option>
                  <option value="Sport">Sport / EPS</option>
                  <option value="Général">Culture Générale & Histoire</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSubject(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
