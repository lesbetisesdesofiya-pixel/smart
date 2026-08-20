import React, { useState, useEffect } from 'react';

const DISMISS_KEY = 'classinote_admin_install_dismissed';
const INSTALLED_KEY = 'classinote_admin_installed';

export const ClassiNoteInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (localStorage.getItem(INSTALLED_KEY) === 'true') return;
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      localStorage.setItem(INSTALLED_KEY, 'true');
      return;
    }
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const hoursSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSince < 24) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALLED_KEY, 'true');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Installer ClassiNote Admin</h3>
            <p className="text-xs text-slate-500">Accès rapide depuis votre écran d'accueil</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-base text-blue-600">offline_bolt</span>
              <span className="text-xs font-semibold text-slate-900">Accès hors-ligne</span>
            </div>
            <p className="text-xs text-slate-500 ml-7">
              Consultez les informations même sans connexion internet
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-base text-blue-600">notifications_active</span>
              <span className="text-xs font-semibold text-slate-900">Notifications en temps réel</span>
            </div>
            <p className="text-xs text-slate-500 ml-7">
              Recevez les alertes et mises à jour importantes
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleDismiss} className="flex-1 py-3 bg-slate-50 text-slate-500 font-semibold text-xs rounded-xl hover:bg-slate-100 transition-colors">Plus tard</button>
          <button onClick={handleInstall} className="flex-1 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">download</span> Installer
          </button>
        </div>

        <p className="text-[10px] text-slate-400 text-center">Ne s'affichera plus pendant 24 heures</p>
      </div>
    </div>
  );
};
