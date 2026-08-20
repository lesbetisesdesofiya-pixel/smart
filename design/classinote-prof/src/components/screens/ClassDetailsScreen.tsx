import React from 'react';
import { ScreenType } from '../../types';

interface Student {
  id: number;
  nom: string;
  prenom: string;
  nom_complet?: string;
  matricule?: string;
  average?: number;
  rank?: number;
}

interface ClassDetailsScreenProps {
  classeName: string;
  students: Student[];
  onNavigate: (screen: ScreenType) => void;
  onSelectStudent: (student: Student) => void;
}

export const ClassDetailsScreen: React.FC<ClassDetailsScreenProps> = ({
  classeName,
  students,
  onNavigate,
  onSelectStudent,
}) => {
  const sortedStudents = [...students].sort((a, b) => (a.rank || 999) - (b.rank || 999));

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🥇' };
    if (rank === 2) return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '🥈' };
    if (rank === 3) return { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🥉' };
    return { bg: 'bg-surface-variant', text: 'text-on-surface-variant', icon: '' };
  };

  const getAvgColor = (avg?: number) => {
    if (!avg) return 'text-on-surface-variant';
    if (avg >= 16) return 'text-green-600';
    if (avg >= 14) return 'text-emerald-600';
    if (avg >= 10) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-10 mt-6 pb-32">
      {/* DEBUG */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs font-mono space-y-1">
        <p><strong>DEBUG ClassDetailsScreen</strong></p>
        <p>classeName: {classeName}</p>
        <p>students.length: {students.length}</p>
        <p>students type: {typeof students}</p>
        <p>isArray: {Array.isArray(students) ? 'yes' : 'no'}</p>
        {students.length > 0 && <p>first: {JSON.stringify(students[0])}</p>}
      </div>

      <section className="mb-6">
        <nav className="flex items-center text-xs font-medium text-on-surface-variant mb-2">
          <span className="cursor-pointer hover:underline" onClick={() => onNavigate('dashboard')}>Dashboard</span>
          <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
          <span className="text-primary font-bold">{classeName}</span>
        </nav>
        <h2 className="text-2xl md:text-3xl font-bold text-primary">
          {classeName ? `Élèves — ${classeName}` : 'Tous les élèves'}
        </h2>
        <p className="text-on-surface-variant text-xs mt-1">{students.length} élève{students.length > 1 ? 's' : ''}</p>
      </section>

      {students.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-variant/50">
                <th className="text-left px-5 py-3 text-xs font-bold text-on-surface w-12">#</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-on-surface">Élève</th>
                <th className="text-center px-5 py-3 text-xs font-bold text-on-surface w-24">Moyenne</th>
                <th className="text-center px-5 py-3 text-xs font-bold text-on-surface w-20">Profil</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student, index) => {
                const rank = student.rank || index + 1;
                const badge = getRankBadge(rank);
                return (
                  <tr key={student.id} className="border-b border-outline-variant/50 hover:bg-surface-variant/30 transition-colors cursor-pointer" onClick={() => onSelectStudent(student)}>
                    <td className="px-5 py-3.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${badge.bg} ${badge.text}`}>
                        {badge.icon || rank}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-sm text-on-surface">{student.nom_complet || `${student.prenom} ${student.nom}`}</p>
                      {student.matricule && <p className="text-[11px] text-on-surface-variant mt-0.5">{student.matricule}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`font-bold ${getAvgColor(student.average)}`}>
                        {student.average ? student.average.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-lg">person</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-outline-variant">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-2">group</span>
          <p className="text-on-surface-variant">Aucun élève trouvé</p>
        </div>
      )}
    </main>
  );
};
