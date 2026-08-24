import React from 'react';
import { Bell, LogOut } from 'lucide-react';

interface HeaderProps {
  title: string;
  onNotifications: () => void;
  onLogout: () => void;
  notifCount: number;
}

export const Header: React.FC<HeaderProps> = ({ title, onNotifications, onLogout, notifCount }) => (
  <header className="sticky top-0 z-40 bg-gradient-to-r from-[#002366] to-[#1a3a7a] text-white">
    <div className="flex justify-between items-center px-5 py-3.5 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/10">
          <span className="text-sm font-extrabold">CN</span>
        </div>
        <h1 className="text-base font-bold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onNotifications} className="relative p-2.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          {notifCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-400 rounded-full animate-pulse" />}
        </button>
        <button onClick={onLogout} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
);
