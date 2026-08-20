import React, { useState } from 'react';
import { ScreenType } from '../../types';

interface Evaluation {
  id: number;
  titre: string;
  type: string;
  date: string;
  classe: { id: number; libelle: string };
  matiere: { id: number; libelle: string };
  notes_saisies?: number;
  total_eleves?: number;
  coefficient?: number;
  moyenne?: number;
  mediane?: number;
  has_notes?: boolean;
}

interface AssessmentsScreenProps {
  evaluations: Evaluation[];
  onNavigate: (screen: ScreenType) => void;
}

export const AssessmentsScreen: React.FC<AssessmentsScreenProps> = ({
  evaluations,
  onNavigate,
}) => {
  const [filterSubject, setFilterSubject] = useState<string>('Tous');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const subjects = ['Tous', ...new Set(evaluations.map(e => e.matiere?.libelle).filter(Boolean))];

  const filteredEvals = evaluations.filter(e => {
    if (filterSubject === 'Tous') return true;
    return e.matiere?.libelle === filterSubject;
  });

  const getGradeColor = (moyenne?: number) => {
    if (!moyenne) return 'text-on-surface-variant';
    if (moyenne >= 16) return 'text-green-600';
    if (moyenne >= 14) return 'text-emerald-600';
    if (moyenne >= 10) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <main className="max-w-7xl mx-auto px-3 md:px-6 mt-4 pb-20">
      <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs font-medium text-on-surface-variant mb-1">
            <span className="cursor-pointer hover:underline" onClick={() => onNavigate('dashboard')}>Dashboard</span>
            <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
            <span className="text-primary font-bold">Notes</span>
          </nav>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">Évaluations</h2>
          <p className="text-on-surface-variant text-sm mt-1">{evaluations.length} évaluation{evaluations.length > 1 ? 's' : ''} au total</p>
        </div>

        <button onClick={() => onNavigate('create_assessment')} className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer">
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Nouvelle évaluation
        </button>
      </section>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setFilterSubject(sub)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterSubject === sub
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {filteredEvals.map(ev => {
          const isExpanded = expandedId === ev.id;
          const completion = ev.total_eleves ? Math.round(((ev.notes_saisies || 0) / ev.total_eleves) * 100) : 0;

          return (
            <div key={ev.id} className={`bg-white rounded-xl shadow-sm border transition-all ${isExpanded ? 'border-primary shadow-md' : 'border-outline-variant hover:border-primary/40'}`}>
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">{ev.type === 'Composition' ? 'school' : ev.type === 'Devoir' ? 'edit_note' : 'quiz'}</span>
                      <h3 className="font-bold text-on-surface">{ev.titre}</h3>
                      {ev.has_notes && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Noté
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[11px] font-semibold">{ev.classe?.libelle}</span>
                      <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[11px]">{ev.matiere?.libelle}</span>
                      <span className="text-on-surface-variant/60 text-[11px]">Coeff. {ev.coefficient || 1}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant">Moy.</p>
                      <p className={`text-lg font-bold ${getGradeColor(ev.moyenne)}`}>
                        {ev.moyenne !== undefined ? ev.moyenne.toFixed(1) : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant">Saisie</p>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completion}%` }} />
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant">{completion}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {evaluations.length === 0 && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">assignment</span>
          <p className="text-on-surface-variant">Aucune évaluation</p>
        </div>
      )}
    </main>
  );
};
