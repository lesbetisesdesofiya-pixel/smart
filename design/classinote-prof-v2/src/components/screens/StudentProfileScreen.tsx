import React, { useState, useMemo } from 'react';
import { ScreenType, StudentData, EvolutionNote } from '../../types';

interface Props { student: StudentData; onNavigate: (screen: ScreenType) => void; }

export const StudentProfileScreen: React.FC<Props> = ({ student, onNavigate }) => {
  const [selectedTrimester, setSelectedTrimester] = useState<string>('all');
  const evolution: EvolutionNote[] = student.evolution || [];
  const gradeHistory = useMemo(() => evolution.map(n => ({ id: n.id, subject: n.evaluation.matiere?.libelle || '—', title: n.evaluation.titre, date: new Date(n.evaluation.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), trimester: n.evaluation.periode?.libelle || 'Non defini', coefficient: n.evaluation.coefficient, grade: n.note, status: n.note >= 14 ? 'Excellent' : n.note >= 10 ? 'Valide' : 'Insuffisant' as string })), [evolution]);
  const trimesters = useMemo(() => ['all', ...Array.from(new Set(gradeHistory.map(g => g.trimester)))], [gradeHistory]);
  const filteredGrades = useMemo(() => selectedTrimester === 'all' ? gradeHistory : gradeHistory.filter(g => g.trimester === selectedTrimester), [selectedTrimester, gradeHistory]);
  const stats = useMemo(() => { if (filteredGrades.length === 0) return { avg: 0, min: 0, max: 0, count: 0 }; const grades = filteredGrades.map(g => g.grade); return { avg: Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10, min: Math.min(...grades), max: Math.max(...grades), count: grades.length }; }, [filteredGrades]);
  const svgW = 700, svgH = 200, pL = 40, pR = 20, pT = 20, pB = 35;
  const cW = svgW - pL - pR, cH = svgH - pT - pB;
  const points = useMemo(() => filteredGrades.map((item, idx) => ({ x: pL + (filteredGrades.length > 1 ? idx * (cW / (filteredGrades.length - 1)) : cW / 2), y: pT + cH - (item.grade / 20) * cH, item, index: idx })), [filteredGrades, cW, cH]);
  const lineD = useMemo(() => points.length === 0 ? '' : points.length === 1 ? `M ${points[0].x} ${points[0].y}` : points.reduce((acc, point, i) => { if (i === 0) return `M ${point.x} ${point.y}`; const prev = points[i - 1]; const cpX = prev.x + (point.x - prev.x) / 2; return `${acc} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`; }, ''), [points]);
  const areaD = useMemo(() => points.length === 0 ? '' : `${lineD} L ${points[points.length - 1].x} ${pT + cH} L ${points[0].x} ${pT + cH} Z`, [lineD, points, cH]);
  const studentName = student.nom_complet || `${student.prenom} ${student.nom}`;
  const initials = student.prenom?.[0] + student.nom?.[0] || '??';

  return (
    <div className="p-4 lg:p-8 pb-24 space-y-6">
      <section className="bg-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-navy-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-navy-800 to-navy-500 flex items-center justify-center text-white text-xl font-bold shrink-0">{initials}</div>
          <div><div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold text-gray-900">{studentName}</h2>{student.rank && <span className="px-2.5 py-0.5 bg-navy-100 text-navy-800 rounded-full text-[11px] font-bold">Rang: {student.rank}</span>}</div>{student.classeName && <p className="text-xs text-gray-400 mt-0.5">Classe: <strong className="text-gray-700">{student.classeName}</strong></p>}</div>
        </div>
        <button onClick={() => onNavigate('class_details')} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all cursor-pointer flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Retour</button>
      </section>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 text-center border border-navy-100 shadow-sm"><p className="text-2xl font-bold gradient-text">{stats.avg || '&mdash;'}</p><p className="text-[11px] text-gray-400">Moyenne</p></div>
        <div className="bg-white rounded-xl p-4 text-center border border-navy-100 shadow-sm"><p className="text-2xl font-bold text-emerald-600">{stats.max || '&mdash;'}</p><p className="text-[11px] text-gray-400">Meilleure</p></div>
        <div className="bg-white rounded-xl p-4 text-center border border-navy-100 shadow-sm"><p className="text-2xl font-bold text-rose-600">{stats.min || '&mdash;'}</p><p className="text-[11px] text-gray-400">Plus basse</p></div>
        <div className="bg-white rounded-xl p-4 text-center border border-navy-100 shadow-sm"><p className="text-2xl font-bold text-gray-900">{stats.count}</p><p className="text-[11px] text-gray-400">Notes</p></div>
      </div>
      {filteredGrades.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-navy-100 shadow-sm overflow-x-auto">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto min-w-[350px]">
            <defs><linearGradient id="areaGradV2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" /></linearGradient></defs>
            {[0, 5, 10, 15, 20].map(v => { const y = pT + cH - (v / 20) * cH; return (<g key={v}><line x1={pL} y1={y} x2={svgW - pR} y2={y} stroke="#e5e7eb" strokeWidth="0.5" /><text x={pL - 8} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{v}</text></g>); })}
            <path d={areaD} fill="url(#areaGradV2)" /><path d={lineD} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
            {points.map((p, i) => (<g key={i}><circle cx={p.x} cy={p.y} r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" /><text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#7c3aed">{p.item.grade}</text><text x={p.x} y={pT + cH + 18} textAnchor="middle" fontSize="7" fill="#9ca3af">{p.item.date}</text></g>))}
          </svg>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">{trimesters.map(t => (<button key={t} onClick={() => setSelectedTrimester(t)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedTrimester === t ? 'bg-navy-800 text-white shadow-md' : 'bg-white text-gray-500 border border-navy-100 hover:border-navy-200'}`}>{t === 'all' ? 'Tout' : t}</button>))}</div>
      <div className="space-y-2">
        {filteredGrades.map(g => { const color = g.grade >= 14 ? 'text-emerald-600' : g.grade >= 10 ? 'text-amber-600' : 'text-rose-600'; const statusColor = g.status === 'Excellent' ? 'bg-emerald-50 text-emerald-700' : g.status === 'Valide' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'; return (
          <div key={g.id} className="bg-white rounded-xl p-4 flex items-center justify-between border border-navy-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 min-w-0"><div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${color} bg-navy-50`}>{g.grade}</div><div className="min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{g.title}</p><p className="text-[11px] text-gray-400">{g.subject} &middot; {g.date} &middot; Coeff. {g.coefficient}</p></div></div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${statusColor}`}>{g.status}</span>
          </div>); })}
        {filteredGrades.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-navy-100"><svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg><p className="text-sm text-gray-400">Aucune note enregistree</p></div>}
      </div>
    </div>
  );
};

