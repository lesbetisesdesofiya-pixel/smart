import React, { useState } from "react";
import {
  GitMerge,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  School,
  Clock,
  BookOpen,
  X
} from "lucide-react";
import { Assignment, Teacher, SchoolClass } from "../types";

interface AssignmentsManagerProps {
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  teachers: Teacher[];
  classes: SchoolClass[];
}

export const AssignmentsManager: React.FC<AssignmentsManagerProps> = ({
  assignments,
  setAssignments,
  teachers,
  classes
}) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [formData, setFormData] = useState({
    teacherId: teachers[0]?.id || "T1",
    classId: classes[0]?.id || "C1",
    subject: "Mathématiques",
    coefficient: 3
  });

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeacher = teachers.find((t) => t.id === formData.teacherId);
    const selectedClass = classes.find((c) => c.id === formData.classId);

    if (!selectedTeacher || !selectedClass) return;

    const newAssignment: Assignment = {
      id: `A${Date.now()}`,
      teacherId: selectedTeacher.id,
      teacherName: `${selectedTeacher.firstName} ${selectedTeacher.lastName}`,
      subject: formData.subject,
      classId: selectedClass.id,
      className: selectedClass.name,
      coefficient: Number(formData.coefficient) || 2
    };

    setAssignments([...assignments, newAssignment]);
    setIsAssigning(false);
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments(assignments.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-blue-600" />
            <span>Affectations des Professeurs</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Répartition des matières et des classes par professeur avec suivi du volume horaire hebdomadaire
          </p>
        </div>

        <button
          id="btn-add-assignment"
          onClick={() => setIsAssigning(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Affectation</span>
        </button>
      </div>

      {/* Teachers Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map((t) => {
          const teacherAssignments = assignments.filter((a) => a.teacherId === t.id);
          const totalCoeff = teacherAssignments.reduce((sum, a) => sum + a.coefficient, 0);

          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs border border-blue-200">
                  {t.firstName[0]}{t.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-sm truncate">
                    {t.firstName} {t.lastName}
                  </h4>
                  <p className="text-xs text-blue-600 font-medium">{t.mainSubject}</p>
                </div>
              </div>

              {/* Total Coefficient */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-500">Total des coefficients attribués</span>
                  <span className="text-slate-900 font-extrabold">
                    Coeff. {totalCoeff}
                  </span>
                </div>
              </div>

              {/* Assigned Classes */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                  Classes attribuées ({teacherAssignments.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {teacherAssignments.length > 0 ? (
                    teacherAssignments.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold"
                      >
                        <span>{a.className}</span>
                        <span className="text-blue-600 font-black">(Coeff. {a.coefficient})</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Aucune classe assignée</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignments Detail Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Tableau Général des Affectations</h3>
          <span className="text-xs text-slate-500 font-medium">{assignments.length} cours attribués</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-white text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Professeur</th>
                <th className="px-5 py-3">Matière Enseignée</th>
                <th className="px-5 py-3">Classe Destinataire</th>
                <th className="px-5 py-3">Coefficient</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{a.teacherName}</td>
                  <td className="px-5 py-3.5 text-blue-600 font-semibold">{a.subject}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-extrabold border border-blue-100">
                      {a.className}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">Coeff. {a.coefficient}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Retirer l'affectation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Assignment Modal */}
      {isAssigning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Nouvelle Affectation</h3>
              <button onClick={() => setIsAssigning(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Professeur</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => {
                    const t = teachers.find((teach) => teach.id === e.target.value);
                    setFormData({
                      ...formData,
                      teacherId: e.target.value,
                      subject: t?.mainSubject || "Mathématiques"
                    });
                  }}
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
                <label className="font-bold text-slate-700 block mb-1">Classe Destinataire</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Matière</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.coefficient}
                    onChange={(e) => setFormData({ ...formData, coefficient: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssigning(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Valider l'affectation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
