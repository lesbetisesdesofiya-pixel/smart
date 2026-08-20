import React from 'react';
import { NavigationTab } from '../types';

interface BottomNavProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  unreadNoticesCount?: number;
  unreadMessagesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onNavigate,
  unreadNoticesCount = 0,
  unreadMessagesCount = 0
}) => {
  const tabs = [
    { id: 'accueil' as NavigationTab, label: 'Accueil', icon: 'home' },
    { id: 'notes' as NavigationTab, label: 'Notes', icon: 'grade' },
    { id: 'avis' as NavigationTab, label: 'Avis', icon: 'notifications_active', badge: unreadNoticesCount },
    { id: 'paiements' as NavigationTab, label: 'Paiements', icon: 'payments' },
    { id: 'messages' as NavigationTab, label: 'Messages', icon: 'chat', badge: unreadMessagesCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 py-2.5 bg-white shadow-[0px_-2px_15px_rgba(0,0,0,0.08)] rounded-t-2xl border-t border-slate-100 max-w-lg mx-auto">
      {tabs.map((tab) => {
        const isActive =
          currentTab === tab.id ||
          (currentTab === 'schedule' && tab.id === 'notes') ||
          (currentTab === 'team' && tab.id === 'messages') ||
          (currentTab === 'support' && tab.id === 'messages') ||
          (currentTab === 'profil' && tab.id === 'messages');

        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded-full transition-all duration-200 relative ${
              isActive
                ? 'bg-[#8dafff]/40 text-[#144089] font-bold scale-95 shadow-sm'
                : 'text-[#757682] hover:text-[#00113a]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-2xl ${isActive ? 'filled-icon' : ''}`}
            >
              {tab.icon}
            </span>
            <span className="text-[11px] font-semibold tracking-tight mt-0.5">
              {tab.label}
            </span>
            {tab.badge && tab.badge > 0 ? (
              <span className="absolute -top-1 right-2 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse border border-white">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
};
