import React, { useState } from 'react';
import { ScreenType } from '../types';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  teacherAvatar: string;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  currentSchoolName: string;
  onOpenSchoolSelection: () => void;
  onLogout: () => void;
  onOpenChangePin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  teacherAvatar,
  unreadNotificationsCount,
  onOpenNotifications,
  currentSchoolName,
  onOpenSchoolSelection,
  onLogout,
  onOpenChangePin,
}) => {
  if (currentScreen === 'login') {
    return null; // Login has its own integrated header
  }

  return (
    <header className="w-full top-0 sticky z-40 bg-surface shadow-sm flex justify-between items-center px-4 md:px-10 py-2.5 transition-colors duration-200">
      <div className="flex items-center gap-3">
        {currentScreen === 'student_profile' ? (
          <button 
            onClick={() => onNavigate('class_details')} 
            className="p-2 rounded-full hover:bg-secondary-container transition-colors duration-200 flex items-center justify-center text-primary"
            title="Retour à la classe"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <button
            onClick={onOpenSchoolSelection}
            className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center border border-blue-200 hover:opacity-90 transition-opacity shrink-0 shadow-xs cursor-pointer"
            title="Changer d'établissement"
          >
            {currentSchoolName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'EC'}
          </button>
        )}

        <div className="flex flex-col cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <h1 className="font-headline-md text-xl md:text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            ClassiNote
          </h1>
          {currentSchoolName && currentScreen !== 'school_selection' && (
            <span 
              onClick={(e) => { e.stopPropagation(); onOpenSchoolSelection(); }} 
              className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <span>{currentSchoolName}</span>
              <span className="material-symbols-outlined text-[14px]">unfold_more</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('messaging')}
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary-container text-primary transition-colors duration-200"
          title="Messages"
        >
          <span className="material-symbols-outlined">chat</span>
        </button>
        <button
          onClick={onOpenNotifications}
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary-container text-primary transition-colors duration-200"
          title="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface animate-pulse" />
          )}
        </button>
        <button
          onClick={onOpenChangePin}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary-container text-primary transition-colors duration-200"
          title="Changer le PIN"
        >
          <span className="material-symbols-outlined">pin</span>
        </button>
        <button
          onClick={onLogout}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-error/10 text-error transition-colors duration-200"
          title="Se déconnecter"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
};
