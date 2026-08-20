import React, { useState } from 'react';
import { TimetableClass } from '../types';
import { Avatar } from '../components/Avatar';

interface ScheduleScreenProps {
  timetable: TimetableClass[];
  onMessageTeacher: (teacherName: string) => void;
}

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ timetable, onMessageTeacher }) => {
  const [selectedDay, setSelectedDay] = useState<'LUN' | 'MAR' | 'MER' | 'JEU' | 'VEN'>('LUN');

  const daysList = [
    { code: 'LUN' as const, num: 14, label: 'LUN' },
    { code: 'MAR' as const, num: 15, label: 'MAR' },
    { code: 'MER' as const, num: 16, label: 'MER' },
    { code: 'JEU' as const, num: 17, label: 'JEU' },
    { code: 'VEN' as const, num: 18, label: 'VEN' },
  ];

  const classesForDay = timetable.filter((item) => item.day === selectedDay);

  return (
    <div className="space-y-5 pb-24 px-4 sm:px-5 max-w-lg mx-auto animate-fadeIn">
      {/* Title */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Emploi du temps</h1>
        <p className="text-xs text-[#757682] mt-0.5">Semaine du 14 Octobre 2024</p>
      </div>

      {/* Day Selector Bar */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {daysList.map((d) => {
          const isActive = selectedDay === d.code;
          return (
            <button
              key={d.code}
              onClick={() => setSelectedDay(d.code)}
              className={`flex flex-col items-center justify-center min-w-[64px] py-3.5 rounded-2xl transition-all ${
                isActive
                  ? 'bg-[#002366] text-white shadow-md scale-102'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-[#375ca6]'
              }`}
            >
              <span className={`text-[10px] font-bold tracking-wider ${isActive ? 'opacity-80' : ''}`}>
                {d.label}
              </span>
              <span className="text-lg font-bold mt-0.5">{d.num}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline List */}
      <div className="relative space-y-4 pt-2">
        {/* Timeline vertical guide line */}
        <div className="absolute left-6 top-3 bottom-3 w-px bg-slate-200" />

        {classesForDay.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6">
            <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
            <p className="text-xs text-slate-500 font-medium mt-2">Aucun cours programmé ce jour-là.</p>
          </div>
        ) : (
          classesForDay.map((cls, idx) => {
            const isLunchBreakSlot = idx === 2 && selectedDay === 'LUN';

            return (
              <React.Fragment key={cls.id}>
                {isLunchBreakSlot && (
                  <div className="relative flex gap-6 items-center py-2 z-10">
                    <div className="w-12 text-center" />
                    <div className="flex-1 h-px border-t border-dashed border-slate-300 flex items-center justify-center relative">
                      <span className="absolute px-3 bg-[#f8f9ff] text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                        PAUSE DÉJEUNER
                      </span>
                    </div>
                  </div>
                )}

                <div className="relative flex gap-4 sm:gap-6 z-10">
                  {/* Time bullet */}
                  <div className="flex flex-col items-center shrink-0 w-12">
                    <div className="bg-[#00113a] w-3 h-3 rounded-full mt-5 ring-4 ring-[#f8f9ff]" />
                    <span className="text-[11px] font-semibold text-slate-500 mt-1 bg-[#f8f9ff] px-1">
                      {cls.startTime}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div
                    className={`flex-1 ${cls.bgColor} p-4 sm:p-5 rounded-[24px] shadow-card border-l-8 ${cls.borderLeftColor} transition-transform hover:scale-101`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-base font-bold ${cls.textColor}`}>{cls.subject}</h3>
                      <span className={`${cls.badgeBg} ${cls.badgeText} text-[11px] font-semibold px-3 py-1 rounded-full`}>
                        {cls.room}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3">
                      <span className={`material-symbols-outlined text-xs ${cls.badgeText}`}>schedule</span>
                      <span className={`text-xs font-medium ${cls.badgeText}`}>
                        {cls.startTime} - {cls.endTime}
                      </span>
                    </div>

                    <div
                      onClick={() => onMessageTeacher(cls.teacherName)}
                      className="flex items-center gap-2.5 pt-1 cursor-pointer group"
                      title="Contacter l'enseignant"
                    >
                      <Avatar name={cls.teacherName} size="sm" />
                      <span className={`text-xs font-bold ${cls.textColor} group-hover:underline`}>
                        {cls.teacherName}
                      </span>
                      <span className="material-symbols-outlined text-xs opacity-60 ml-auto text-slate-500">
                        chat_bubble
                      </span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
