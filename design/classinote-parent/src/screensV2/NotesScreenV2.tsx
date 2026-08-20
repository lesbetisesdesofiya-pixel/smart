import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../api';

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematiques': '#3b82f6',
  'Mathématiques': '#3b82f6',
  'Francais': '#ef4444',
  'Français': '#ef4444',
  'Sciences': '#10b981',
  'Histoire': '#f59e0b',
  'Anglais': '#8b5cf6',
  'EPS': '#06b6d4',
  'SVT': '#10b981',
  'Physique': '#0ea5e9',
};

function getColor(subject: string): string {
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#6b7280';
}

function GradeChart({ grades, subjects }: { grades: any[]; subjects: string[] }) {
  const width = 340;
  const height = 180;
  const padX = 35;
  const padY = 20;
  const padRight = 15;
  const padBottom = 25;
  const chartW = width - padX - padRight;
  const chartH = height - padY - padBottom;

  if (grades.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-44 text-gray-400">
        <span className="material-symbols-outlined text-3xl text-gray-200 mb-2">bar_chart</span>
        <p className="text-xs">Pas assez de notes pour le graphique.</p>
      </div>
    );
  }

  // Group grades by subject, take average per subject for the chart
  const subjectAvgs = subjects.map(subj => {
    const sg = grades.filter(g => g.subject === subj);
    if (sg.length === 0) return null;
    const avg = sg.reduce((s, g) => s + g.score, 0) / sg.length;
    return { subject: subj, avg, color: getColor(subj), count: sg.length };
  }).filter(Boolean) as { subject: string; avg: number; color: string; count: number }[];

  // For line chart: each subject is a point
  const maxScore = 20;
  const getX = (i: number) => padX + (i / Math.max(subjectAvgs.length - 1, 1)) * chartW;
  const getY = (score: number) => padY + chartH - (score / maxScore) * chartH;

  // Build polyline for each subject
  const linePoints = subjectAvgs.map((s, i) => `${getX(i)},${getY(s.avg)}`).join(' ');

  // Grid lines
  const gridYs = [0, 5, 10, 15, 20];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid lines */}
      {gridYs.map(score => (
        <g key={score}>
          <line x1={padX} y1={getY(score)} x2={width - padRight} y2={getY(score)} stroke="#e5e7eb" strokeWidth="0.5" />
          <text x={padX - 5} y={getY(score) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{score}</text>
        </g>
      ))}

      {/* Area fill under line */}
      <polygon
        points={`${getX(0)},${getY(0)} ${linePoints} ${getX(subjectAvgs.length - 1)},${getY(0)}`}
        fill="url(#areaGradient)"
        opacity="0.3"
      />

      {/* Main line */}
      <polyline points={linePoints} fill="none" stroke="#002366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots for each subject */}
      {subjectAvgs.map((s, i) => (
        <g key={s.subject}>
          <circle cx={getX(i)} cy={getY(s.avg)} r="4" fill={s.color} stroke="white" strokeWidth="2" />
          {/* Subject label */}
          <text x={getX(i)} y={height - 5} textAnchor="middle" fontSize="7" fill="#6b7280" fontWeight="600">
            {s.subject.length > 8 ? s.subject.slice(0, 7) + '.' : s.subject}
          </text>
          {/* Score label */}
          <text x={getX(i)} y={getY(s.avg) - 8} textAnchor="middle" fontSize="8" fill="#002366" fontWeight="700">
            {s.avg.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Gradient definition */}
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#002366" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#002366" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export const NotesScreenV2: React.FC = () => {
  const [allGrades, setAllGrades] = useState<any[]>([]);
  const [term, setTerm] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const loadGrades = useCallback(async () => {
    try {
      const res = await apiFetch('/parent/notes');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllGrades(data.map((n: any) => {
            let t: 'T1' | 'T2' | 'T3' = 'T1';
            const p = (n.evaluation?.periode?.libelle || '').toLowerCase();
            if (p.includes('2') || p.includes('deux')) t = 'T2';
            else if (p.includes('3') || p.includes('trois')) t = 'T3';
            return {
              id: String(n.id),
              childId: String(n.eleve_id),
              subject: n.evaluation?.matiere?.libelle || 'Matiere',
              title: n.evaluation?.titre || 'Evaluation',
              score: n.note ?? 0,
              max: n.evaluation?.note_sur || 20,
              date: n.evaluation?.date || '',
              term: t,
              coeff: n.evaluation?.coefficient || 1,
            };
          }));
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGrades(); }, [loadGrades]);

  // Unique subjects
  const subjects = useMemo(() => {
    const set = new Set(allGrades.map(g => g.subject));
    return Array.from(set);
  }, [allGrades]);

  // Filtered grades
  const filtered = useMemo(() => {
    return allGrades.filter(g => {
      const matchTerm = term === 'all' || g.term === term;
      const matchSubject = selectedSubject === 'all' || g.subject === selectedSubject;
      return matchTerm && matchSubject;
    });
  }, [allGrades, term, selectedSubject]);

  // Grades for chart (all subjects, selected period)
  const chartGrades = useMemo(() => {
    if (term === 'all') return allGrades;
    return allGrades.filter(g => g.term === term);
  }, [allGrades, term]);

  const getScoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 75) return 'text-emerald-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBg = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 75) return 'bg-emerald-50';
    if (pct >= 50) return 'bg-amber-50';
    return 'bg-rose-50';
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-[#375ca6] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto">
      <div className="pt-2 mb-4">
        <h1 className="text-lg font-bold text-[#00113a]">Notes</h1>
        <p className="text-xs text-gray-400">Suivi des performances scolaires</p>
      </div>

      {/* Period filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {[
          { key: 'all', label: 'Tous' },
          { key: 'T1', label: 'Trimestre 1' },
          { key: 'T2', label: 'Trimestre 2' },
          { key: 'T3', label: 'Trimestre 3' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTerm(t.key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              term === t.key ? 'bg-[#002366] text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-[#375ca6]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Subject filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedSubject('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
            selectedSubject === 'all' ? 'bg-[#375ca6] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Toutes
        </button>
        {subjects.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSubject(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              selectedSubject === s ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            style={selectedSubject === s ? { backgroundColor: getColor(s) } : {}}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#00113a]">Evolution par matiere</p>
          <p className="text-[10px] text-gray-400">
            {term === 'all' ? 'Tous trimestres' : `Trimestre ${term.replace('T', '')}`}
          </p>
        </div>
        <GradeChart grades={chartGrades} subjects={subjects} />

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          {subjects.slice(0, 5).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor(s) }} />
              <span className="text-[10px] text-gray-500 font-medium">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-semibold">Moyenne</p>
            <p className="text-lg font-extrabold text-[#002366]">
              {(filtered.reduce((s, g) => s + g.score, 0) / filtered.length).toFixed(1)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-semibold">Meilleure</p>
            <p className="text-lg font-extrabold text-emerald-600">
              {Math.max(...filtered.map(g => g.score))}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-semibold">Nb notes</p>
            <p className="text-lg font-extrabold text-gray-600">{filtered.length}</p>
          </div>
        </div>
      )}

      {/* Grade list */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Notes {selectedSubject !== 'all' ? `— ${selectedSubject}` : ''} {term !== 'all' ? `(${term})` : ''}
        </p>
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Aucune note pour ces filtres.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(grade => (
              <button
                key={grade.id}
                onClick={() => setSelected(grade)}
                className="w-full bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4 text-left hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl ${getScoreBg(grade.score, grade.max)} flex items-center justify-center`}>
                  <span className={`text-sm font-extrabold ${getScoreColor(grade.score, grade.max)}`}>
                    {grade.score}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{grade.subject}</p>
                  <p className="text-xs text-gray-400 truncate">{grade.title}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{grade.date} {grade.coeff > 1 ? `(coeff. ${grade.coeff})` : ''}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-extrabold ${getScoreColor(grade.score, grade.max)}`}>
                    {grade.score}
                  </span>
                  <span className="text-xs text-gray-300 font-bold">/{grade.max}</span>
                  <p className="text-[10px] text-gray-300">{grade.term}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-[10px] text-gray-300 mt-6 uppercase tracking-widest">
        Fin des resultats
      </p>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4 animate-slideUp">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{selected.subject}</p>
                <p className="text-base font-bold text-[#00113a] mt-1">{selected.title}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <span className="material-symbols-outlined text-gray-400">close</span>
              </button>
            </div>
            <div className="text-center py-4">
              <span className={`text-6xl font-extrabold ${getScoreColor(selected.score, selected.max)}`}>
                {selected.score}
              </span>
              <span className="text-2xl text-gray-300 font-bold">/{selected.max}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Date :</span><span className="font-bold text-gray-700">{selected.date}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Coefficient :</span><span className="font-bold text-gray-700">{selected.coeff}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Trimestre :</span><span className="font-bold text-gray-700">{selected.term}</span></div>
            </div>
            <button onClick={() => setSelected(null)} className="w-full py-3 bg-[#002366] text-white font-bold text-sm rounded-xl hover:bg-[#001a4d] transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
