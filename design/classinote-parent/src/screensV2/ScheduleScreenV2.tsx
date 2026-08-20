import React, { useState } from 'react';
import { TimetableClass } from '../types';

interface Props {
  timetable: TimetableClass[];
  onMessageTeacher: (name: string) => void;
}

export const ScheduleScreenV2: React.FC<Props> = ({ timetable, onMessageTeacher }) => {
  const [day, setDay] = useState<'LUN' | 'MAR' | 'MER' | 'JEU' | 'VEN'>('LUN');

  const days = [
    { code: 'LUN' as const, num: 14, label: 'Lun' },
    { code: 'MAR' as const, num: 15, label: 'Mar' },
    { code: 'MER' as const, num: 16, label: 'Mer' },
    { code: 'JEU' as const, num: 17, label: 'Jeu' },
    { code: 'VEN' as const, num: 18, label: 'Ven' },
  ];

  const classes = timetable.filter(c => c.day === day);

  const getSubjectColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('math')) return { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' };
    if (s.includes('fran') || s.includes('litt')) return { bg: 'bg-rose-50', border: 'border-l-rose-500', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700' };
    if (s.includes('svt') || s.includes('scien')) return { bg: 'bg-emerald-50', border: 'border-l-emerald-500', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' };
    if (s.includes('hist') || s.includes('geo')) return { bg: 'bg-amber-50', border: 'border-l-amber-500', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' };
    if (s.includes('ang')) return { bg: 'bg-purple-50', border: 'border-l-purple-500', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700' };
    if (s.includes('eps') || s.includes('sport')) return { bg: 'bg-teal-50', border: 'border-l-teal-500', text: 'text-teal-800', badge: 'bg-teal-100 text-teal-700' };
    if (s.includes('tech') || s.includes('info')) return { bg: 'bg-indigo-50', border: 'border-l-indigo-500', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700' };
    if (s.includes('art') || s.includes('musiq')) return { bg: 'bg-violet-50', border: 'border-l-violet-500', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-700' };
    return { bg: 'bg-gray-50', border: 'border-l-gray-400', text: 'text-gray-800', badge: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto">
      <div className="pt-2 mb-4">
        <h1 className="text-lg font-bold text-[#00113a]">Emploi du temps</h1>
        <p className="text-xs text-gray-400">Semaine du 14 Octobre</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {days.map(d => {
          const active = day === d.code;
          return (
            <button key={d.code} onClick={() => setDay(d.code)}
              className={`flex flex-col items-center min-w-[56px] py-2.5 rounded-xl transition-all ${active ? 'bg-[#002366] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}>
              <span className="text-[10px] font-bold uppercase">{d.label}</span>
              <span className="text-lg font-extrabold mt-0.5">{d.num}</span>
            </button>
          );
        })}
      </div>

      {/* Schedule list */}
      {classes.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Aucun cours ce jour.</div>
      ) : (
        <div className="space-y-3">
          {classes.map(cls => {
            const colors = getSubjectColor(cls.subject);
            return (
              <div key={cls.id} className={`${colors.bg} rounded-2xl p-4 border-l-4 ${colors.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-bold ${colors.text}`}>{cls.subject}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>{cls.room}</span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {cls.startTime} — {cls.endTime}
                </p>
                <button onClick={() => onMessageTeacher(cls.teacherName)} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                  <div className="w-7 h-7 rounded-full bg-[#002366] text-white flex items-center justify-center text-[10px] font-bold">
                    {cls.teacherName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <span className="text-xs font-bold text-gray-700">{cls.teacherName}</span>
                  <span className="material-symbols-outlined text-gray-300 text-sm ml-auto">chat_bubble</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
