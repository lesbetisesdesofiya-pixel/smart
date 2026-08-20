import React, { useEffect, useState } from 'react';
import { fetchNotifications, markAllNotificationsAsRead } from '../api';
import { NotificationItem } from '../types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationsUpdate?: () => void;
}

const NOTIF_CONFIG: Record<string, { icon: string; bg: string }> = {
  prof_message: { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', bg: 'bg-emerald-100 text-emerald-600' },
  prof_access_request: { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', bg: 'bg-blue-100 text-blue-600' },
  test: { icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', bg: 'bg-teal-100 text-teal-600' },
  info: { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-gray-100 text-gray-600' },
};

function timeAgo(dateStr: string): string {
  const now = new Date(); const date = new Date(dateStr); const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "A l'instant"; if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`; if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`; if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, onNotificationsUpdate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isOpen) loadNotifications(); }, [isOpen]);
  const loadNotifications = async () => { setLoading(true); try { const data = await fetchNotifications(); if (data.notifications) setNotifications(data.notifications); } catch {} finally { setLoading(false); } };
  const handleMarkAllRead = async () => { try { await markAllNotificationsAsRead(); setNotifications(prev => prev.map(n => ({ ...n, lu: true }))); onNotificationsUpdate?.(); } catch {} };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-end p-4 bg-black/20 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-navy-100 overflow-hidden mt-14 mr-0 md:mr-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-navy-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-800 to-navy-500 flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div>
            <h3 className="font-bold text-gray-900">Notifications</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-navy-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-hide divide-y divide-gray-100">
          {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-navy-200 border-t-violet-600 rounded-full animate-spin" /></div>
          : notifications.length === 0 ? <p className="p-6 text-center text-sm text-gray-400">Aucune notification</p>
          : notifications.map((notif) => { const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.info; return (
            <div key={notif.id} className={`p-3.5 hover:bg-navy-50 transition-colors flex gap-3 ${!notif.lu ? 'bg-navy-50' : ''}`}>
              <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} /></svg></div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-tight mb-1 ${!notif.lu ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{notif.titre}</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">{notif.contenu}</p>
                <p className="text-[10px] text-gray-300 mt-1">{timeAgo(notif.created_at)}</p>
              </div>
              {!notif.lu && <div className="w-2 h-2 bg-navy-800 rounded-full shrink-0 mt-1.5" />}
            </div> ); })}
        </div>
        <div className="p-3 border-t border-navy-100 flex justify-between items-center">
          {notifications.some(n => !n.lu) && <button onClick={handleMarkAllRead} className="text-xs font-medium text-navy-800 hover:text-navy-800 transition-colors">Tout marquer comme lu</button>}
          <button onClick={onClose} className="px-3 py-1.5 bg-navy-800 text-white rounded-lg text-xs font-medium hover:bg-navy-500 transition-colors ml-auto">Fermer</button>
        </div>
      </div>
    </div>
  );
};

