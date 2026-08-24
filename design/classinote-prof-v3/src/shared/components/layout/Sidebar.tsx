import React from 'react';
import { LayoutDashboard, FileText, Users, MessageSquare, ClipboardCheck, BookOpen, LogOut, Bell, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  teacherName: string;
  teacherInitials: string;
  schoolName: string;
  unreadCount: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'evaluations', label: 'Évaluations', icon: FileText },
  { id: 'presences', label: 'Présences', icon: ClipboardCheck },
  { id: 'interrogation', label: 'Interrogation', icon: BookOpen },
  { id: 'messaging', label: 'Messages', icon: MessageSquare },
  { id: 'classes', label: 'Mes classes', icon: Users },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  teacherName,
  teacherInitials,
  schoolName,
  unreadCount,
  onOpenNotifications,
  onLogout,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-50 transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#002366] to-[#375ca6] flex items-center justify-center text-white text-sm font-bold">
                {teacherInitials}
              </div>
              <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">{teacherName}</p>
            <p className="text-xs text-gray-400 truncate">{schoolName}</p>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer
                    ${active
                      ? 'bg-navy-50 text-navy-800 font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'text-navy-800' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-100 space-y-1">
            <button
              onClick={onOpenNotifications}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              Notifications
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
