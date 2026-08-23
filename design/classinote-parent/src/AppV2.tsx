import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, getUser, setAuthData, clearAuthData, fetchNotifications } from './api';
import { initFirebaseMessaging, requestPushPermission, onForegroundMessage } from './firebase';
import { TimetableClass } from './types';
import { initialTimetable } from './data/mockData';

import { HomeScreenV2 } from './screensV2/HomeScreenV2';
import { NotesScreenV2 } from './screensV2/NotesScreenV2';
import { AvisScreenV2 } from './screensV2/AvisScreenV2';
import { PaiementsScreenV2 } from './screensV2/PaiementsScreenV2';
import { MessagesScreenV2 } from './screensV2/MessagesScreenV2';
import { ScheduleScreenV2 } from './screensV2/ScheduleScreenV2';
import { SupportScreenV2 } from './screensV2/SupportScreenV2';
import { ExamensScreenV2 } from './screensV2/ExamensScreenV2';
import { NouveautesScreenV2 } from './screensV2/NouveautesScreenV2';
import { ActivateScreenV2 } from './screensV2/ActivateScreenV2';

const API_BASE = '/api/v1';

function parseMagicToken(): { purpose: string; token: string } | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('t');
  if (token && /^[a-f0-9]{64}$/i.test(token)) {
    // Extract purpose from URL path: /magic/parent/notes -> notes
    const pathParts = window.location.pathname.split('/');
    const purpose = pathParts[pathParts.length - 1] || 'dashboard';
    return { purpose, token };
  }
  return null;
}

