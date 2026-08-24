import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, getUser, getSessionUser, setAuthData, clearAuthData, recordActivity, getLastActivityTime, unlock, fetchNotifications, testPushNotification } from './api';
import { initFirebaseMessaging, requestPushPermission, onForegroundMessage } from './firebase';
import { ScreenType, ProfData, Classe, Matiere, Evaluation, EleveClasse } from './types';

import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { NotificationPanel } from './components/NotificationPanel';
import { ChangePinModal } from './components/ChangePinModal';

import { LoginScreen } from './components/screens/LoginScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { AssessmentsScreen } from './components/screens/AssessmentsScreen';
import { ClassDetailsScreen } from './components/screens/ClassDetailsScreen';
import { StudentProfileScreen } from './components/screens/StudentProfileScreen';
import { CreateAssessmentScreen } from './components/screens/CreateAssessmentScreen';
import { InterrogationScreen } from './components/screens/InterrogationScreen';
import { PresencesScreen } from './components/screens/PresencesScreen';
import { MessagingScreen } from './components/screens/MessagingScreen';
import { CreateRemarkScreen } from './components/screens/CreateRemarkScreen';

function parseMagicToken(): { purpose: string; token: string } | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('t');
  if (token && /^[a-f0-9]{64}$/i.test(token)) {
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
        const res = await fetch('/api/v1/magic/consume', {
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

        window.location.replace(window.location.pathname);
      } catch {
        if (!cancelled) setError('Erreur. Reessayez.');
      }
    })();
    return () => { cancelled = true; };
  }, [token, purpose]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <svg className="w-12 h-12 text-rose-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-400">Demandez un nouveau lien via WhatsApp.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-navy-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Connexion...</p>
      </div>
    </div>
  );
}

