import React, { useState } from 'react';
import { StaffMember } from '../types';
import { Avatar } from '../components/Avatar';

interface TeamScreenProps {
  staffMembers: StaffMember[];
  onOpenMessageModal: (member: StaffMember) => void;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({
  staffMembers,
  onOpenMessageModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const administration = staffMembers.filter((s) => s.category === 'administration');
  const teachers = staffMembers.filter((s) => {
    if (s.category !== 'enseignants') return false;
    if (!searchTerm) return true;
    return (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.classes && s.classes.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  });

  return (
    <div className="space-y-6 pb-28 px-4 sm:px-5 max-w-lg mx-auto animate-fadeIn relative">
      {/* Header */}
      <div className="pt-2">
        <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Messagerie & Équipe</h2>
        <p className="text-xs text-[#757682] mt-0.5">
          Discutez directement avec l'administration et les enseignants de votre enfant.
        </p>
      </div>

      {/* Administration Section */}
      <section className="space-y-3">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-base font-bold text-[#00113a]">Administration</h3>
        </div>

        <div className="space-y-3">
          {administration.map((admin, index) => {
            const leftBarColors = ['bg-[#002366]', 'bg-[#375ca6]', 'bg-[#8dafff]'];
            const barColor = leftBarColors[index % leftBarColors.length];
            const hasUnread = admin.unreadCount && admin.unreadCount > 0;

            return (
              <div
                key={admin.id}
                onClick={() => onOpenMessageModal(admin)}
                className={`bg-white shadow-card rounded-[24px] p-4 sm:p-5 flex items-center gap-4 relative overflow-hidden border transition-all cursor-pointer hover:shadow-md ${
                  hasUnread ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20' : 'border-slate-100/80'
                }`}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 h-full w-1.5 ${hasUnread ? 'bg-rose-500' : barColor}`} />

                <div className="relative shrink-0">
                  <Avatar name={admin.name} size="lg" variant="rounded" />
                  {hasUnread ? (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce border-2 border-white">
                      {admin.unreadCount}
                    </span>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#0b1c30] truncate">{admin.name}</h4>
                        {hasUnread && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                            {admin.unreadCount} msg
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-[#375ca6] uppercase tracking-wider">
                        {admin.subtitle}
                      </p>
                    </div>
                    <span className="bg-[#e5eeff] text-[#00174a] text-[10px] font-bold px-2.5 py-0.5 rounded-md shrink-0">
                      {admin.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-50 text-xs text-slate-500">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate">
                      <span className="material-symbols-outlined text-sm text-[#375ca6]">mail</span>
                      <span className="truncate">{admin.email}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMessageModal(admin);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ml-auto shrink-0 ${
                        hasUnread
                          ? 'bg-rose-600 text-white shadow-xs hover:bg-rose-700'
                          : 'bg-[#f8f9ff] text-[#375ca6] hover:bg-[#e5eeff]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">chat</span>
                      <span>{hasUnread ? 'Discuter' : 'Message'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Teachers Section */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-[#00113a]">Enseignants</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearching(!isSearching)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
              title="Rechercher"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
          </div>
        </div>

        {isSearching && (
          <div className="animate-slideDown">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, matière, classe..."
              className="w-full h-10 px-4 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#375ca6]"
              autoFocus
            />
          </div>
        )}

        <div className="space-y-3">
          {teachers.map((teacher, index) => {
            const leftBarColors = ['bg-[#002366]', 'bg-[#8dafff]', 'bg-[#375ca6]', 'bg-slate-400'];
            const barColor = leftBarColors[index % leftBarColors.length];
            const hasUnread = teacher.unreadCount && teacher.unreadCount > 0;

            return (
              <div
                key={teacher.id}
                onClick={() => onOpenMessageModal(teacher)}
                className={`bg-white shadow-card rounded-[24px] p-4 sm:p-5 flex items-center gap-4 relative overflow-hidden border transition-all cursor-pointer hover:shadow-md ${
                  hasUnread ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20' : 'border-slate-100/80'
                }`}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 h-full w-1.5 ${hasUnread ? 'bg-rose-500' : barColor}`} />

                <div className="relative shrink-0">
                  <Avatar name={teacher.name} size="lg" variant="rounded" />
                  {hasUnread ? (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce border-2 border-white">
                      {teacher.unreadCount}
                    </span>
                  ) : null}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#0b1c30]">{teacher.name}</h4>
                        {hasUnread && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                            {teacher.unreadCount} message{teacher.unreadCount! > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-[#375ca6] uppercase tracking-wider">
                        {teacher.subtitle}
                      </p>
                    </div>
                    {teacher.classes && (
                      <span className="bg-[#e5eeff] text-[#00174a] text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                        {teacher.classes.join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-50 text-xs text-slate-500">
                    {teacher.days && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        <span>{teacher.days.join(', ')}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMessageModal(teacher);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ml-auto ${
                        hasUnread
                          ? 'bg-rose-600 text-white shadow-xs hover:bg-rose-700'
                          : 'bg-[#f8f9ff] text-[#375ca6] hover:bg-[#e5eeff]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">chat</span>
                      <span>{hasUnread ? 'Discuter' : 'Message'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => onOpenMessageModal(administration[0])}
        className="fixed right-5 bottom-20 w-13 h-13 bg-[#002366] text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-[#00113a] transition-transform active:scale-90 z-30"
        title="Nouveau message"
      >
        <span className="material-symbols-outlined text-2xl filled-icon">add_comment</span>
      </button>
    </div>
  );
};

