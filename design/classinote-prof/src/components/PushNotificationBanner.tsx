import React, { useState, useEffect } from 'react';
import { requestPushPermission, initFirebaseMessaging } from '../firebase';

const STORAGE_KEY = 'classinote_prof_push_declined';

export const PushNotificationBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') { setStatus('granted'); return; }
    if (Notification.permission === 'denied') { setStatus('denied'); setVisible(true); return; }
    const declined = localStorage.getItem(STORAGE_KEY);
    if (!declined) setVisible(true);
  }, []);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const { registration } = await initFirebaseMessaging();
      const granted = await requestPushPermission(registration);
      if (granted) { setStatus('granted'); setVisible(false); localStorage.removeItem(STORAGE_KEY); }
    } catch { } finally { setLoading(false); }
  };

  const handleDecline = () => { localStorage.setItem(STORAGE_KEY, 'true'); setVisible(false); };

  if (!visible || status === 'granted') return null;

  return (
    <div className="sticky bottom-0 z-40 mx-4 mb-20">
      <div className="bg-[#1e3a5f] rounded-2xl p-4 shadow-xl animate-slideUp">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-xl">notifications_active</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white">Activez les notifications</h4>
            <p className="text-[11px] text-blue-200 mt-0.5">Recevez des alertes pour les messages et événements.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleAccept} disabled={loading} className="flex-1 py-2.5 bg-white text-[#1e3a5f] font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer">
            {loading ? <div className="w-4 h-4 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-base">check</span>}
            <span>{loading ? 'Activation...' : 'Activer'}</span>
          </button>
          <button onClick={handleDecline} className="px-4 py-2.5 bg-white/10 text-white/80 font-medium text-xs rounded-xl hover:bg-white/20 transition-colors active:scale-95 cursor-pointer">Plus tard</button>
        </div>
        {status === 'denied' && <p className="text-[10px] text-amber-300 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-xs">warning</span> Bloqué dans les paramètres du navigateur.</p>}
      </div>
    </div>
  );
};
