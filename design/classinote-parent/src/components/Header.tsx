import React from 'react';
import { NavigationTab, Parent, Child } from '../types';
import { Avatar } from './Avatar';

interface HeaderProps {
  currentTab: NavigationTab;
  parent: Parent;
  activeChild: Child;
  onNavigate: (tab: NavigationTab) => void;
  onOpenNotifications: () => void;
  onOpenChildSelector: () => void;
  onLogout?: () => void;
  onOpenChangePin?: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  parent,
  activeChild,
  onNavigate,
  onOpenNotifications,
  onOpenChildSelector,
  onLogout,
  onOpenChangePin,
  unreadCount,
}) => {
  const isSubPage = ['support', 'qr'].includes(currentTab);

  return (
    <header className="sticky top-0 z-40 bg-[#f8f9ff] flex justify-between items-center w-full px-5 py-3 border-b border-blue-50/50 backdrop-blur-md bg-[#f8f9ff]/90">
      <div className="flex items-center gap-3">
        {isSubPage ? (
          <button
            onClick={() => onNavigate('accueil')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#e5eeff] text-[#00113a] transition-colors active:scale-95"
            aria-label="Retour"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
        ) : (
          <button
            onClick={onOpenChildSelector}
            className="relative focus:outline-none focus:ring-2 focus:ring-[#375ca6] rounded-full transition-transform active:scale-95 group"
            title="Changer d'enfant"
          >
            <Avatar name={parent.name} size="md" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </button>
        )}

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <h1 
              onClick={() => onNavigate('accueil')}
              className="text-lg font-bold text-[#00113a] tracking-tight cursor-pointer hover:text-[#375ca6] transition-colors"
            >
              ClassiNote
            </h1>
          </div>
          {!isSubPage && (
            <button
              onClick={onOpenChildSelector}
              className="text-xs font-semibold text-[#375ca6] flex items-center gap-1 hover:underline text-left"
            >
              <span>{activeChild.name} ({activeChild.class})</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          )}
        </div>
        </div>

    <div className="flex items-center gap-1.5">
      <button
        onClick={onOpenNotifications}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#e5eeff] transition-colors text-[#00113a] relative active:scale-95 cursor-pointer"
        aria-label="Notifications"
        title="Notifications"
      >
        <span className="material-symbols-outlined text-2xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {onOpenChangePin && (
        <button
          onClick={onOpenChangePin}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#e5eeff] transition-colors text-[#00113a] active:scale-95 cursor-pointer"
          aria-label="Changer le PIN"
          title="Changer le PIN"
        >
          <span className="material-symbols-outlined text-xl">pin</span>
        </button>
      )}

      {onLogout && (
        <button
          onClick={onLogout}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-rose-100 text-rose-700 transition-colors active:scale-95 cursor-pointer"
          aria-label="Déconnexion QR"
          title="Déconnexion (Scanner un autre QR Code)"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
        </button>
      )}
    </div>
  </header>
  );
};

// Add a toast notification component for showing the subscription error

