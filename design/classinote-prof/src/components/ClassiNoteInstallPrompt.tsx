import React, { useState, useEffect, useRef } from 'react';

const DISMISS_KEY = 'classinote_prof_install_dismissed';
const INSTALLED_KEY = 'classinote_prof_installed';

export const ClassiNoteInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const visibleRef = useRef(false);
  const installedRef = useRef(false);

  useEffect(() => {
    if (localStorage.getItem(INSTALLED_KEY) === 'true') {
      setIsInstalled(true);
      installedRef.current = true;
      return;
    }
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const hoursSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSince < 24) return;
    }
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
      installedRef.current = true;
      return;
    }

    const tryShow = () => {
      if ((window as any).deferredPrompt && !installedRef.current) {
        setTimeout(() => {
          if (!installedRef.current) {
            setShowPrompt(true);
            visibleRef.current = true;
          }
        }, 5000);
      }
    };

    tryShow();
    window.addEventListener('beforeinstallprompt', tryShow, { once: true });

    const fallbackTimer = setTimeout(() => {
      if (!installedRef.current && !visibleRef.current) {
        setShowPrompt(true);
        visibleRef.current = true;
      }
    }, 8000);

    return () => {
      window.removeEventListener('beforeinstallprompt', tryShow);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    try {
      if ((window as any).deferredPrompt) {
        (window as any).deferredPrompt.prompt();
        const { outcome } = await (window as any).deferredPrompt;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          installedRef.current = true;
        }
        (window as any).deferredPrompt = null;
      }
      setShowPrompt(false);
    } catch (error) {
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setTimeout(() => setIsDismissed(false), 24 * 60 * 60 * 1000);
  };

  if (isInstalled || isDismissed || !showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e5eeff] text-[#002366] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#00113a]">Installer ClassiNote Prof</h3>
            <p className="text-xs text-[#757682]">Accès rapide depuis votre écran d'accueil</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-[#f8f9ff] p-4 rounded-xl border border-[#e5eeff]">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-base text-[#375ca6]">offline_bolt</span>
              <span className="text-xs font-semibold text-[#00113a]">Accès hors-ligne</span>
            </div>
            <p className="text-xs text-[#757682] ml-7">
              Consultez les notes même sans connexion
            </p>
          </div>
          <div className="bg-[#f8f9ff] p-4 rounded-xl border border-[#e5eeff]">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-base text-[#375ca6]">notifications_active</span>
              <span className="text-xs font-semibold text-[#00113a]">Notifications en temps réel</span>
            </div>
            <p className="text-xs text-[#757682] ml-7">
              Recevez les alertes et mises à jour importantes
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleDismiss} className="flex-1 py-3 bg-[#f8f9ff] text-[#757682] font-semibold text-xs rounded-xl hover:bg-[#e5eeff] transition-colors">Plus tard</button>
          <button onClick={handleInstall} className="flex-1 py-3 bg-[#002366] text-white font-bold text-xs rounded-xl hover:bg-[#00113a] transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">download</span> Installer
          </button>
        </div>

        <p className="text-[10px] text-[#757682] text-center">Ne s'affichera plus pendant 24 heures</p>
      </div>
    </div>
  );
};
