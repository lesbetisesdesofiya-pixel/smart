import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, getUser, setAuthData, clearAuthData, recordActivity, getLastActivityTime, unlock, fetchNotifications, testPushNotification } from './api';
import { initFirebaseMessaging, requestPushPermission, onForegroundMessage } from './firebase';
import { ScreenType } from './types';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { NotificationModal } from './components/NotificationModal';
import { ClassiNoteInstallPrompt } from './components/ClassiNoteInstallPrompt';
import { PushNotificationBanner } from './components/PushNotificationBanner';
import { ChangePinModal } from './components/ChangePinModal';

import { LoginScreen } from './components/screens/LoginScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { GradeEntryScreen } from './components/screens/GradeEntryScreen';
import { AssessmentsScreen } from './components/screens/AssessmentsScreen';
import { ClassDetailsScreen } from './components/screens/ClassDetailsScreen';
import { StudentProfileScreen } from './components/screens/StudentProfileScreen';
import { CreateAssessmentScreen } from './components/screens/CreateAssessmentScreen';
import { InterrogationScreen } from './components/screens/InterrogationScreen';
import { PresencesScreen } from './components/screens/PresencesScreen';
import { MessagingScreen } from './components/screens/MessagingScreen';
import { MagicLinkScreen } from './components/screens/MagicLinkScreen';

interface ProfData {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  school: string;
  school_id: number;
  ai_notes_enabled?: boolean;
}

interface Classe {
  id: number;
  libelle: string;
  section?: { libelle: string };
  eleves_count?: number;
}

interface Matiere {
  id: number;
  libelle: string;
}

interface Evaluation {
  id: number;
  titre: string;
  type: string;
  date: string;
  coefficient: number;
  note_sur: number;
  classe: Classe;
  matiere: Matiere;
  notes: any[];
  has_notes?: boolean;
}