export default function App() {
  const magicLink = parseMagicToken();
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getUser());
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [showPinModal, setShowPinModal] = useState(() => !!getUser());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profData, setProfData] = useState<ProfData | null>(null);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null);
  const [classeStudents, setClasseStudents] = useState<EleveClasse[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [addSchoolCode, setAddSchoolCode] = useState('');
  const [addSchoolError, setAddSchoolError] = useState<string | null>(null);
  const [addSchoolLoading, setAddSchoolLoading] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [testNotifLoading, setTestNotifLoading] = useState(false);
  const [testNotifMessage, setTestNotifMessage] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      const res = await apiFetch('/teacher/dashboard');
      if (res.ok) {
        const data = await res.json();
        setProfData(data.prof);
        setClasses(data.classes || []);
        setMatieres(data.matieres || []);
        setEvaluations((data.evaluations || []).map((e: any) => ({
          ...e, notes_saisies: e.notes_count || 0, total_eleves: e.classe?.eleves_count || 30,
        })));
        if (data.classes?.length > 0 && !selectedClasse) {
          if (data.classes.length === 1) setSelectedClasse(data.classes[0]);
          else if (!showPinModal) setShowClassModal(true);
          // If PIN modal is showing, class modal will be shown after PIN verification
        }
      }
      const schoolsRes = await apiFetch('/teacher/schools');
      if (schoolsRes.ok) {
        const sData = await schoolsRes.json();
        setSchools(sData.schools || []);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  // Check auth on mount (supports both localStorage and session-based magic link auth)
  useEffect(() => {
    if (magicLink) return;

    const localUser = getUser();
    if (localUser) {
      setIsLoggedIn(true);
      return;
    }

    // Check session auth (magic link)
    getSessionUser().then(user => {
      if (user) {
        setAuthData(user);
        setIsLoggedIn(true);
      }
      setLoading(false);
    });
  }, [magicLink]);

  useEffect(() => { if (isLoggedIn) loadDashboardData(); }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || currentScreen === 'login') return;
    const IDLE_TIMEOUT = 5 * 60 * 1000;
    const CHECK_INTERVAL = 30 * 1000;
    recordActivity();
    initFirebaseMessaging().then(({ messaging, registration }) => {
      requestPushPermission(registration);
      if (messaging) {
        onForegroundMessage((payload) => {
          const title = payload.notification?.title || 'ClassiNote';
          const body = payload.notification?.body || '';
          if (title && Notification.permission === 'granted') new Notification(title, { body, icon: '/app/prof/icons/icon-192x192.png' });
          loadNotifications();
        });
      }
    });
    const idleCheck = setInterval(() => { if (Date.now() - getLastActivityTime() >= IDLE_TIMEOUT) setShowPinModal(true); }, CHECK_INTERVAL);
    const handleActivity = () => recordActivity();
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible' && Date.now() - getLastActivityTime() >= IDLE_TIMEOUT) setShowPinModal(true); };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(idleCheck);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, currentScreen]);

  const handlePinVerify = async (e: React.FormEvent) => {
    e.preventDefault(); if (pinInput.length !== 4) return;
    setIsPinLoading(true); setPinError(null);
    try {
      const data = await unlock(pinInput);
      if (data.success) {
        setShowPinModal(false);
        setPinInput('');
        recordActivity();
        await loadDashboardData();
        // Show class selection after PIN verification if needed
        if (classes.length > 1 && !selectedClasse) {
          setShowClassModal(true);
        }
      } else setPinError(data.message || 'PIN incorrect');
    }
    catch { setPinError('Erreur de verification'); } finally { setIsPinLoading(false); }
  };

  const handleNavigate = (screen: ScreenType) => { setCurrentScreen(screen); if (screen !== 'dashboard') setSuccessMessage(null); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleLogout = () => { clearAuthData(); setIsLoggedIn(false); setProfData(null); setClasses([]); setMatieres([]); setEvaluations([]); };

  const handleLoadClasseStudents = async (classeId: number) => {
    try {
      const res = await fetch(`/smart/public/api/v1/teacher/classes/${classeId}/details`, { credentials: 'include', headers: { Accept: 'application/json' } });
      if (res.ok) { const data = await res.json(); setClasseStudents(data); setSelectedClasse(classes.find(c => c.id === classeId) || null); handleNavigate('class_details'); }
    } catch {}
  };

  const handleLoadStudentProfile = async (eleveId: number) => {
    try {
      const res = await apiFetch(`/teacher/eleves/${eleveId}/evolution`);
      if (res.ok) {
        const data = await res.json();
        const eleve = classeStudents.find(s => s.id === eleveId);
        setSelectedStudent({ evolution: data, ...eleve, classeName: selectedClasse?.libelle || '', totalStudents: classeStudents.length });
        handleNavigate('student_profile');
      }
    } catch {}
  };

  const handleAddSchool = async () => {
    if (!addSchoolCode.trim()) return;
    setAddSchoolLoading(true); setAddSchoolError(null);
    try {
      const res = await apiFetch('/teacher/add-school', { method: 'POST', body: JSON.stringify({ code: addSchoolCode.trim() }) });
      const data = await res.json();
      if (res.ok) { setAddSchoolCode(''); setShowSchoolModal(false); await loadDashboardData(); } else setAddSchoolError(data.message || 'Erreur');
    } catch { setAddSchoolError('Erreur reseau'); } finally { setAddSchoolLoading(false); }
  };

  const handleSelectSchool = async (schoolId: number) => {
    try { await apiFetch('/teacher/select-school', { method: 'POST', body: JSON.stringify({ school_id: schoolId }) }); setSelectedClasse(null); setLoading(true); await loadDashboardData(); setShowSchoolModal(false); } catch {}
  };

  const handleSelectClasse = (classe: Classe) => { setSelectedClasse(classe); setShowClassModal(false); };

  const handleCreateAssessment = async (assessment: any) => {
    try { const res = await apiFetch('/teacher/evaluations', { method: 'POST', body: JSON.stringify(assessment) }); if (res.ok) { await loadDashboardData(); handleNavigate('assessments'); } } catch {}
  };

  const handleStoreGrades = async (evaluationId: number, notes: any[]) => {
    try { const res = await apiFetch('/teacher/grades', { method: 'POST', body: JSON.stringify({ evaluation_id: evaluationId, notes }) }); if (res.ok) setSuccessMessage('Notes enregistrees avec succes !'); return res.ok; } catch { return false; }
  };

  const loadNotifications = useCallback(async () => { try { const data = await fetchNotifications(); if (data.unread_count !== undefined) setUnreadNotificationsCount(data.unread_count); } catch {} }, []);

  useEffect(() => { if (isLoggedIn && !loading) { loadNotifications(); const interval = setInterval(loadNotifications, 30000); return () => clearInterval(interval); } }, [isLoggedIn, loading, loadNotifications]);

  const handleTestNotification = async () => {
    setTestNotifLoading(true); setTestNotifMessage(null);
    try { const data = await testPushNotification(); if (data.success) { setTestNotifMessage('Notification envoyee !'); await loadNotifications(); } else setTestNotifMessage(data.message || 'Erreur'); }
    catch { setTestNotifMessage('Erreur reseau'); } finally { setTestNotifLoading(false); setTimeout(() => setTestNotifMessage(null), 5000); }
  };

  const filteredEvaluations = selectedClasse ? evaluations.filter(e => e.classe?.id === selectedClasse.id) : evaluations;

  // Magic link: consume token and reload
  if (magicLink) {
    return <MagicConsumeScreen purpose={magicLink.purpose} token={magicLink.token} />;
  }

  if (!isLoggedIn) return <LoginScreen onLoginSuccess={() => { setIsLoggedIn(true); setLoading(true); }} />;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div className="w-8 h-8 border-2 border-navy-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-gray-900 font-sans">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />

      {currentScreen !== 'login' && (
        <Sidebar
          currentScreen={currentScreen} onNavigate={handleNavigate}
          teacherName={profData?.nom_complet || 'Professeur'} teacherInitials={profData?.prenom?.[0] + profData?.nom?.[0] || 'P'}
          schoolName={profData?.school || ''} unreadNotificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)} onOpenSchoolSelection={() => setShowSchoolModal(true)}
          onLogout={handleLogout} onOpenChangePin={() => setIsChangePinOpen(true)} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
        />
      )}

      <div className={`relative z-10 ${currentScreen !== 'login' ? 'lg:ml-64' : ''}`}>
        {currentScreen !== 'login' && (
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-navy-100 px-4 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-800 hover:bg-navy-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{currentScreen === 'dashboard' ? 'Tableau de bord' : currentScreen === 'assessments' ? 'Evaluations' : currentScreen === 'class_details' ? selectedClasse?.libelle || 'Classe' : currentScreen === 'student_profile' ? 'Profil eleve' : currentScreen === 'create_remark' ? 'Nouvelle remarque' : currentScreen === 'interrogation' ? 'Interrogation' : currentScreen === 'presences' ? 'Presences' : currentScreen === 'messaging' ? 'Messages' : 'ClassiNote'}</h1>
                {selectedClasse && currentScreen !== 'login' && <p className="text-xs text-gray-400">{selectedClasse.libelle} &middot; {selectedClasse.eleves_count || '&mdash;'} eleves</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedClasse && classes.length > 1 && (
                <button onClick={() => setShowClassModal(true)} className="px-3 py-1.5 rounded-xl bg-navy-50 text-xs font-medium text-navy-800 hover:bg-navy-100 transition-colors flex items-center gap-1.5 border border-navy-100">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  {selectedClasse.libelle}
                </button>
              )}
              <button onClick={() => setIsNotificationsOpen(true)} className="relative w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-800 hover:bg-navy-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadNotificationsCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}</span>}
              </button>
            </div>
          </header>
        )}

        <main className="relative z-10">
          {currentScreen === 'dashboard' && <DashboardScreen onNavigate={handleNavigate} teacherName={profData?.nom_complet || 'Professeur'} subjects={matieres.map(m => m.libelle)} stats={{ nb_classes: classes.length, nb_matieres: matieres.length, nb_evaluations: evaluations.length }} classes={classes} evaluations={evaluations} onSelectClass={handleLoadClasseStudents} onTestNotification={handleTestNotification} testNotifLoading={testNotifLoading} successMessage={successMessage} testNotifMessage={testNotifMessage} />}
          {currentScreen === 'assessments' && <AssessmentsScreen evaluations={filteredEvaluations} onNavigate={handleNavigate} onStoreGrades={handleStoreGrades} aiNotesEnabled={profData?.ai_notes_enabled ?? false} />}
          {currentScreen === 'class_details' && <ClassDetailsScreen classeName={selectedClasse?.libelle || ''} students={classeStudents} onNavigate={handleNavigate} onSelectStudent={handleLoadStudentProfile} />}
          {currentScreen === 'student_profile' && selectedStudent && <StudentProfileScreen student={selectedStudent} onNavigate={handleNavigate} />}
          {currentScreen === 'create_assessment' && <CreateAssessmentScreen classes={classes} matieres={matieres} onNavigate={handleNavigate} onCreateAssessment={handleCreateAssessment} />}
          {currentScreen === 'interrogation' && <InterrogationScreen classes={classes} matieres={matieres} onNavigate={handleNavigate} onCreated={loadDashboardData} />}
          {currentScreen === 'presences' && <PresencesScreen classes={classes} matieres={matieres} onNavigate={handleNavigate} />}
          {currentScreen === 'messaging' && <MessagingScreen onNavigate={handleNavigate} classes={classes} />}
          {currentScreen === 'create_remark' && <CreateRemarkScreen classes={classes} onNavigate={handleNavigate} onSuccess={loadDashboardData} />}
        </main>

        {currentScreen !== 'login' && <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />}
      </div>

      <NotificationPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} onNotificationsUpdate={loadNotifications} />
      <ChangePinModal isOpen={isChangePinOpen} onClose={() => setIsChangePinOpen(false)} />

      {showPinModal && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-navy-200">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Session securisee</h2>
              <p className="text-sm text-gray-400 mt-2">Saisissez votre PIN a 4 chiffres</p>
            </div>
            <form onSubmit={handlePinVerify} className="bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-navy-100">
              <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="&bull; &bull; &bull; &bull;" maxLength={4} autoFocus
                className="w-full px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.5em] bg-navy-50 border border-navy-200 rounded-xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-navy-400 transition-all" />
              {pinError && <p className="text-xs text-rose-500 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{pinError}</p>}
              <button type="submit" disabled={isPinLoading || pinInput.length !== 4}
                className="w-full h-12 bg-gradient-to-r from-navy-800 to-navy-600 hover:from-navy-600 hover:to-navy-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-navy-200 disabled:opacity-40 cursor-pointer transition-all">
                {isPinLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Deverrouiller'}
              </button>
            </form>
            <button onClick={handleLogout} className="w-full mt-4 py-3 text-gray-400 hover:text-gray-600 font-medium text-sm rounded-xl transition-colors cursor-pointer">Se deconnecter</button>
          </div>
        </div>
      )}

      {showSchoolModal && (
        <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 border border-navy-100 animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-900">Changer d'ecole</h3>
            {schools.map((s: any) => (
              <button key={s.id} onClick={() => handleSelectSchool(s.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${profData?.school_id === s.id ? 'border-violet-300 bg-navy-50' : 'border-gray-200 hover:bg-navy-50'}`}>
                <p className="text-sm font-bold text-gray-900">{s.nom}</p>
                {profData?.school_id === s.id && <span className="text-[10px] text-navy-800 font-semibold">Ecole actuelle</span>}
              </button>
            ))}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-500 mb-2">Ajouter une ecole</p>
              <div className="flex gap-2">
                <input value={addSchoolCode} onChange={(e) => setAddSchoolCode(e.target.value)} placeholder="Code d'acces"
                  className="flex-1 px-3 py-2.5 text-sm bg-navy-50 border border-navy-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-400" />
                <button onClick={handleAddSchool} disabled={addSchoolLoading || !addSchoolCode.trim()} className="px-4 py-2.5 bg-navy-800 text-white text-sm font-bold rounded-xl hover:bg-navy-500 disabled:opacity-40">{addSchoolLoading ? '...' : 'Ajouter'}</button>
              </div>
              {addSchoolError && <p className="text-xs text-rose-500 mt-1">{addSchoolError}</p>}
            </div>
            <button onClick={() => setShowSchoolModal(false)} className="w-full py-2.5 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors">Fermer</button>
          </div>
        </div>
      )}

      {showClassModal && (
        <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 border border-navy-100 animate-scaleIn">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-navy-200">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Choisir une classe</h3>
              <p className="text-xs text-gray-400 mt-1">Selectionnez la classe sur laquelle travailler</p>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
              {classes.map((c) => (
                <button key={c.id} onClick={() => handleSelectClasse(c)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center justify-between ${selectedClasse?.id === c.id ? 'border-violet-300 bg-navy-50' : 'border-gray-200 hover:bg-navy-50'}`}>
                  <div><p className="text-sm font-bold text-gray-900">{c.libelle}</p>{c.eleves_count && <p className="text-[11px] text-gray-400">{c.eleves_count} eleves</p>}</div>
                  {selectedClasse?.id === c.id && <svg className="w-5 h-5 text-navy-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

