import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';

interface Evaluation {
  id: number;
  titre: string;
  date: string;
  note_sur: number;
  coefficient: number;
  type_evaluation?: string;
  classe: { id: number; libelle: string } | null;
  matiere: { id: number; libelle: string } | null;
  periode: { id: number; libelle: string } | null;
}

const SUBJECT_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  'math': { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' },
  'fran': { bg: 'bg-rose-50', border: 'border-l-rose-500', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700' },
  'scien': { bg: 'bg-emerald-50', border: 'border-l-emerald-500', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
  'svt': { bg: 'bg-emerald-50', border: 'border-l-emerald-500', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
  'hist': { bg: 'bg-amber-50', border: 'border-l-amber-500', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' },
  'geo': { bg: 'bg-amber-50', border: 'border-l-amber-500', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' },
  'angl': { bg: 'bg-purple-50', border: 'border-l-purple-500', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700' },
  'eps': { bg: 'bg-teal-50', border: 'border-l-teal-500', text: 'text-teal-800', badge: 'bg-teal-100 text-teal-700' },
  'tech': { bg: 'bg-indigo-50', border: 'border-l-indigo-500', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700' },
  'info': { bg: 'bg-indigo-50', border: 'border-l-indigo-500', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700' },
  'art': { bg: 'bg-violet-50', border: 'border-l-violet-500', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-700' },
  'musiq': { bg: 'bg-violet-50', border: 'border-l-violet-500', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-700' },
};

function getColors(subject: string) {
  const s = subject.toLowerCase();
  for (const [key, colors] of Object.entries(SUBJECT_COLORS)) {
    if (s.includes(key)) return colors;
  }
  return { bg: 'bg-gray-50', border: 'border-l-gray-400', text: 'text-gray-800', badge: 'bg-gray-100 text-gray-700' };
}

function formatDate(dateStr: string): { display: string; daysLeft: number; isPast: boolean } {
  if (!dateStr) return { display: 'Date inconnue', daysLeft: 0, isPast: false };
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const display = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  if (diff < 0) return { display, daysLeft: diff, isPast: true };
  if (diff === 0) return { display: "Aujourd'hui", daysLeft: 0, isPast: false };
  if (diff === 1) return { display: 'Demain', daysLeft: 1, isPast: false };
  return { display, daysLeft: diff, isPast: false };
}

export const ExamensScreenV2: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);

  const loadEvaluations = useCallback(async () => {
    try {
      const res = await apiFetch('/parent/evaluations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEvaluations(data);
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvaluations(); }, [loadEvaluations]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filtered = evaluations.filter(e => {
    if (filter === 'all') return true;
    const evalDate = new Date(e.date);
    evalDate.setHours(0, 0, 0, 0);
    if (filter === 'upcoming') return evalDate >= now;
    return evalDate < now;
  });

  const upcomingCount = evaluations.filter(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    return d >= now;
  }).length;

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-[#375ca6] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto">
      <div className="pt-2 mb-4">
        <h1 className="text-lg font-bold text-[#00113a]">Examens a venir</h1>
        <p className="text-xs text-gray-400">Evaluations et contrroles de votre enfant</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-semibold">Total</p>
          <p className="text-lg font-extrabold text-[#002366]">{evaluations.length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-semibold">A venir</p>
          <p className="text-lg font-extrabold text-emerald-600">{upcomingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-semibold">Passes</p>
          <p className="text-lg font-extrabold text-gray-400">{evaluations.length - upcomingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {[
          { key: 'all' as const, label: 'Tous' },
          { key: 'upcoming' as const, label: 'A venir' },
          { key: 'past' as const, label: 'Passes' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === f.key ? 'bg-[#002366] text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-[#375ca6]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Evaluations list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-gray-200">event_note</span>
          <p className="text-sm text-gray-400 mt-2">Aucun examen pour ce filtre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(evaluation => {
            const matiere = evaluation.matiere?.libelle || 'Matiere';
            const colors = getColors(matiere);
            const dateInfo = formatDate(evaluation.date);
            const isUpcoming = !dateInfo.isPast;

            return (
              <button
                key={evaluation.id}
                onClick={() => setSelectedEval(evaluation)}
                className={`w-full rounded-2xl p-4 border-l-4 text-left transition-all hover:shadow-md ${colors.bg} ${colors.border} ${isUpcoming ? 'border border-gray-100' : 'border border-gray-100 opacity-70'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${colors.text}`}>{matiere}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{evaluation.titre || 'Evaluation'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isUpcoming && dateInfo.daysLeft <= 3 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold">
                        {dateInfo.daysLeft === 0 ? "Aujourd'hui" : dateInfo.daysLeft === 1 ? 'Demain' : `Dans ${dateInfo.daysLeft}j`}
                      </span>
                    )}
                    {isUpcoming && dateInfo.daysLeft > 3 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                        Dans {dateInfo.daysLeft}j
                      </span>
                    )}
                    {!isUpcoming && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[9px] font-bold">Passe</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {dateInfo.display}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">timer</span>
                    {evaluation.note_sur || 20} pts
                  </span>
                  {evaluation.coefficient > 1 && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">close</span>
                      Coeff. {evaluation.coefficient}
                    </span>
                  )}
                </div>

                {evaluation.periode?.libelle && (
                  <p className="text-[10px] text-gray-400 mt-1.5">{evaluation.periode.libelle}</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedEval && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4 animate-slideUp">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  {selectedEval.matiere?.libelle || 'Matiere'}
                </p>
                <p className="text-base font-bold text-[#00113a] mt-1">{selectedEval.titre || 'Evaluation'}</p>
              </div>
              <button onClick={() => setSelectedEval(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <span className="material-symbols-outlined text-gray-400">close</span>
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Date :</span>
                <span className="font-bold text-gray-700">{formatDate(selectedEval.date).display}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Matiere :</span>
                <span className="font-bold text-gray-700">{selectedEval.matiere?.libelle || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Note sur :</span>
                <span className="font-bold text-gray-700">{selectedEval.note_sur || 20}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Coefficient :</span>
                <span className="font-bold text-gray-700">{selectedEval.coefficient || 1}</span>
              </div>
              {selectedEval.periode?.libelle && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Periode :</span>
                  <span className="font-bold text-gray-700">{selectedEval.periode.libelle}</span>
                </div>
              )}
              {selectedEval.classe?.libelle && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Classe :</span>
                  <span className="font-bold text-gray-700">{selectedEval.classe.libelle}</span>
                </div>
              )}
            </div>

            {(() => {
              const dateInfo = formatDate(selectedEval.date);
              if (!dateInfo.isPast) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-lg">schedule</span>
                    <p className="text-xs text-amber-800 font-semibold">
                      {dateInfo.daysLeft === 0 ? "L'examen est aujourd'hui !" :
                       dateInfo.daysLeft === 1 ? "L'examen est demain !" :
                       `L'examen dans ${dateInfo.daysLeft} jours`}
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            <button onClick={() => setSelectedEval(null)} className="w-full py-3 bg-[#002366] text-white font-bold text-sm rounded-xl hover:bg-[#001a4d] transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
