import React, { useEffect, useState } from 'react';
import { NavigationTab } from '../types';
import { fetchNotifications, markAllNotificationsAsRead } from '../api';

interface NotificationItem {
  id: number;
  titre: string;
  contenu: string;
  type: string;
  lu: boolean;
  data: any;
  created_at: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onNotificationsUpdate?: () => void;
}

const NOTIF_ICONS: Record<string, { icon: string; color: string; tab: NavigationTab }> = {
  parent_blocked: { icon: 'lock', color: 'bg-red-100 text-red-700', tab: 'accueil' },
  parent_new_grade: { icon: 'grade', color: 'bg-blue-100 text-blue-700', tab: 'notes' },
  parent_new_remark: { icon: 'comment', color: 'bg-purple-100 text-purple-700', tab: 'avis' },
  parent_absence: { icon: 'event_busy', color: 'bg-amber-100 text-amber-700', tab: 'accueil' },
  parent_message: { icon: 'mark_email_unread', color: 'bg-emerald-100 text-emerald-700', tab: 'messages' },
  demande_acces: { icon: 'shield', color: 'bg-indigo-100 text-indigo-700', tab: 'accueil' },
  test: { icon: 'science', color: 'bg-teal-100 text-teal-700', tab: 'accueil' },
  info: { icon: 'info', color: 'bg-slate-100 text-slate-700', tab: 'accueil' },
  alerte: { icon: 'warning', color: 'bg-orange-100 text-orange-700', tab: 'accueil' },
  urgent: { icon: 'error', color: 'bg-red-100 text-red-700', tab: 'accueil' },
};

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

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onNotificationsUpdate,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      onNotificationsUpdate?.();
    } catch (err) {
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-16">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 animate-slideDown">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#375ca6]">notifications</span>
            <h3 className="text-base font-bold text-[#00113a]">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-[#375ca6] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-slate-300">notifications_none</span>
              <p className="text-sm text-slate-400 mt-2">Aucune notification</p>
            </div>
          ) : (
            notifications.map((n) => {
              const iconData = NOTIF_ICONS[n.type] || NOTIF_ICONS.info;
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    onClose();
                    onNavigate(iconData.tab);
                  }}
                  className={`p-3 rounded-2xl border border-slate-100 flex items-start gap-3 cursor-pointer transition-colors ${
                    n.lu ? 'bg-white hover:bg-slate-50' : 'bg-[#f8f9ff] hover:bg-[#e5eeff]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconData.color}`}>
                    <span className="material-symbols-outlined text-xl">{iconData.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className={`text-xs font-bold text-[#00113a] ${!n.lu ? 'font-extrabold' : ''}`}>
                        {n.titre}
                      </p>
                      <span className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.contenu}</p>
                  </div>
                  {!n.lu && (
                    <div className="w-2.5 h-2.5 bg-[#375ca6] rounded-full shrink-0 mt-1" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {notifications.some(n => !n.lu) && (
          <button
            onClick={handleMarkAllRead}
            className="w-full py-2.5 bg-[#e5eeff] text-[#00113a] font-semibold text-xs rounded-xl hover:bg-[#8dafff]/40 transition-colors"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>
    </div>
  );
};
