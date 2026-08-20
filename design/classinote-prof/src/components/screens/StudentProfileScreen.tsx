import React, { useState, useMemo } from 'react';
import { ScreenType } from '../../types';

interface EvolutionNote {
  id: number;
  note: number;
  evaluation: {
    id: number;
    titre: string;
    type: string;
    coefficient: number;
    date: string;
    matiere: { id: number; libelle: string };
    periode: { id: number; libelle: string } | null;
  };
}

interface StudentData {
  id: number;
  nom: string;
  prenom: string;
  nom_complet?: string;
  moyenne?: number;
  nb_notes?: number;
  rank?: number;
  classeName?: string;
  totalStudents?: number;
  evolution?: EvolutionNote[];
}

interface StudentProfileScreenProps {
  student: StudentData;
  onNavigate: (screen: ScreenType) => void;
}

export const StudentProfileScreen: React.FC<StudentProfileScreenProps> = ({
  student,
  onNavigate,
}) => {
  const [selectedTrimester, setSelectedTrimester] = useState<string>('all');

  const evolution: EvolutionNote[] = student.evolution || [];

  const gradeHistory = useMemo(() => {
    return evolution.map(n => ({
      id: n.id,
      subject: n.evaluation.matiere?.libelle || '—',
      title: n.evaluation.titre,
      date: new Date(n.evaluation.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      trimester: n.evaluation.periode?.libelle || 'Non défini',
      coefficient: n.evaluation.coefficient,
      grade: n.note,
      status: n.note >= 14 ? 'Excellent' : n.note >= 10 ? 'Validé' : 'Insuffisant',
    }));
  }, [evolution]);

  const trimesters = useMemo(() => {
    const set = new Set(gradeHistory.map(g => g.trimester));
    return ['all', ...Array.from(set)];
  }, [gradeHistory]);

  const filteredGrades = useMemo(() => {
    if (selectedTrimester === 'all') return gradeHistory;
    return gradeHistory.filter(g => g.trimester === selectedTrimester);
  }, [selectedTrimester, gradeHistory]);

  const stats = useMemo(() => {
    if (filteredGrades.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
    const grades = filteredGrades.map(g => g.grade);
    return {
      avg: Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10,
      min: Math.min(...grades),
      max: Math.max(...grades),
      count: grades.length,
    };
  }, [filteredGrades]);

  const svgWidth = 700;
  const svgHeight = 220;
  const pL = 45, pR = 30, pT = 25, pB = 40;
  const cW = svgWidth - pL - pR;
  const cH = svgHeight - pT - pB;

  const points = useMemo(() => {
    return filteredGrades.map((item, idx) => {
      const x = pL + (filteredGrades.length > 1 ? idx * (cW / (filteredGrades.length - 1)) : cW / 2);
      const y = pT + cH - (item.grade / 20) * cH;
      return { x, y, item, index: idx };
    });
  }, [filteredGrades, cW, cH]);

  const lineD = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return points.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      const prev = points[i - 1];
      const cpX = prev.x + (point.x - prev.x) / 2;
      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
    }, '');
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    return `${lineD} L ${points[points.length - 1].x} ${pT + cH} L ${points[0].x} ${pT + cH} Z`;
  }, [lineD, points, cH]);

  const studentName = student.nom_complet || `${student.prenom} ${student.nom}`;
  const initials = student.prenom?.[0] + student.nom?.[0] || '??';

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-10 py-6 space-y-6 pb-32">
      {/* Header */}
      <section className="bg-white rounded-2xl p-4 shadow-xs border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0 bg-primary-fixed text-primary font-bold text-lg sm:text-xl flex items-center justify-center border border-outline-variant/40">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-primary">{studentName}</h2>
              {student.rank && (
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[11px] font-bold">
                  Rang: {student.rank}
                </span>
              )}
            </div>
            {student.classeName && (
              <p className="text-xs text-on-surface-variant mt-0.5">Classe: <strong className="text-on-surface">{student.classeName}</strong></p>
            )}
          </div>
        </div>
        <button onClick={() => onNavigate('class_details')} className="px-4 py-2 bg-surface-variant text-on-surface-variant rounded-xl text-xs font-bold hover:bg-surface-variant/80 transition-all cursor-pointer flex items-center gap-1">
          <span className="material-symbols-outlined text-base">arrow_back</span> Retour
        </button>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-outline-variant text-center">
          <p className="text-2xl font-bold text-primary">{stats.avg || '—'}</p>
          <p className="text-[11px] text-on-surface-variant">Moyenne</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant text-center">
          <p className="text-2xl font-bold text-green-600">{stats.max || '—'}</p>
          <p className="text-[11px] text-on-surface-variant">Meilleure</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant text-center">
          <p className="text-2xl font-bold text-red-600">{stats.min || '—'}</p>
          <p className="text-[11px] text-on-surface-variant">Plus basse</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant text-center">
          <p className="text-2xl font-bold text-on-surface">{stats.count}</p>
          <p className="text-[11px] text-on-surface-variant">Notes</p>
        </div>
      </div>

      {/* Chart */}
      {filteredGrades.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-outline-variant overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[400px]">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 5, 10, 15, 20].map(v => {
              const y = pT + cH - (v / 20) * cH;
              return (
                <g key={v}>
                  <line x1={pL} y1={y} x2={svgWidth - pR} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
                  <text x={pL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{v}</text>
                </g>
              );
            })}
            <path d={areaD} fill="url(#areaGrad)" />
            <path d={lineD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#10b981">{p.item.grade}</text>
                <text x={p.x} y={pT + cH + 20} textAnchor="middle" fontSize="8" fill="#9ca3af">{p.item.date}</text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Trimester Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {trimesters.map(t => (
          <button key={t} onClick={() => setSelectedTrimester(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedTrimester === t ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-variant'
            }`}>
            {t === 'all' ? 'Tout' : t}
          </button>
        ))}
      </div>

      {/* Grade List */}
      <div className="space-y-2">
        {filteredGrades.map(g => {
          const color = g.grade >= 14 ? 'text-green-600' : g.grade >= 10 ? 'text-amber-600' : 'text-red-600';
          return (
            <div key={g.id} className="bg-white p-4 rounded-xl border border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${color} bg-surface-variant/50`}>
                  {g.grade}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{g.title}</p>
                  <p className="text-[11px] text-on-surface-variant">{g.subject} · {g.date} · Coeff. {g.coefficient}</p>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${g.status === 'Excellent' ? 'bg-green-50 text-green-700' : g.status === 'Validé' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                {g.status}
              </span>
            </div>
          );
        })}
        {filteredGrades.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-outline-variant">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">bar_chart</span>
            <p className="text-sm text-on-surface-variant">Aucune note enregistrée</p>
          </div>
        )}
      </div>
    </main>
  );
};
