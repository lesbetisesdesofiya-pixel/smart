import React, { useState, useMemo } from 'react';
import { Student, ScreenType } from '../../types';

interface CreateRemarkScreenProps {
  students: Student[];
  onNavigate: (screen: ScreenType) => void;
  onSubmitRemark?: (studentId: string, remarkText: string, category: string) => void;
}

export const CreateRemarkScreen: React.FC<CreateRemarkScreenProps> = ({
  students,
  onNavigate,
  onSubmitRemark,
}) => {
  // Extract unique classes
  const classesList = useMemo(() => {
    const list = Array.from(new Set(students.map((s) => s.className)));
    return list.length > 0 ? list : ['3ème A', '4ème B'];
  }, [students]);

  const [selectedClass, setSelectedClass] = useState<string>(classesList[0] || '3ème A');

  // Filter students for selected class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.className === selectedClass);
  }, [students, selectedClass]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    classStudents[0]?.id || (students[0]?.id ?? '')
  );

  const [category, setCategory] = useState<'Travail' | 'Comportement' | 'Encouragement' | 'Avertissement'>('Travail');
  const [remarkText, setRemarkText] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Keep student selection in sync when class changes
  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    const newClassStudents = students.filter((s) => s.className === newClass);
    if (newClassStudents.length > 0) {
      setSelectedStudentId(newClassStudents[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkText.trim()) return;

    if (onSubmitRemark && selectedStudentId) {
      onSubmitRemark(selectedStudentId, remarkText, category);
    }

    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
      setRemarkText('');
      onNavigate('dashboard');
    }, 1500);
  };

  return (
    <main className="max-w-[1000px] mx-auto px-4 md:px-10 py-6 pb-32">
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => onNavigate('dashboard')}
          className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-primary">
            Faire une remarque
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Ajoutez une observation ou remarque sur un élève
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="mb-6 p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-2xl">check_circle</span>
          <div>
            <p className="font-bold text-sm">Remarque enregistrée avec succès !</p>
            <p className="text-xs text-emerald-100">Redirection vers le tableau de bord...</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-outline-variant space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class & Student Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Class Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface">
                1. Sélectionner la Classe
              </label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-outline-variant rounded-xl text-sm appearance-none focus:ring-2 focus:ring-primary-container focus:border-primary outline-none transition-all cursor-pointer font-medium text-on-surface"
                >
                  {classesList.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-lg">
                  expand_more
                </span>
              </div>
            </div>

            {/* Student Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface">
                2. Sélectionner l'Élève
              </label>
              <div className="relative">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-outline-variant rounded-xl text-sm appearance-none focus:ring-2 focus:ring-primary-container focus:border-primary outline-none transition-all cursor-pointer font-medium text-on-surface"
                >
                  {classStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                  {classStudents.length === 0 && (
                    <option value="" disabled>
                      Aucun élève dans cette classe
                    </option>
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-lg">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Category Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface">
              Type de remarque
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'Travail', label: 'Travail / Effort', icon: 'menu_book' },
                { id: 'Comportement', label: 'Comportement', icon: 'record_voice_over' },
                { id: 'Encouragement', label: 'Encouragement', icon: 'thumb_up' },
                { id: 'Avertissement', label: 'Avertissement', icon: 'warning' },
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    category === cat.id
                      ? 'bg-primary text-white border-primary shadow-2xs'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Remark Textarea Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface">
              Saisir la remarque
            </label>
            <textarea
              rows={5}
              required
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="Rédigez ici votre remarque ou observation pour l'élève..."
              className="w-full p-4 bg-white border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all font-body-md text-on-surface resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-3 bg-surface-container-high text-on-surface rounded-xl font-label-md text-xs font-bold hover:bg-surface-container transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-xl font-label-md text-xs font-bold hover:opacity-90 active:scale-98 transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">send</span>
              <span>Enregistrer la remarque</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};
