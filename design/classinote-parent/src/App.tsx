import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, getUser, recordActivity, getLastActivityTime, unlock, fetchNotifications } from './api';
import { initFirebaseMessaging, requestPushPermission, onForegroundMessage } from './firebase';
import {
  NavigationTab,
  Parent,
  Grade,
  Notice,
  PaymentItem,
  TimetableClass,
  StaffMember,
  AttendanceRecord
} from './types';
import {
  initialParent,
  initialGrades,
  initialNotices,
  initialPayments,
  initialTimetable,
  initialStaff,
  initialAttendance,
  initialChatMessages
} from './data/mockData';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';

import { ChildSelectorModal } from './components/ChildSelectorModal';
import { NotificationsModal } from './components/NotificationsModal';
import { PaymentModal } from './components/PaymentModal';
import { MessageTeacherModal } from './components/MessageTeacherModal';
import { TeacherChatModal } from './components/TeacherChatModal';
import { AttendanceModal } from './components/AttendanceModal';

import { HomeScreen } from './screens/HomeScreen';
import { NotesScreen } from './screens/NotesScreen';
import { AvisScreen } from './screens/AvisScreen';
import { PaiementsScreen } from './screens/PaiementsScreen';
import { ScheduleScreen } from './screens/ScheduleScreen';
import { TeamScreen } from './screens/TeamScreen';
import { SupportScreen } from './screens/SupportScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { QrScannerScreen } from './screens/QrScannerScreen';
import { LoginScreen } from './screens/LoginScreen';
import { MagicLinkScreen } from './screens/MagicLinkScreen';

import { ClassiNoteInstallPrompt } from './components/ClassiNoteInstallPrompt';
import { PushNotificationBanner } from './components/PushNotificationBanner';
import { ChangePinModal } from './components/ChangePinModal';

const isMagicDashboardSession = () => sessionStorage.getItem('classinote_magic_dashboard') === '1';

