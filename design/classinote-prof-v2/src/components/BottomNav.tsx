import React from 'react';
import { ScreenType } from '../types';

interface BottomNavProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  if (currentScreen === 'login' || currentScreen === 'qr_connect') return null;
  const navItems = [
    { id: 'dashboard' as ScreenType, label: 'Accueil', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'assessments' as ScreenType, label: 'Evals', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'presences' as ScreenType, label: 'Presences', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'messaging' as ScreenType, label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/90 backdrop-blur-xl border-t border-navy-100 px-2 py-2 pb-safe flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-95 relative cursor-pointer px-3 py-1.5 rounded-xl ${isActive ? 'bg-navy-50 text-navy-800' : 'text-gray-400 hover:text-gray-600'}`}>
            <svg className={`w-5 h-5 ${isActive ? 'text-navy-800' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.5} d={item.icon} /></svg>
            <span className={`text-[10px] mt-0.5 whitespace-nowrap ${isActive ? 'font-semibold text-navy-800' : 'font-medium'}`}>{item.label}</span>
            {isActive && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-navy-800 to-navy-500 rounded-full" />}
          </button>
        );
      })}
    </nav>
  );
};

