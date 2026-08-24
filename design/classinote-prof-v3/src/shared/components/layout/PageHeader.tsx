import React from 'react';
import { Menu, Bell } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onNotificationsClick?: () => void;
  unreadCount?: number;
  rightAction?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onMenuClick,
  onNotificationsClick,
  unreadCount = 0,
  rightAction,
}) => (
  <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 lg:px-8 py-3 flex items-center justify-between">
    <div className="flex items-center gap-3">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {rightAction}
      {onNotificationsClick && (
        <button
          onClick={onNotificationsClick}
          className="relative w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  </header>
);