function MagicConsumeScreen({ purpose, token }: { purpose: string; token: string }) {
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/magic/consume`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok || !json.success) {
          setError(json.message || 'Lien invalide ou expire.');
          return;
        }

        // Remove token from URL and reload
        window.location.replace(window.location.pathname);
      } catch {
        if (!cancelled) setError('Erreur. Reessayez.');
      }
    })();
    return () => { cancelled = true; };
  }, [token, purpose]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-rose-400">link_off</span>
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-400">Demandez un nouveau lien via WhatsApp.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Connexion...</p>
      </div>
    </div>
  );
}

function Header({ tab, onNavigate, onNotifications, notifCount }: {
  tab: string;
  onNavigate: (t: string) => void;
  onNotifications: () => void;
  notifCount: number;
}) {
  const isSub = ['support'].includes(tab);
  return (
    <header className="sticky top-0 z-40 bg-[#002366] text-white shadow-md">
      <div className="flex justify-between items-center px-5 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {isSub ? (
            <button onClick={() => onNavigate('accueil')} className="p-1 hover:bg-white/10 rounded-lg">
              <span className="material-symbols-outlined text-white">arrow_back</span>
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">school</span>
            </div>
          )}
          <h1 onClick={() => onNavigate('accueil')} className="text-base font-bold cursor-pointer">
            ClassiNote
          </h1>
        </div>
        <button onClick={onNotifications} className="relative p-2 hover:bg-white/10 rounded-xl">
          <span className="material-symbols-outlined text-xl">notifications</span>
          {notifCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-400 rounded-full" />}
        </button>
      </div>
    </header>
  );
}

function BottomNav({ tab, onNavigate }: { tab: string; onNavigate: (t: string) => void }) {
  const tabs = [
    { id: 'accueil', label: 'Accueil', icon: 'home' },
    { id: 'nouveautes', label: 'Nouveautes', icon: 'notifications' },
    { id: 'notes', label: 'Notes', icon: 'grade' },
    { id: 'examens', label: 'Examens', icon: 'event_note' },
    { id: 'messages', label: 'Messages', icon: 'chat' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_15px_rgba(0,35,102,0.08)]">
      <div className="flex justify-around items-center px-2 py-2 max-w-lg mx-auto">
        {tabs.map(t => {
          const active = tab === t.id || (tab === 'schedule' && t.id === 'notes') || (tab === 'support' && t.id === 'messages') || (tab === 'avis' && t.id === 'notes') || (tab === 'paiements' && t.id === 'notes');
          return (
            <button key={t.id} onClick={() => onNavigate(t.id)}
              className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-all ${active ? 'text-[#002366] bg-[#002366]/10 font-bold' : 'text-gray-400'}`}>
              <span className={`material-symbols-outlined text-2xl ${active ? 'filled-icon' : ''}`}>{t.icon}</span>
              <span className="text-[10px] font-semibold mt-0.5">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function NotificationsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchNotifications()
        .then(data => { if (data.notifications) setItems(data.notifications); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-16">
      <div className="w-full max-w-md bg-white rounded-2xl p-5 space-y-3 animate-slideDown">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <span className="material-symbols-outlined text-gray-400">close</span>
          </button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Aucune notification.</p>
          ) : items.map(n => (
            <div key={n.id} className={`p-3 rounded-xl border border-gray-100 ${!n.lu ? 'bg-indigo-50/50' : ''}`}>
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-gray-900">{n.titre}</p>
                <span className="text-[10px] text-gray-300">{new Date(n.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{n.contenu}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LandingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002366] to-[#0a1e3d] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/10">
            <span className="material-symbols-outlined text-white text-3xl">school</span>
          </div>
          <h1 className="text-2xl font-bold text-white">ClassiNote</h1>
          <p className="text-sm text-blue-200">Espace Parent</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-4">
          <span className="material-symbols-outlined text-3xl text-amber-300">link</span>
          <div>
            <h2 className="text-sm font-bold text-white">Lien d'acces requis</h2>
            <p className="text-xs text-blue-200/80 mt-2 leading-relaxed">
              Demandez un lien d'acces a l'administration de l'ecole via WhatsApp.
            </p>
          </div>
        </div>
        <a href="https://wa.me/225000000000" target="_blank" rel="noopener noreferrer"
          className="w-full py-3 bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-600 transition-colors">
          <span className="material-symbols-outlined text-lg">chat</span>
          Contacter l'ecole
        </a>
        <p className="text-xs text-blue-200/40">ClassiNote {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

export default function AppV2() {
  const magicLink = parseMagicToken();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isActivated, setIsActivated] = useState(() => {
    try { return localStorage.getItem('classinote_parent_activated') === '1'; } catch { return false; }
  });
  const [tab, setTab] = useState('accueil');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    if (magicLink) return;
    
    getUser().then(user => {
      if (user) {
        setIsLoggedIn(true);
      }
      setLoading(false);
    });
  }, [magicLink]);

  const handleLogout = useCallback(() => {
    try { clearAuthData(); } catch {}
    try { localStorage.removeItem('classinote_parent_activated'); } catch {}
    setIsLoggedIn(false);
  }, []);

  // Magic link: consume token and reload
  if (magicLink) {
    return <MagicConsumeScreen purpose={magicLink.purpose} token={magicLink.token} />;
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in: show landing
  if (!isLoggedIn) {
    return <LandingScreen />;
  }

  // Logged in but not activated: show activation flow
  if (!isActivated) {
    return <ActivateScreenV2 onComplete={() => setIsActivated(true)} />;
  }

  // Logged in and activated: render dashboard
  return (
    <Dashboard
      tab={tab}
      setTab={setTab}
      notifOpen={notifOpen}
      setNotifOpen={setNotifOpen}
      notifCount={notifCount}
      setNotifCount={setNotifCount}
      onLogout={handleLogout}
    />
  );
}

function Dashboard({ tab, setTab, notifOpen, setNotifOpen, notifCount, setNotifCount, onLogout }: {
  tab: string;
  setTab: (t: string) => void;
  notifOpen: boolean;
  setNotifOpen: (v: boolean) => void;
  notifCount: number;
  setNotifCount: (v: number) => void;
  onLogout: () => void;
}) {
  const [timetable] = useState<TimetableClass[]>(initialTimetable);
  const [chatOpen, setChatOpen] = useState(false);

  const loadNotifs = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      if (data && data.unread_count !== undefined) setNotifCount(data.unread_count);
    } catch {}
  }, [setNotifCount]);

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, [loadNotifs]);

  useEffect(() => {
    initFirebaseMessaging().then(({ messaging, registration }) => {
      requestPushPermission(registration);
      if (messaging) onForegroundMessage(() => loadNotifs());
    }).catch(() => {});
  }, [loadNotifs]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {!chatOpen && <Header tab={tab} onNavigate={setTab} onNotifications={() => setNotifOpen(true)} notifCount={notifCount} />}
      <main className="flex-1 w-full">
        {tab === 'accueil' && <HomeScreenV2 onNavigate={setTab} onLogout={onLogout} />}
        {tab === 'notes' && <NotesScreenV2 />}
        {tab === 'avis' && <AvisScreenV2 />}
        {tab === 'paiements' && <PaiementsScreenV2 />}
        {tab === 'messages' && <MessagesScreenV2 onChatOpen={setChatOpen} />}
        {tab === 'schedule' && <ScheduleScreenV2 timetable={timetable} onMessageTeacher={() => setTab('messages')} />}
        {tab === 'support' && <SupportScreenV2 />}
        {tab === 'examens' && <ExamensScreenV2 />}
        {tab === 'nouveautes' && <NouveautesScreenV2 />}
      </main>
      {!chatOpen && <BottomNav tab={tab} onNavigate={setTab} />}
      <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
