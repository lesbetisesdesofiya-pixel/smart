import React, { useEffect, useState } from 'react';
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

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationsUpdate?: () => void;
}

const NOTIF_ICONS: Record<string, { icon: string; colorClass: string }> = {
  prof_message: { icon: 'chat', colorClass: 'bg-emerald-100 text-emerald-700' },
  prof_access_request: { icon: 'shield', colorClass: 'bg-indigo-100 text-indigo-700' },
  test: { icon: 'science', colorClass: 'bg-teal-100 text-teal-700' },
  info: { icon: 'info', colorClass: 'bg-slate-100 text-slate-700' },
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

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
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
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/30 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-outline-variant overflow-hidden mt-12 mr-0 md:mr-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications</span>
            <h3 className="font-headline-sm font-bold text-primary text-base">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/40">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-on-surface-variant">Aucune notification.</p>
          ) : (
            notifications.map((notif) => {
              const iconData = NOTIF_ICONS[notif.type] || NOTIF_ICONS.info;
              return (
                <div
                  key={notif.id}
                  className={`p-3.5 hover:bg-surface-container-low transition-colors flex gap-3 ${
                    !notif.lu ? 'bg-primary-fixed/20' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconData.colorClass}`}>
                    <span className="material-symbols-outlined text-sm">{iconData.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-tight mb-1 ${!notif.lu ? 'font-bold text-on-surface' : 'font-semibold text-on-surface'}`}>
                      {notif.titre}
                    </p>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">{notif.contenu}</p>
                    <p className="text-[10px] text-on-surface-variant/70 mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                  {!notif.lu && (
                    <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-surface border-t border-outline-variant/40 flex justify-between items-center">
          {notifications.some(n => !n.lu) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-primary hover:underline"
            >
              Tout marquer comme lu
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-medium hover:opacity-90 transition-opacity ml-auto"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
