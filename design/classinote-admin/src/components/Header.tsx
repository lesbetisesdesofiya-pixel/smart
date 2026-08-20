import React, { useState, useEffect } from "react";
import {
  Menu,
  Search,
  Bell,
  Plus,
  User,
  Calendar,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react";
import { SchoolSettings, NavView } from "../types";
import { fetchNotifications, markAllNotificationsAsRead } from "../api";

interface NotificationItem {
  id: number;
  titre: string;
  contenu: string;
  type: string;
  lu: boolean;
  data: any;
  created_at: string;
}

interface HeaderProps {
  settings: SchoolSettings;
  setIsOpenMobile: (open: boolean) => void;
  setActiveView: (view: NavView) => void;
  onOpenAiAssistant?: () => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "À l'instant";
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  setIsOpenMobile,
  setActiveView,
  onOpenAiAssistant,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    const handleNotification = () => loadNotifications();
    window.addEventListener('notification:received', handleNotification);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification:received', handleNotification);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (err) {
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
      {/* Left section: Mobile toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          id="btn-mobile-sidebar-toggle"
          onClick={() => setIsOpenMobile(true)}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{settings.schoolName}</span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Année Scolaire: <strong className="text-slate-800">{settings.academicYear}</strong>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-blue-600 font-semibold">{settings.city}, {settings.country}</span>
          </div>
        </div>
      </div>

      {/* Right section: Quick Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Dropdown */}
        <div className="relative">
          <button
            id="btn-quick-actions"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100/80 font-medium text-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Créer / Ajouter</span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
          </button>

          {showQuickAdd && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => {
                  setActiveView("students");
                  setShowQuickAdd(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Inscrire un élève</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Élèves</span>
              </button>
              <button
                onClick={() => {
                  setActiveView("teachers");
                  setShowQuickAdd(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Nouveau professeur</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Profs</span>
              </button>
              <button
                onClick={() => {
                  setActiveView("announcements");
                  setShowQuickAdd(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Publier un avis aux parents</span>
                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Avis</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon Popover */}
        <div className="relative">
          <button
            id="btn-header-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-800">Notifications</span>
                {notifications.some(n => !n.lu) && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">Aucune notification</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className={`p-2 rounded-lg hover:bg-blue-50/50 transition-colors flex gap-2.5 ${!n.lu ? 'bg-blue-50/30' : 'bg-slate-50'}`}>
                      {n.type === 'admin_access_request' ? (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : n.type === 'admin_message' ? (
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{n.titre}</p>
                        <p className="text-[11px] text-slate-600 truncate">{n.contenu}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{timeAgo(n.created_at)}</span>
                      </div>
                      {!n.lu && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin User Profile Tag */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100">
            AD
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-none">Administration</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Directeur Général</p>
          </div>
        </div>
      </div>
    </header>
  );
};