const getMagicTab = (): NavigationTab | null => {
  const tab = sessionStorage.getItem('classinote_magic_tab');
  if (tab) {
    sessionStorage.removeItem('classinote_magic_tab');
    return tab as NavigationTab;
  }
  return null;
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getUser());
  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => getMagicTab() || 'accueil');
  const [parent, setParent] = useState<Parent>(initialParent);
  const [isChildSelectorOpen, setIsChildSelectorOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(() => !!getUser() && !isMagicDashboardSession());
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinLoading, setIsPinLoading] = useState(false);

  const magicRoute = useMagicRoute();
  if (magicRoute) {
    return <MagicLinkScreen purpose={magicRoute.purpose} token={magicRoute.token} />;
  }

  const activeChild =
    parent.children.find((c) => c.id === parent.activeChildId) || parent.children[0];

  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [timetable] = useState<TimetableClass[]>(initialTimetable);
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [attendanceRecords] = useState<AttendanceRecord[]>(initialAttendance);
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const [blockedEleves, setBlockedEleves] = useState<any[]>([]);

  // Fetch real children from database when parent is logged in
  const loadParentData = useCallback(async () => {
    if (!isLoggedIn) return;
    setSubscriptionChecked(false);
    try {
      const [resEnfants, resRemarques, resAnnonces, resNotes] = await Promise.all([
        apiFetch('/parent/enfants').catch(() => null),
        apiFetch('/parent/remarques').catch(() => null),
        apiFetch('/parent/avis').catch(() => null),
        apiFetch('/parent/notes').catch(() => null),
      ]);

      if (resEnfants?.ok) {
        const data = await resEnfants.json();
        if (data.success && Array.isArray(data.enfants) && data.enfants.length > 0) {
          const mappedChildren = data.enfants.map((item: any) => {
            return {
              id: String(item.id),
              name: `${item.nom || ''} ${item.prenom || ''}`.trim(),
              class: item.classe?.libelle || 'Classe',
              photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
              school: item.ecole?.nom || 'Établissement',
              nextCourse: 'Mathématiques',
              isPresent: true,
              accessLocked: !!item.access_locked,
              lockMessage: item.lock_message || null,
              subscriptionPaid: !!item.subscription_paid,
            };
          });

          setParent((prev) => ({
            ...prev,
            name: data.parent?.nom_complet || prev.name,
            activeChildId: prev.activeChildId && mappedChildren.some((c: any) => c.id === prev.activeChildId)
              ? prev.activeChildId
              : mappedChildren[0].id,
            children: mappedChildren,
          }));

          if (data.blocked_eleves) {
            setBlockedEleves(data.blocked_eleves);
          }
        }
      }

      // Load remarques (teacher remarks)
      if (resRemarques?.ok) {
        const remarques = await resRemarques.json();
        if (Array.isArray(remarques)) {
          const mappedRemarques: Notice[] = remarques.map((r: any) => ({
            id: `rem-${r.id}`,
            childId: String(r.eleve_id),
            authorName: r.prof ? `${r.prof.prenom || ''} ${r.prof.nom || ''}`.trim() : 'Professeur',
            authorRole: r.prof?.affectations?.[0]?.matiere?.libelle || 'Professeur',
            authorPhoto: '',
            date: r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
            type: r.type === 'felicitations' ? 'Félicitations' : r.type === 'attention' ? 'Attention' : 'Information générale',
            badgeBg: r.type === 'felicitations' ? 'bg-emerald-100' : r.type === 'attention' ? 'bg-amber-100' : 'bg-blue-100',
            badgeTextColor: r.type === 'felicitations' ? 'text-emerald-800' : r.type === 'attention' ? 'text-amber-800' : 'text-blue-800',
            content: r.contenu || '',
            isNew: r.created_at ? (Date.now() - new Date(r.created_at).getTime()) < 86400000 * 2 : false,
          }));
          setNotices(mappedRemarques);
        }
      }

      // Load annonces (school announcements)
      if (resAnnonces?.ok) {
        const annonces = await resAnnonces.json();
        if (Array.isArray(annonces) && annonces.length > 0) {
          const mappedAnnonces: Notice[] = annonces.map((a: any) => ({
            id: `ann-${a.id}`,
            childId: 'all',
            authorName: a.author?.name || 'Administration',
            authorRole: 'Administration',
            authorPhoto: '',
            date: a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
            type: 'Information générale',
            badgeBg: 'bg-blue-100',
            badgeTextColor: 'text-blue-800',
            content: a.contenu || '',
            isNew: a.created_at ? (Date.now() - new Date(a.created_at).getTime()) < 86400000 * 2 : false,
          }));
          setNotices(prev => [...mappedAnnonces, ...prev]);
        }
      }

      // Load notes (grades)
      if (resNotes?.ok) {
        const notesData = await resNotes.json();
        if (Array.isArray(notesData) && notesData.length > 0) {
          const subjectColors: Record<string, { accent: string; badgeBg: string; badgeText: string }> = {
            'Mathématiques': { accent: 'border-blue-500', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800' },
            'Français': { accent: 'border-rose-500', badgeBg: 'bg-rose-100', badgeText: 'text-rose-800' },
            'Sciences': { accent: 'border-emerald-500', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800' },
            'Histoire': { accent: 'border-amber-500', badgeBg: 'bg-amber-100', badgeText: 'text-amber-800' },
            'Anglais': { accent: 'border-purple-500', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800' },
          };
          const defaultColor = { accent: 'border-slate-400', badgeBg: 'bg-slate-100', badgeText: 'text-slate-700' };

          const mappedGrades: Grade[] = notesData.map((n: any) => {
            const evalData = n.evaluation || {};
            const periode = evalData.periode || {};
            const matiere = evalData.matiere || {};
            let term: 'T1' | 'T2' | 'T3' = 'T1';
            const periodeLib = (periode.libelle || '').toLowerCase();
            if (periodeLib.includes('2') || periodeLib.includes('deux')) term = 'T2';
            else if (periodeLib.includes('3') || periodeLib.includes('trois')) term = 'T3';

            const colors = Object.entries(subjectColors).find(([key]) =>
              (matiere.libelle || '').toLowerCase().includes(key.toLowerCase())
            )?.[1] || defaultColor;

            return {
              id: String(n.id),
              childId: String(n.eleve_id),
              subject: matiere.libelle || 'Matière',
              title: evalData.titre || 'Évaluation',
              score: n.note ?? 0,
              maxScore: evalData.note_sur || 20,
              date: evalData.date || '',
              term,
              coefficient: evalData.coefficient || 1,
              accentColor: colors.accent,
              badgeBg: colors.badgeBg,
              badgeText: colors.badgeText,
            };
          });
          setGrades(mappedGrades);
        }
      }
    } catch (err) {
    } finally {
      setSubscriptionChecked(true);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  // Idle detection – interval-based (like subscription check)
  useEffect(() => {
    if (!isLoggedIn) return;

    const IDLE_TIMEOUT = 5 * 60 * 1000;
    const CHECK_INTERVAL = 30 * 1000;

    recordActivity();

    // Firebase Push Notifications
    initFirebaseMessaging().then(({ messaging, registration }) => {
      requestPushPermission(registration);
      if (messaging) {
        onForegroundMessage((payload) => {
          loadNotifications();
          const title = payload.notification?.title || 'ClassiNote';
          const body = payload.notification?.body || '';
          if (title && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/app/parent/icons/icon-192x192.png' });
          }
        });
      }
    });

    // Periodic check every 30s if idle > 5min → show PIN
    const idleCheck = setInterval(() => {
      if (isMagicDashboardSession()) return;
      const elapsed = Date.now() - getLastActivityTime();
      if (elapsed >= IDLE_TIMEOUT) {
        setShowPinModal(true);
      }
    }, CHECK_INTERVAL);

    // Activity listeners – just record activity
    const handleActivity = () => { recordActivity(); };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (isMagicDashboardSession()) {
          loadParentData();
          return;
        }
        const elapsed = Date.now() - getLastActivityTime();
        if (elapsed >= IDLE_TIMEOUT) {
          setShowPinModal(true);
        }
        loadParentData();
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
  }, [isLoggedIn, loadParentData]);


  // Listen for forbidden events from API calls
  useEffect(() => {
    const handleForbidden = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.lockRelated) {
        setParent((prev) => ({
          ...prev,
          children: prev.children.map((child) =>
            child.id === prev.activeChildId
              ? {
                  ...child,
                  accessLocked: true,
                  lockMessage: detail.message || "Accès verrouillé par l'administration. Veuillez régulariser le paiement de votre abonnement auprès de votre établissement pour continuer à accéder aux informations de votre enfant.",
                }
              : child
          ),
        }));
        setSubscriptionChecked(true);
      } else if (detail?.subscriptionRelated) {
        setSubscriptionChecked(true);
      }
    };
    window.addEventListener('api:forbidden', handleForbidden);
    return () => window.removeEventListener('api:forbidden', handleForbidden);
  }, []);

  // Listen for PIN verification to refresh children data
  useEffect(() => {
    const handlePinVerified = () => {
      loadParentData();
    };
    window.addEventListener('pin:verified', handlePinVerified);
    return () => window.removeEventListener('pin:verified', handlePinVerified);
  }, [loadParentData]);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PaymentItem | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isTeacherChatOpen, setIsTeacherChatOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<StaffMember | null>(null);

  const [activeReceiptNum, setActiveReceiptNum] = useState<string | null>(null);

  const [subscriptionChecked, setSubscriptionChecked] = useState(false);

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      if (data.unread_count !== undefined) {
        setUnreadNotifCount(data.unread_count);
      }
    } catch (err) {
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, loadNotifications]);

  // Derived financial calculations
  const totalPaidAmount = payments
    .filter((p) => p.status === 'PAYÉ' && p.childId === activeChild.id)
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter(
    (p) => p.status === 'EN ATTENTE' && p.childId === activeChild.id
  );
  const remainingDueDateCount = pendingPayments.length || 1;

  const [remainingAmount, setRemainingAmount] = useState<number>(150000);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNoticesCount, setUnreadNoticesCount] = useState(0);

  const childGrades = grades.filter((g) => g.childId === activeChild.id);
  const childNotices = notices.filter((n) => n.childId === activeChild.id || n.childId === 'all');

  // Update unread notices count when notices change or when navigating away from avis
  useEffect(() => {
    const viewedIds = JSON.parse(localStorage.getItem('classinote_viewed_notices') || '[]');
    const count = childNotices.filter((n) => {
      if (!n.isNew) return false;
      return !viewedIds.includes(n.id);
    }).length;
    setUnreadNoticesCount(count);
  }, [childNotices, currentTab]);

  // Handlers
  const handleSelectChild = (id: string) => {
    setParent((prev) => ({ ...prev, activeChildId: id }));
    setIsChildSelectorOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('classinote_parent_user');
    sessionStorage.removeItem('classinote_magic_dashboard');
    setIsLoggedIn(false);
    window.location.reload();
  };

  const handlePinVerify = async (pin: string) => {
    setIsPinLoading(true);
    setPinError(null);
    try {
      const data = await unlock(pin);
      if (!data.success) {
        setPinError(data.message || 'Code incorrect.');
        return;
      }
      setShowPinModal(false);
      recordActivity();
      await loadParentData();
    } catch {
      setPinError('Erreur de vérification du code.');
    } finally {
      setIsPinLoading(false);
    }
  };

  const handleAddChildViaQr = (childName: string, className: string) => {
    const newChildId = `child-${Date.now()}`;
    const newChild = {
      id: newChildId,
      name: childName,
      class: className,
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      school: 'Complexe Scolaire ClassiNote',
      nextCourse: 'Mathématiques à 08:30',
      isPresent: true
    };

    setParent((prev) => ({
      ...prev,
      activeChildId: newChildId,
      children: [...prev.children, newChild]
    }));

    setCurrentTab('accueil');
  };

  const handlePaymentSuccess = (amountPaid: number, paymentTitle: string) => {
    setRemainingAmount((prev) => Math.max(0, prev - amountPaid));

    const updatedPayments = payments.map((p) => {
      if (p.title === paymentTitle && p.status === 'EN ATTENTE') {
        return { ...p, status: 'PAYÉ' as const, receiptNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}` };
      }
      return p;
    });

    // Add record if custom
    const newPaymentRecord: PaymentItem = {
      id: `p-${Date.now()}`,
      childId: activeChild.id,
      title: paymentTitle,
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: amountPaid,
      currency: 'FCFA',
      status: 'PAYÉ',
      iconName: 'payments',
      receiptNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`
    };

    setPayments([newPaymentRecord, ...updatedPayments]);

    setParent((prev) => ({
      ...prev,
      children: prev.children.map((child) =>
        child.id === prev.activeChildId
          ? { ...child, subscriptionPaid: true }
          : child
      ),
    }));
  };

  const handleOpenTeacherChat = (member: StaffMember) => {
    setSelectedRecipient(member);
    setIsTeacherChatOpen(true);
    // Mark messages as read for this teacher
    setStaff((prev) =>
      prev.map((s) => (s.id === member.id ? { ...s, unreadCount: 0 } : s))
    );
  };

  const handleOpenMessageForTeacherName = (teacherName: string) => {
    const foundStaff = staff.find((s) => s.name.toLowerCase().includes(teacherName.toLowerCase()));
    handleOpenTeacherChat(foundStaff || staff[3]);
  };

  const handleSendChatMessage = (teacherId: string, msgData: Partial<any>) => {
    const newMsg = {
      id: `msg-${Date.now()}`,
      teacherId,
      sender: msgData.sender || 'parent',
      text: msgData.text,
      timestamp: 'À l\'instant',
      attachments: msgData.attachments,
      audioUrl: msgData.audioUrl,
      audioDuration: msgData.audioDuration,
    };

    setChatMessages((prev) => [...prev, newMsg]);

    // Simulated teacher auto-response after 1.5s
    setTimeout(() => {
      const autoReply = {
        id: `msg-${Date.now() + 1}`,
        teacherId,
        sender: 'teacher' as const,
        text: `Bonjour Mme Mensah, bien reçu votre message. Je réponds à votre demande dans les plus brefs délais !`,
        timestamp: 'À l\'instant'
      };
      setChatMessages((prev) => [...prev, autoReply]);
    }, 1500);
  };

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setCurrentTab('accueil');
        }}
      />
    );
  }

  if (!subscriptionChecked) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#375ca6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#757682]">Vérification de votre abonnement...</p>
        </div>
      </div>
    );
  }

  const showBlockOverlay = !!activeChild?.accessLocked;
  const unlockedChildren = parent.children.filter((child) => !child.accessLocked && child.id !== activeChild?.id);

  // Find blocked eleve data with debt info
  const blockedData = blockedEleves.find((b: any) => String(b.id) === parent.activeChildId);
  const moisImpayes = blockedData?.dette?.mois_impayes || [];
  const detteMontant = blockedData?.dette?.montant || 0;
  const totalPaye = blockedData?.dette?.total_paye || 0;
  const montantMensuel = blockedData?.dette?.montant_mensuel || 0;

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans">
      {showBlockOverlay ? (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-[24px] p-6 shadow-lg border border-red-200 max-w-md w-full text-center space-y-5">
            {/* Header */}
            <div className="w-20 h-20 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl text-red-500">lock</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-900">Accès bloqué</h2>
              <p className="text-sm text-red-700 mt-2 leading-relaxed">
                {activeChild?.lockMessage || "Votre accès a été bloqué par votre établissement."}
              </p>
            </div>

            {/* Debt Card */}
            {detteMontant > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center gap-2 text-red-800">
                  <span className="material-symbols-outlined text-xl">payments</span>
                  <span className="font-bold text-sm">Montant restant à régler</span>
                </div>
                <div className="text-center py-3">
                  <span className="text-3xl font-black text-red-700">{detteMontant.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total payé :</span>
                    <span className="font-bold text-emerald-700">{totalPaye.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tarif mensuel :</span>
                    <span className="font-bold">{montantMensuel.toLocaleString('fr-FR')} FCFA/mois</span>
                  </div>
                </div>
                {moisImpayes.length > 0 && (
                  <div className="pt-2 border-t border-red-200">
                    <p className="text-[11px] font-bold text-red-800 mb-1.5">Mois concernés par la dette :</p>
                    <div className="flex flex-wrap gap-1">
                      {moisImpayes.map((mois: string) => (
                        <span key={mois} className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200 capitalize">
                          {mois}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action */}
            <div className="space-y-2">
              <a
                href="https://wa.me/225000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1da851] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                Contacter l'administration
              </a>
              {unlockedChildren.length > 0 && (
                <button
                  onClick={() => setIsChildSelectorOpen(true)}
                  className="w-full py-3 rounded-2xl bg-[#002366] text-white font-bold text-sm hover:bg-[#00113a] transition-colors"
                >
                  Choisir un autre enfant
                </button>
              )}
            </div>
          </div>
          <ChildSelectorModal
            isOpen={isChildSelectorOpen}
            onClose={() => setIsChildSelectorOpen(false)}
            childrenList={parent.children}
            activeChildId={parent.activeChildId}
            onSelectChild={handleSelectChild}
            onOpenQrScanner={() => setCurrentTab('qr')}
          />
          <ClassiNoteInstallPrompt />
        </div>
      ) : (
      <>
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        parent={parent}
        activeChild={activeChild}
        onNavigate={setCurrentTab}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenChildSelector={() => setIsChildSelectorOpen(true)}
        onLogout={handleLogout}
        onOpenChangePin={() => setIsChangePinOpen(true)}
        unreadCount={unreadNotifCount}
      />

      {/* Main Screen Router */}
      <main className="flex-1 w-full pt-3">
        {currentTab === 'accueil' && (
          <HomeScreen
            parent={parent}
            activeChild={activeChild}
            latestGrade={childGrades[0]}
            latestNotice={childNotices[0]}
            onNavigate={setCurrentTab}
            onOpenChildSelector={() => setIsChildSelectorOpen(true)}
            onSelectChild={handleSelectChild}
            onAddChild={() => setCurrentTab('qr')}
            onOpenAttendance={() => setIsAttendanceModalOpen(true)}
            staffAvatars={staff.map((s) => s.photo)}
          />
        )}

        {currentTab === 'notes' && <NotesScreen grades={childGrades} />}

        {currentTab === 'avis' && (
          <AvisScreen notices={childNotices} />
        )}

        {currentTab === 'paiements' && (
          <PaiementsScreen />
        )}

        {currentTab === 'schedule' && (
          <ScheduleScreen
            timetable={timetable}
            onMessageTeacher={handleOpenMessageForTeacherName}
          />
        )}

        {currentTab === 'messages' && (
          <MessagesScreen onUnreadCountChange={setUnreadMessagesCount} />
        )}

        {currentTab === 'team' && (
          <TeamScreen
            staffMembers={staff}
            onOpenMessageModal={handleOpenTeacherChat}
          />
        )}

        {currentTab === 'support' && (
          <SupportScreen onSubmitSuccess={() => setCurrentTab('accueil')} />
        )}

        {currentTab === 'qr' && (
          <QrScannerScreen
            onChildAdded={handleAddChildViaQr}
            onNavigateToSupport={() => setCurrentTab('support')}
          />
        )}
      </main>

      {/* Push Notification Banner */}
      <PushNotificationBanner />

      {/* Fixed Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        unreadNoticesCount={unreadNoticesCount}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Modals & Drawers */}
      <ChildSelectorModal
        isOpen={isChildSelectorOpen}
        onClose={() => setIsChildSelectorOpen(false)}
        childrenList={parent.children}
        activeChildId={parent.activeChildId}
        onSelectChild={handleSelectChild}
        onOpenQrScanner={() => setCurrentTab('qr')}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={setCurrentTab}
        onNotificationsUpdate={loadNotifications}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPendingPayment(null);
        }}
        pendingPayment={pendingPayment}
        remainingAmount={remainingAmount}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <MessageTeacherModal
        isOpen={isMessageModalOpen}
        onClose={() => {
          setIsMessageModalOpen(false);
          setSelectedRecipient(null);
        }}
        recipient={selectedRecipient}
      />

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        activeChild={activeChild}
        records={attendanceRecords}
        onNavigateToSupport={() => setCurrentTab('support')}
      />

      <TeacherChatModal
        isOpen={isTeacherChatOpen}
        onClose={() => setIsTeacherChatOpen(false)}
        teacher={selectedRecipient}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
      />

      {/* Receipt Printable Preview Modal */}
      {activeReceiptNum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#002366]">
                <span className="material-symbols-outlined text-2xl">verified</span>
                <h3 className="font-bold text-sm">Reçu Officiel ClassiNote</h3>
              </div>
              <button
                onClick={() => setActiveReceiptNum(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="bg-[#f8f9ff] p-5 rounded-2xl border border-slate-200 text-xs space-y-3">
              <div className="text-center pb-2 border-b border-slate-200">
                <p className="font-extrabold text-[#00113a] text-sm">COMPLEXE SCOLAIRE CLASSINOTE</p>
                <p className="text-[10px] text-slate-400">Reçu de paiement de scolarité</p>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">N° de Reçu :</span>
                <span className="font-mono font-bold text-[#00113a]">{activeReceiptNum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Élève :</span>
                <span className="font-bold text-[#00113a]">{activeChild.name} ({activeChild.class})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payeur :</span>
                <span>{parent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statut :</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">RÉGLÉ</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => alert(`Impression du reçu ${activeReceiptNum}...`)}
                className="flex-1 py-3 bg-[#002366] text-white font-bold text-xs rounded-xl hover:bg-[#00113a] transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Imprimer
              </button>
              <button
                onClick={() => setActiveReceiptNum(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <ClassiNoteInstallPrompt />

      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />

      {/* PIN Verification Modal (idle/background return) */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] bg-[#f8f9ff] flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#dce9ff] text-[#002366] rounded-2xl shadow-sm border border-[#375ca6]/20 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </div>
              <h2 className="text-xl font-bold text-[#00113a]">Session sécurisée</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Veuillez saisir votre code parent pour reprendre votre session.
              </p>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-card border border-slate-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem('pin') as HTMLInputElement;
                  if (input.value.length === 4) {
                    handlePinVerify(input.value);
                  }
                }}
                className="space-y-4"
              >
                <input
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoFocus
                  required
                  placeholder="****"
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002366] focus:border-transparent"
                />

                {pinError && (
                  <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {pinError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPinLoading}
                  className="w-full h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPinLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-lg">lock_open</span>
                  )}
                  <span>{isPinLoading ? 'Vérification...' : 'Déverrouiller'}</span>
                </button>
              </form>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-4 py-3 text-slate-400 hover:text-slate-600 font-medium text-xs rounded-xl transition-colors cursor-pointer"
            >
              Se déconnecter
            </button>

            <p className="text-center text-[11px] text-slate-400 mt-4 font-medium">
              ClassiNote © {new Date().getFullYear()} • Espace Sécurisé Parent
            </p>
          </div>
        </div>
      )}
      </>
    )}
  </div>
  );
}

function useMagicRoute(): { purpose: 'news' | 'dashboard' | 'notes' | 'absences' | 'frais' | 'emploi' | 'annonces' | 'profs' | 'paiements'; token: string } | null {
  const hash = window.location.hash || '';

  const base = hash.match(/^#\/magic\/(news|dashboard|notes|absences|frais|emploi|annonces|profs|paiements)\??/i);
  if (!base) return null;

  const params = new URLSearchParams(hash.split('?')[1] || '');
  const token = params.get('token') || '';
  const purpose = (base[1] as string).toLowerCase();

  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return null;

  return { purpose: purpose as any, token };
}
