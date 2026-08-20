import React, { useState } from 'react';
import { Grade } from '../types';

interface NotesScreenProps {
  grades: Grade[];
}

export const NotesScreen: React.FC<NotesScreenProps> = ({ grades }) => {
  const [selectedTerm, setSelectedTerm] = useState<'T1' | 'T2' | 'T3'>('T1');
  const [selectedSubject, setSelectedSubject] = useState<string>('Toutes');
  const [selectedGradeDetail, setSelectedGradeDetail] = useState<Grade | null>(null);

  const subjects = ['Toutes', 'Mathématiques', 'Français', 'Sciences de la Vie', 'Histoire-Géo', 'Anglais'];

  const filteredGrades = grades.filter((g) => {
    const matchTerm = g.term === selectedTerm;
    const matchSubject = selectedSubject === 'Toutes' || g.subject === selectedSubject;
    return matchTerm && matchSubject;
  });

  return (
    <div className="space-y-5 pb-24 px-4 sm:px-5 max-w-lg mx-auto animate-fadeIn">
      {/* Header Section */}
      <div className="pt-2">
        <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Mes Notes</h2>
        <p className="text-xs text-[#757682] mt-0.5">Suivez les résultats académiques en temps réel</p>
      </div>

      {/* Filter Bar */}
      <section className="space-y-3">
        {/* Term Selector (Trimestre) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(['T1', 'T2', 'T3'] as const).map((t) => {
            const isActive = selectedTerm === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedTerm(t)}
                className={`px-6 py-2 rounded-full text-xs font-semibold transition-all shadow-xs ${
                  isActive
                    ? 'bg-[#002366] text-white shadow-sm'
                    : 'bg-[#e5eeff] text-[#444650] hover:bg-[#dce9ff]'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Subject Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {subjects.map((sub) => {
            const isActive = selectedSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-[#e5eeff] border-[#375ca6] text-[#00113a] shadow-xs'
                    : 'bg-[#eff4ff] border-slate-200 text-[#444650] hover:bg-slate-100'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </section>

      {/* Evaluations List */}
      <div className="space-y-4">
        {filteredGrades.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6">
            <span className="material-symbols-outlined text-4xl text-slate-300">grade</span>
            <p className="text-xs text-slate-500 font-medium mt-2">Aucune note enregistrée pour ces filtres.</p>
          </div>
        ) : (
          filteredGrades.map((grade) => (
            <div
              key={grade.id}
              onClick={() => setSelectedGradeDetail(grade)}
              className="bg-white rounded-[24px] p-5 shadow-card flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:border-[#375ca6]/40 border border-slate-100 transition-all active:scale-98"
            >
              {/* Vertical Color Accent Left Bar */}
              <div
                className="absolute top-0 left-0 w-1.5 h-full"
                style={{ backgroundColor: grade.accentColor || '#375ca6' }}
              />

              <div className="flex justify-between items-start pl-1">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${grade.badgeBg}`}>
                    {grade.badgeText || grade.subject}
                  </span>
                  <h3 className="text-base font-bold text-[#0b1c30] mt-2 leading-tight">
                    {grade.title}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#00113a]">
                    {grade.score}
                    <span className="text-xs font-normal text-slate-400 ml-0.5">/{grade.maxScore}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-500 text-xs pt-1 pl-1 border-t border-slate-50">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">calendar_today</span>
                  <span>{grade.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">bookmark</span>
                  <span>Trimestre {grade.term.replace('T', '')}</span>
                </div>
                {grade.coefficient && (
                  <div className="flex items-center gap-1 ml-auto text-slate-400">
                    <span>Coeff. {grade.coefficient}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <div className="py-4 text-center">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            FIN DES RÉSULTATS {selectedTerm}
          </p>
        </div>
      </div>

      {/* Grade Detail Modal */}
      {selectedGradeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedGradeDetail.badgeBg}`}>
                {selectedGradeDetail.subject}
              </span>
              <button
                onClick={() => setSelectedGradeDetail(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="text-center py-2">
              <h3 className="text-lg font-bold text-[#00113a]">{selectedGradeDetail.title}</h3>
              <div className="mt-3 inline-flex items-baseline gap-1 bg-[#f8f9ff] px-6 py-3 rounded-2xl border border-slate-100">
                <span className="text-3xl font-extrabold text-[#002366]">{selectedGradeDetail.score}</span>
                <span className="text-sm text-slate-400 font-bold">/ {selectedGradeDetail.maxScore}</span>
              </div>
            </div>

            {selectedGradeDetail.appreciation && (
              <div className="bg-[#eff4ff] p-4 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-[#144089] mb-1">Appréciation de l'enseignant :</p>
                <p className="text-xs text-[#0b1c30] italic leading-relaxed">
                  "{selectedGradeDetail.appreciation}"
                </p>
              </div>
            )}

            <div className="space-y-1 text-xs text-slate-500 pt-1">
              <div className="flex justify-between">
                <span>Date d'évaluation :</span>
                <span className="font-semibold text-slate-700">{selectedGradeDetail.date}</span>
              </div>
              <div className="flex justify-between">
                <span>Période :</span>
                <span className="font-semibold text-slate-700">Trimestre {selectedGradeDetail.term.replace('T', '')}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedGradeDetail(null)}
              className="w-full py-3 bg-[#002366] text-white font-bold text-xs rounded-xl hover:bg-[#00113a] transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