interface EleveClasse {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  moyenne: number | null;
  nb_notes: number;
  rank: number;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getUser());
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [showPinModal, setShowPinModal] = useState(() => !!getUser());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Magic link detection - immediate on mount
  const [magicLink, setMagicLink] = useState<{ purpose: string; token: string } | null>(() => {
    const hash = window.location.hash;
    const match = hash.match(/#\/magic\/([^?]+)\?token=(.+)/);
    if (match) {
      return { purpose: match[1], token: match[2] };
    }
    return null;
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const res = await apiFetch('/teacher/dashboard');
      if (res.ok) {
        const data = await res.json();
        setProfData(data.prof);
        setClasses(data.classes || []);
        setMatieres(data.matieres || []);
        setEvaluations((data.evaluations || []).map((e: any) => ({
          ...e,
          notes_saisies: e.notes_count || 0,
          total_eleves: e.classe?.eleves_count || 30,
        })));
        if (data.classes?.length > 0 && !selectedClasse) {
          if (data.classes.length === 1) {
            setSelectedClasse(data.classes[0]);
          } else {
            setShowClassModal(true);
          }
        }
      }
      const schoolsRes = await apiFetch('/teacher/schools');
      if (schoolsRes.ok) {
        const sData = await schoolsRes.json();
        setSchools(sData.schools || []);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboardData();
    }
  }, [isLoggedIn]);

  // Idle detection – interval-based (like subscription check)
  useEffect(() => {
    if (!isLoggedIn || currentScreen === 'login') return;

    const IDLE_TIMEOUT = 5 * 60 * 1000;
    const CHECK_INTERVAL = 30 * 1000;

    recordActivity();

    // Firebase Push Notifications
    initFirebaseMessaging().then(({ messaging, registration }) => {
      requestPushPermission(registration);
      if (messaging) {
        onForegroundMessage((payload) => {
          const title = payload.notification?.title || 'ClassiNote';
          const body = payload.notification?.body || '';
          if (title && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/app/prof/icons/icon-192x192.png' });
          }
          loadNotifications();
        });
      }
    });

    // Periodic check every 30s if idle > 5min → show PIN
    const idleCheck = setInterval(() => {
      const elapsed = Date.now() - getLastActivityTime();
      if (elapsed >= IDLE_TIMEOUT) {
        setShowPinModal(true);
      }
    }, CHECK_INTERVAL);

    // Activity listeners – just record activity
    const handleActivity = () => { recordActivity(); };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - getLastActivityTime();
        if (elapsed >= IDLE_TIMEOUT) {
          setShowPinModal(true);
        }
      }
    };

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
    e.preventDefault();
    if (pinInput.length !== 4) return;
    setIsPinLoading(true);
    setPinError(null);
    try {
      const data = await unlock(pinInput);
      if (data.success) {
        setShowPinModal(false);
        setPinInput('');
        recordActivity();
        loadDashboardData();
      } else {
        setPinError(data.message || 'PIN incorrect');
      }
    } catch {
      setPinError('Erreur de vérification');
    } finally {
      setIsPinLoading(false);
    }
  };

  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
    if (screen !== 'dashboard') {
      setSuccessMessage(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    clearAuthData();
    setIsLoggedIn(false);
    setProfData(null);
    setClasses([]);
    setMatieres([]);
    setEvaluations([]);
  };

  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleLoadClasseStudents = async (classeId: number) => {
    console.log('[DEBUG] handleLoadClasseStudents called with classeId:', classeId);
    try {
      const res = await fetch(`/api/v1/teacher/classes/${classeId}/details`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      console.log('[DEBUG] Response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[DEBUG] Students loaded:', data.length);
        setClasseStudents(data);
        setSelectedClasse(classes.find(c => c.id === classeId) || null);
        handleNavigate('class_details');
      } else {
        const errData = await res.json().catch(() => ({}));
        console.log('[DEBUG] Error:', errData);
      }
    } catch (err) {
      console.log('[DEBUG] Exception:', err);
    }
  };

  const handleLoadStudentProfile = async (eleveId: number) => {
    try {
      const res = await apiFetch(`/teacher/eleves/${eleveId}/evolution`);
      if (res.ok) {
        const data = await res.json();
        const eleve = classeStudents.find(s => s.id === eleveId);
        setSelectedStudent({
          evolution: data,
          ...eleve,
          classeName: selectedClasse?.libelle || '',
          totalStudents: classeStudents.length,
        });
        handleNavigate('student_profile');
      }
    } catch (err) {
    }
  };

  const handleSelectClassFilter = (classeId: number) => {
    handleLoadClasseStudents(classeId);
  };

  const handleAddSchool = async () => {
    if (!addSchoolCode.trim()) return;
    setAddSchoolLoading(true);
    setAddSchoolError(null);
    try {
      const res = await apiFetch('/teacher/add-school', {
        method: 'POST',
        body: JSON.stringify({ code: addSchoolCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddSchoolCode('');
        setShowSchoolModal(false);
        await loadDashboardData();
      } else {
        setAddSchoolError(data.message || 'Erreur');
      }
    } catch {
      setAddSchoolError('Erreur réseau');
    } finally {
      setAddSchoolLoading(false);
    }
  };

  const handleSelectSchool = async (schoolId: number) => {
    try {
      await apiFetch('/teacher/select-school', {
        method: 'POST',
        body: JSON.stringify({ school_id: schoolId }),
      });
      setSelectedClasse(null);
      setLoading(true);
      await loadDashboardData();
      setShowSchoolModal(false);
    } catch {}
  };

  const handleSelectClasse = (classe: Classe) => {
    setSelectedClasse(classe);
    setShowClassModal(false);
  };

  const handleCreateAssessment = async (assessment: any) => {
    try {
      const res = await apiFetch('/teacher/evaluations', {
        method: 'POST',
        body: JSON.stringify(assessment),
      });
      if (res.ok) {
        await loadDashboardData();
        handleNavigate('assessments');
      }
    } catch (err) {
    }
  };

  const handleStoreGrades = async (evaluationId: number, notes: any[]) => {
    try {
      const res = await apiFetch('/teacher/grades', {
        method: 'POST',
        body: JSON.stringify({ evaluation_id: evaluationId, notes }),
      });
      if (res.ok) {
        setSuccessMessage('Notes enregistrées avec succès !');
      }
      return res.ok;
    } catch (err) {
      return false;
    }
  };

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [testNotifLoading, setTestNotifLoading] = useState(false);
  const [testNotifMessage, setTestNotifMessage] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      if (data.unread_count !== undefined) {
        setUnreadNotificationsCount(data.unread_count);
      }
    } catch (err) {
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && !loading) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, loading, loadNotifications]);

  const handleTestNotification = async () => {
    setTestNotifLoading(true);
    setTestNotifMessage(null);
    try {
      const data = await testPushNotification();
      if (data.success) {
        setTestNotifMessage('Notification de test envoyée !');
        await loadNotifications();
      } else {
        setTestNotifMessage(data.message || 'Erreur lors de l\'envoi');
      }
    } catch {
      setTestNotifMessage('Erreur réseau');
    } finally {
      setTestNotifLoading(false);
      setTimeout(() => setTestNotifMessage(null), 5000);
    }
  };

  if (magicLink) {
    return (
      <MagicLinkScreen
        purpose={magicLink.purpose}
        token={magicLink.token}
        onAuthSuccess={() => {
          setMagicLink(null);
          setIsLoggedIn(true);
          setLoading(true);
          window.location.hash = '';
        }}
      />
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => { setIsLoggedIn(true); setLoading(true); }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Filter evaluations by selected class
  const filteredEvaluations = selectedClasse
    ? evaluations.filter(e => e.classe?.id === selectedClasse.id)
    : evaluations;

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col relative selection:bg-primary-fixed selection:text-on-primary-fixed">
      {currentScreen !== 'login' && (
        <Header
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          teacherAvatar={profData?.prenom?.[0] + profData?.nom?.[0] || 'P'}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          currentSchoolName={profData?.school || ''}
          onOpenSchoolSelection={() => setShowSchoolModal(true)}
          onLogout={handleLogout}
          onOpenChangePin={() => setIsChangePinOpen(true)}
        />
      )}

      {/* DEBUG */}
      {debugInfo && (
        <div className="bg-yellow-100 border-b border-yellow-300 p-2 text-xs font-mono text-yellow-800">
          <pre>{debugInfo}</pre>
          <button onClick={() => setDebugInfo('')} className="text-yellow-600 underline">clear</button>
        </div>
      )}

      {/* Sticky Class Banner */}
      {currentScreen !== 'login' && selectedClasse && classes.length > 1 && (
        <div className="sticky top-0 z-30 bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">school</span>
            <span className="font-bold text-sm">{selectedClasse.libelle}</span>
            {selectedClasse.eleves_count && (
              <span className="text-[11px] bg-blue-500/50 px-2 py-0.5 rounded-full">{selectedClasse.eleves_count} élèves</span>
            )}
          </div>
          <button
            onClick={() => setShowClassModal(true)}
            className="text-[11px] font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Changer
          </button>
        </div>
      )}

      <div className="flex-1">
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onNavigate={handleNavigate}
            teacherName={profData?.nom_complet || 'Professeur'}
            subjects={matieres.map(m => m.libelle)}
            hasUnreadMessages={false}
            stats={{
              nb_classes: classes.length,
              nb_matieres: matieres.length,
              nb_evaluations: evaluations.length,
            }}
            classes={classes}
            onSelectClass={handleLoadClasseStudents}
            onTestNotification={handleTestNotification}
            testNotifLoading={testNotifLoading}
            successMessage={successMessage}
            testNotifMessage={testNotifMessage}
          />
        )}

        {currentScreen === 'grade_entry' && (
          <GradeEntryScreen
            evaluations={filteredEvaluations}
            onStoreGrades={handleStoreGrades}
            onNavigate={handleNavigate}
            aiNotesEnabled={profData?.ai_notes_enabled ?? false}
          />
        )}

        {currentScreen === 'assessments' && (
          <AssessmentsScreen
            evaluations={filteredEvaluations}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'class_details' && (
          <ClassDetailsScreen
            classeName={selectedClasse?.libelle || ''}
            students={classeStudents}
            onNavigate={handleNavigate}
            onSelectStudent={handleLoadStudentProfile}
          />
        )}

        {currentScreen === 'student_profile' && selectedStudent && (
          <StudentProfileScreen
            student={selectedStudent}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'create_assessment' && (
          <CreateAssessmentScreen
            classes={classes}
            matieres={matieres}
            onNavigate={handleNavigate}
            onCreateAssessment={handleCreateAssessment}
          />
        )}

        {currentScreen === 'interrogation' && (
          <InterrogationScreen classes={classes} matieres={matieres} onNavigate={handleNavigate} onCreated={loadDashboardData} />
        )}

        {currentScreen === 'presences' && (
          <PresencesScreen classes={classes} matieres={matieres} onNavigate={handleNavigate} />
        )}

        {currentScreen === 'messaging' && (
          <MessagingScreen onNavigate={handleNavigate} />
        )}
      </div>

      <PushNotificationBanner />

      <BottomNav
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        hasUnreadMessages={false}
      />

      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNotificationsUpdate={loadNotifications}
      />

      <ClassiNoteInstallPrompt />

      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />

      {showPinModal && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Session sécurisée</h2>
              <p className="text-xs text-slate-500 mt-2">Saisissez votre PIN à 4 chiffres</p>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-xl border border-slate-200">
              <form onSubmit={handlePinVerify} className="space-y-4">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="• • • •"
                  maxLength={4}
                  autoFocus
                  className="w-full px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />

                {pinError && (
                  <p className="text-xs text-red-600 text-center font-medium bg-red-50 p-2 rounded-xl border border-red-200">{pinError}</p>
                )}

                <button
                  type="submit"
                  disabled={isPinLoading || pinInput.length !== 4}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 cursor-pointer transition-all"
                >
                  {isPinLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">lock_open</span>
                      <span>Déverrouiller</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-4 py-3 text-slate-400 hover:text-slate-600 font-medium text-xs rounded-xl transition-colors cursor-pointer"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}

      {showSchoolModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Changer d'école</h3>
            {schools.map((s: any) => (
              <button key={s.id} onClick={() => handleSelectSchool(s.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${profData?.school_id === s.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <p className="text-sm font-bold text-slate-900">{s.nom}</p>
                {profData?.school_id === s.id && <span className="text-[10px] text-blue-600 font-semibold">École actuelle</span>}
              </button>
            ))}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-bold text-slate-600 mb-2">Ajouter une école</p>
              <div className="flex gap-2">
                <input value={addSchoolCode} onChange={(e) => setAddSchoolCode(e.target.value)} placeholder="Code d'accès"
                  className="flex-1 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <button onClick={handleAddSchool} disabled={addSchoolLoading || !addSchoolCode.trim()}
                  className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40">
                  {addSchoolLoading ? '...' : 'Ajouter'}
                </button>
              </div>
              {addSchoolError && <p className="text-xs text-red-600 mt-1">{addSchoolError}</p>}
            </div>
            <button onClick={() => setShowSchoolModal(false)} className="w-full py-2.5 text-slate-500 text-sm font-medium hover:text-slate-700">Fermer</button>
          </div>
        </div>
      )}

      {showClassModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-blue-600 text-2xl">school</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Choisir une classe</h3>
              <p className="text-xs text-slate-500 mt-1">Sélectionnez la classe sur laquelle travailler</p>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectClasse(c)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    selectedClasse?.id === c.id
                      ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{c.libelle}</p>
                    {c.eleves_count && (
                      <p className="text-[11px] text-slate-500">{c.eleves_count} élèves</p>
                    )}
                  </div>
                  {selectedClasse?.id === c.id && (
                    <span className="material-symbols-outlined text-blue-600 text-xl">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
