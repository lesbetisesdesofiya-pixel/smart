import React from 'react';
import { ScreenType } from '../types';

interface BottomNavProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  hasUnreadMessages?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  hasUnreadMessages = true,
}) => {
  if (currentScreen === 'login' || currentScreen === 'qr_connect') {
    return null;
  }

  const navItems = [
    {
      id: 'dashboard' as ScreenType,
      label: 'Accueil',
      icon: 'home',
      activeScreens: ['dashboard', 'school_selection'],
    },
    {
      id: 'class_details' as ScreenType,
      label: 'Classes',
      icon: 'school',
      activeScreens: ['class_details', 'student_profile'],
    },
    {
      id: 'grade_entry' as ScreenType,
      label: 'Notes',
      icon: 'edit_note',
      activeScreens: ['grade_entry', 'interrogation'],
    },
    {
      id: 'presences' as ScreenType,
      label: 'Présences',
      icon: 'fact_check',
      activeScreens: ['presences'],
    },
    {
      id: 'assessments' as ScreenType,
      label: 'Évals',
      icon: 'assessment',
      activeScreens: ['assessments', 'create_assessment'],
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant/60 shadow-lg px-2 py-2 pb-safe flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = item.activeScreens.includes(currentScreen);

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center transition-all duration-150 active:scale-95 relative cursor-pointer ${
              isActive
                ? 'bg-secondary-container text-on-secondary-container rounded-xl px-3 py-1 font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-high px-3 py-1 rounded-xl'
            }`}
          >
            <span
              className={`material-symbols-outlined text-2xl ${
                isActive ? 'material-symbols-filled' : ''
              }`}
            >
              {item.icon}
            </span>
            <span className="font-label-sm text-xs mt-0.5 whitespace-nowrap">
              {item.label}
            </span>
            {item.badge && (
              <span className="absolute top-1 right-2.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
