import React from 'react';
import { ScreenType } from '../types';

interface SidebarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  teacherName: string;
  teacherInitials: string;
  schoolName: string;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenSchoolSelection: () => void;
  onLogout: () => void;
  onOpenChangePin: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen, onNavigate, teacherName, teacherInitials, schoolName,
  unreadNotificationsCount, onOpenNotifications, onOpenSchoolSelection,
  onLogout, onOpenChangePin, isOpen, onClose,
}) => {
  const navItems = [
    { id: 'dashboard' as ScreenType, label: 'Tableau de bord', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'assessments' as ScreenType, label: 'Evaluations', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'presences' as ScreenType, label: 'Presences', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'messaging' as ScreenType, label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'interrogation' as ScreenType, label: 'Interrogation', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 bg-white border-r border-navy-100 flex flex-col transition-transform duration-300 shadow-lg shadow-navy-100/50 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-navy-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-800 to-navy-500 flex items-center justify-center shadow-lg shadow-navy-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div><h1 className="text-lg font-bold gradient-text">ClassiNote</h1><p className="text-[11px] text-gray-400">Espace Enseignant</p></div>
          </div>
        </div>

        <div className="p-4 border-b border-navy-100">
          <button onClick={onOpenSchoolSelection} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-navy-50 hover:bg-navy-100 transition-all group border border-navy-100">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">{schoolName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'EC'}</div>
            <div className="flex-1 min-w-0 text-left"><p className="text-xs font-semibold text-gray-900 truncate">{schoolName || 'Ecole'}</p><p className="text-[10px] text-gray-400">Changer d'etablissement</p></div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-navy-800 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${isActive ? 'bg-navy-50 text-navy-800 border border-navy-200 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-navy-50'}`}>
                <svg className={`w-5 h-5 shrink-0 ${isActive ? 'text-navy-800' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.5} d={item.icon} /></svg>
                <span className="text-sm">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-navy-800" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-navy-100 space-y-1">
          <button onClick={onOpenChangePin} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-navy-50 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            <span className="text-sm font-medium">Changer le PIN</span>
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="text-sm font-medium">Se deconnecter</span>
          </button>
          <div className="pt-2 flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-800 to-navy-500 flex items-center justify-center text-white text-xs font-bold">{teacherInitials}</div>
            <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-900 truncate">{teacherName}</p><p className="text-[10px] text-gray-400">Enseignant</p></div>
          </div>
        </div>
      </aside>
    </>
  );
};

