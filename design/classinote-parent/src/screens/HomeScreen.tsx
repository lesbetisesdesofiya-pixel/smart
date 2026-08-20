import React from 'react';
import { NavigationTab, Parent, Child, Grade, Notice } from '../types';
import { Avatar } from '../components/Avatar';

interface HomeScreenProps {
  parent: Parent;
  activeChild: Child;
  latestGrade?: Grade;
  latestNotice?: Notice;
  onNavigate: (tab: NavigationTab) => void;
  onOpenChildSelector: () => void;
  onSelectChild: (childId: string) => void;
  onAddChild: () => void;
  onOpenAttendance: () => void;
  staffAvatars: string[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  parent,
  activeChild,
  latestGrade,
  latestNotice,
  onNavigate,
  onOpenChildSelector,
  onSelectChild,
  onAddChild,
  onOpenAttendance,
  staffAvatars,
}) => {
  return (
    <div className="space-y-4 pb-24 px-4 sm:px-5 max-w-lg mx-auto animate-fadeIn">
      {/* All Children Toggle Bar + Plus Button */}
      <section className="bg-white p-3.5 sm:p-4 rounded-[24px] shadow-card border border-slate-100/90 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#375ca6] text-xl">face</span>
            <h3 className="text-xs font-bold text-[#00113a] uppercase tracking-wider">
              Mes Enfants ({parent.children.length})
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#375ca6] cursor-pointer hover:underline" onClick={onOpenChildSelector}>
            Gérer
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          {parent.children.map((child) => {
            const isActive = child.id === activeChild.id;
            return (
              <button
                key={child.id}
                onClick={() => onSelectChild(child.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer border shrink-0 text-left active:scale-95 ${
                  isActive
                    ? 'bg-[#002366] text-white border-[#002366] shadow-md ring-2 ring-[#002366]/20'
                    : 'bg-[#f8f9ff] text-slate-700 border-slate-200/80 hover:border-[#375ca6] hover:bg-white'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={child.name} size="sm" />
                  {isActive && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white" />
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold leading-snug whitespace-nowrap ${isActive ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {child.name.split(' ')[0]}
                    </span>
                    {isActive && (
                      <span className="material-symbols-outlined text-xs text-blue-200">check_circle</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-200' : 'text-[#757682]'}`}>
                    {child.class}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Plus Button to Add Child */}
          <button
            onClick={onAddChild}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#e5eeff] text-[#002366] hover:bg-[#dce9ff] border border-dashed border-[#375ca6]/40 transition-all cursor-pointer shrink-0 font-bold text-xs shadow-xs active:scale-95"
            title="Ajouter un enfant via QR Code"
          >
            <div className="w-8 h-8 rounded-full bg-[#002366] text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-xl">add</span>
            </div>
            <span className="whitespace-nowrap font-bold text-[#00113a]">Ajouter</span>
          </button>
        </div>
      </section>

      {/* Dashboard Hero / Status Card */}
      <section className="bg-[#002366] p-5 sm:p-6 rounded-[24px] text-[#758dd5] relative overflow-hidden shadow-lg">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Tout va bien !</h2>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Présent(e)
            </span>
          </div>
          <p className="text-white/80 text-xs leading-relaxed mt-1">
            {activeChild.name} est présent(e) en classe aujourd'hui. Prochain cours : {activeChild.nextCourse}.
          </p>

          {/* Quick Action Button for Absences & Présences */}
          <button
            onClick={onOpenAttendance}
            className="mt-3.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-base text-emerald-300">fact_check</span>
            <span>Voir absences & présences</span>
            <span className="material-symbols-outlined text-sm ml-auto opacity-70">chevron_right</span>
          </button>
        </div>
        {/* Abstract background blur circles */}
        <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-[#375ca6] rounded-full opacity-20 blur-2xl" />
      </section>

      {/* Recent Activities: Latest Grade */}
      <section className="space-y-2.5">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-bold text-[#0b1c30]">Dernières Notes</h3>
          <button
            onClick={() => onNavigate('notes')}
            className="text-xs font-semibold text-[#375ca6] uppercase tracking-wider hover:underline"
          >
            VOIR TOUT
          </button>
        </div>
        {latestGrade ? (
          <div
            onClick={() => onNavigate('notes')}
            className="bg-white p-5 rounded-[24px] shadow-card border border-slate-100 flex items-center justify-between cursor-pointer hover:border-[#375ca6]/30 transition-all active:scale-98"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#8dafff]/30 flex items-center justify-center text-[#144089] shrink-0">
                <span className="material-symbols-outlined text-[28px] filled-icon">calculate</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#0b1c30]">{latestGrade.subject}</h4>
                <p className="text-xs text-slate-500">{latestGrade.title}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-[#00113a]">
                {latestGrade.score}/{latestGrade.maxScore}
              </span>
            </div>
          </div>
        ) : null}
      </section>

      {/* Recent Activities: Latest Notice */}
      <section className="space-y-2.5">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-bold text-[#0b1c30]">Avis récents</h3>
          <button
            onClick={() => onNavigate('avis')}
            className="text-xs font-semibold text-[#375ca6] uppercase tracking-wider hover:underline"
          >
            VOIR TOUT
          </button>
        </div>
        {latestNotice ? (
          <div
            onClick={() => onNavigate('avis')}
            className="bg-white p-5 rounded-[24px] shadow-card border border-slate-100 cursor-pointer hover:border-[#375ca6]/30 transition-all active:scale-98"
          >
            <div className="flex items-start gap-3">
              <Avatar name={latestNotice.authorName} size="md" />
              <div className="space-y-1 flex-1">
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold text-[#00113a]">{latestNotice.authorName}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{latestNotice.date}</span>
                </div>
                <p className="text-xs text-[#0b1c30] leading-snug italic line-clamp-2">
                  "{latestNotice.content}"
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Main Menu Bento Grid */}
      <section className="space-y-2.5 pt-1">
        <h3 className="text-base font-bold text-[#0b1c30]">Menu Principal</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Absences & Présences Quick Card */}
          <div
            onClick={onOpenAttendance}
            className="col-span-2 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white p-4 rounded-[24px] shadow-sm border border-emerald-100 flex items-center justify-between cursor-pointer hover:shadow-md active:scale-98 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">fact_check</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#00113a] block">Absences & Présences</span>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  100% Présence • Registre de l'élève
                </p>
              </div>
            </div>
            <span className="bg-white text-emerald-800 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-emerald-200/80 shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              Consulter
            </span>
          </div>

          {/* Notes */}
          <div
            onClick={() => onNavigate('notes')}
            className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-3 cursor-pointer hover:shadow-md active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#dce9ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#375ca6]">grade</span>
            </div>
            <span className="text-xs font-semibold text-[#0b1c30]">Notes</span>
          </div>

          {/* Avis */}
          <div
            onClick={() => onNavigate('avis')}
            className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-3 cursor-pointer hover:shadow-md active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#dce9ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#375ca6]">notifications_active</span>
            </div>
            <span className="text-xs font-semibold text-[#0b1c30]">Avis</span>
          </div>

          {/* Équipe & Messagerie (Large Bento Item) */}
          <div
            onClick={() => onNavigate('messages')}
            className="col-span-2 bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:shadow-md active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#dce9ff] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#375ca6]">chat</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#0b1c30]">Messagerie & Équipe</span>
                <span className="text-[11px] text-[#375ca6] font-medium">Administration & Enseignants</span>
              </div>
            </div>
            <div className="flex -space-x-2">
              <Avatar name="Sophie Laurent" size="xs" />
              <Avatar name="Claire Morel" size="xs" />
              <Avatar name="Thomas Bernard" size="xs" />
            </div>
          </div>

          {/* Paiements */}
          <div
            onClick={() => onNavigate('paiements')}
            className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-3 cursor-pointer hover:shadow-md active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#dce9ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#375ca6]">payments</span>
            </div>
            <span className="text-xs font-semibold text-[#0b1c30]">Paiements</span>
          </div>

          {/* Emploi du temps */}
          <div
            onClick={() => onNavigate('schedule')}
            className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-3 cursor-pointer hover:shadow-md active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#dce9ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#375ca6]">calendar_month</span>
            </div>
            <span className="text-xs font-semibold text-[#0b1c30]">Emploi du temps</span>
          </div>

          {/* Assistance Scolaire / Support (Large Bento Item) */}
          <div
            onClick={() => onNavigate('support')}
            className="col-span-2 bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md active:scale-98 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#dce9ff] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#375ca6]">support_agent</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#0b1c30]">Assistance Scolaire</span>
              <span className="text-xs text-slate-500">Une question ? Nous sommes là.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
