import React from 'react';
import { ScreenType, EleveClasse } from '../../types';

interface Props { classeName: string; students: EleveClasse[]; onNavigate: (screen: ScreenType) => void; onSelectStudent: (student: EleveClasse) => void; }

export const ClassDetailsScreen: React.FC<Props> = ({ classeName, students, onNavigate, onSelectStudent }) => {
  const sorted = [...students].sort((a, b) => (a.rank || 999) - (b.rank || 999));
  const getRankBadge = (rank: number) => { if (rank === 1) return 'bg-amber-100 text-amber-700'; if (rank === 2) return 'bg-gray-100 text-gray-600'; if (rank === 3) return 'bg-orange-100 text-orange-600'; return 'bg-navy-50 text-navy-600'; };
  const getAvgColor = (avg?: number | null) => { if (!avg) return 'text-gray-400'; if (avg >= 16) return 'text-emerald-600'; if (avg >= 14) return 'text-green-600'; if (avg >= 10) return 'text-amber-600'; return 'text-rose-600'; };

  return (
    <div className="p-4 lg:p-8 pb-24 space-y-6">
      <div>
        <button onClick={() => onNavigate('dashboard')} className="text-xs text-gray-400 hover:text-navy-800 transition-colors flex items-center gap-1 mb-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Retour</button>
        <h2 className="text-xl font-bold text-gray-900">{classeName ? `Classe — ${classeName}` : 'Tous les eleves'}</h2>
        <p className="text-gray-400 text-sm mt-1">{students.length} eleve{students.length > 1 ? 's' : ''}</p>
      </div>
      {students.length > 0 ? (
        <div className="bg-white rounded-xl border border-navy-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-navy-100 bg-navy-50">
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 w-12">#</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Eleve</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 w-24">Moyenne</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 w-20">Profil</th>
            </tr></thead>
            <tbody>
              {sorted.map((student, index) => { const rank = student.rank || index + 1; return (
                <tr key={student.id} onClick={() => onSelectStudent(student)} className="border-b border-violet-50 hover:bg-navy-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3.5"><span className={`w-8 h-8 rounded-lg ${getRankBadge(rank)} flex items-center justify-center text-xs font-bold`}>{rank}</span></td>
                  <td className="px-4 py-3.5"><p className="font-semibold text-sm text-gray-900">{student.nom_complet || `${student.prenom} ${student.nom}`}</p></td>
                  <td className="px-4 py-3.5 text-center"><span className={`font-bold ${getAvgColor(student.moyenne)}`}>{student.moyenne ? student.moyenne.toFixed(1) : '&mdash;'}</span></td>
                  <td className="px-4 py-3.5 text-center"><div className="w-8 h-8 bg-navy-50 text-navy-600 rounded-lg flex items-center justify-center hover:bg-navy-100 transition-colors mx-auto"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div></td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      ) : <div className="text-center py-20 bg-white rounded-xl border border-navy-100"><svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg><p className="text-gray-400">Aucun eleve trouve</p></div>}
    </div>
  );
};

