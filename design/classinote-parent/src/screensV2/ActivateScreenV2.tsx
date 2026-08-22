import React, { useState, useEffect, useRef } from 'react';
import { initFirebaseMessaging, requestPushPermission } from '../firebase';

interface ActivateScreenV2Props {
  onComplete: () => void;
}

type Step = 'welcome' | 'install' | 'notifications' | 'done';

export const ActivateScreenV2: React.FC<ActivateScreenV2Props> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [isStandalone, setIsStandalone] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [installLoading, setInstallLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const completedRef = useRef(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (step === 'welcome') {
      const timer = setTimeout(() => setStep('install'), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'install' && isStandalone) {
      setStep('notifications');
    }
  }, [step, isStandalone]);

  useEffect(() => {
    if (step === 'notifications' && notifPermission === 'granted') {
      finishActivation();
    }
  }, [step, notifPermission]);

  useEffect(() => {
    if (step === 'done' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (step === 'done' && countdown === 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [step, countdown, onComplete]);

  const finishActivation = () => {
    try { localStorage.setItem('classinote_parent_activated', '1'); } catch {}
    setStep('done');
  };

  const handleInstall = async () => {
    setInstallLoading(true);
    try {
      if ((window as any).deferredPrompt) {
        (window as any).deferredPrompt.prompt();
        const { outcome } = await (window as any).deferredPrompt;
        (window as any).deferredPrompt = null;
        if (outcome === 'accepted') {
          setIsStandalone(true);
        }
      }
    } catch {}
    setInstallLoading(false);
    setStep('notifications');
  };

  const handleSkipInstall = () => {
    setStep('notifications');
  };

  const handleActivateNotif = async () => {
    setNotifLoading(true);
    try {
      const { registration } = await initFirebaseMessaging();
      const granted = await requestPushPermission(registration);
      if (granted) {
        setNotifPermission('granted');
      } else {
        finishActivation();
      }
    } catch {
      finishActivation();
    }
    setNotifLoading(false);
  };

  const handleSkipNotif = () => {
    finishActivation();
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002366] to-[#0a1e3d] flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 bg-white/15 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/10">
            <span className="material-symbols-outlined text-white text-4xl">school</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bienvenue !</h1>
            <p className="text-sm text-blue-200 mt-2">Configurons votre espace parent</p>
          </div>
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (step === 'install') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002366] to-[#0a1e3d] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/10">
              <span className="material-symbols-outlined text-white text-3xl">download</span>
            </div>
            <h2 className="text-xl font-bold text-white">Installer l'application</h2>
            <p className="text-sm text-blue-200/80">Acces rapide depuis votre ecran d'accueil</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">offline_bolt</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Acces hors-ligne</p>
                <p className="text-xs text-blue-200/70">Consultez sans internet</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">notifications_active</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Notifications</p>
                <p className="text-xs text-blue-200/70">Alertes en temps reel</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleInstall}
              disabled={installLoading}
              className="w-full py-3.5 bg-white text-[#002366] font-bold text-sm rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {installLoading ? (
                <div className="w-5 h-5 border-2 border-[#002366] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">download</span>
                  Installer
                </>
              )}
            </button>
            <button
              onClick={handleSkipInstall}
              className="w-full py-3 bg-white/10 text-white/80 font-medium text-sm rounded-xl hover:bg-white/20 transition-colors"
            >
              Continuer sans installer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'notifications') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002366] to-[#0a1e3d] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/10">
              <span className="material-symbols-outlined text-white text-3xl">notifications_active</span>
            </div>
            <h2 className="text-xl font-bold text-white">Activer les notifications</h2>
            <p className="text-sm text-blue-200/80">Recevez les notes, absences et messages</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">grade</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Notes</p>
                <p className="text-xs text-blue-200/70">Nouvelles notes instantanement</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">event_busy</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Absences</p>
                <p className="text-xs text-blue-200/70">Alertes d'absences</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">chat</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Messages</p>
                <p className="text-xs text-blue-200/70">Messages de l'ecole</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleActivateNotif}
              disabled={notifLoading}
              className="w-full py-3.5 bg-white text-[#002366] font-bold text-sm rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {notifLoading ? (
                <div className="w-5 h-5 border-2 border-[#002366] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">check</span>
                  Activer les notifications
                </>
              )}
            </button>
            <button
              onClick={handleSkipNotif}
              className="w-full py-3 bg-white/10 text-white/80 font-medium text-sm rounded-xl hover:bg-white/20 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002366] to-[#0a1e3d] flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto border border-emerald-400/20">
          <span className="material-symbols-outlined text-emerald-300 text-4xl">check_circle</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Tout est pret !</h1>
          <p className="text-sm text-blue-200 mt-2">Redirection dans {countdown}...</p>
        </div>
        <div className="w-48 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${((3 - countdown) / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
