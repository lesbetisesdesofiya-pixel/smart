import React, { useState, useEffect, useCallback, useRef } from "react";
import { NavView, Student, SubjectItem, FeeItem, PaymentRecord } from "./types";
import { apiFetch, getUser, isSuperadmin, recordActivity, getLastActivityTime, clearAuthData, forcePasswordReset, unlock, activateMagicLink, setAuthData } from "./api";
import { initFirebaseMessaging, requestPushPermission, onForegroundMessage } from "./firebase";

import { LoginScreen } from "./components/LoginScreen";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { TeachersManager } from "./components/TeachersManager";
import { StudentsManager } from "./components/StudentsManager";
import { ClassesManager } from "./components/ClassesManager";
import { SubjectsManager } from "./components/SubjectsManager";
import { FeeItemsManager } from "./components/FeeItemsManager";
import { AssignmentsManager } from "./components/AssignmentsManager";
import { NotesEvaluationsManager } from "./components/NotesEvaluationsManager";
import { TimetableManager } from "./components/TimetableManager";
import { AnnouncementsManager } from "./components/AnnouncementsManager";
import { ConversationsManager } from "./components/ConversationsManager";
import { SubscriptionManager } from "./components/SubscriptionManager";
import { PaymentsManager } from "./components/PaymentsManager";
import { SettingsManager } from "./components/SettingsManager";
import { AiProviderManager } from "./components/AiProviderManager";
import { SchoolsManager } from "./components/SchoolsManager";
import { AdminsManager } from "./components/AdminsManager";
import { ActivityLogsManager } from "./components/ActivityLogsManager";
import { PermissionsManager } from "./components/PermissionsManager";
import { ReportCardModal } from "./components/ReportCardModal";
import { BulletinManager } from "./components/BulletinManager";
import { ComptabiliteManager } from "./components/ComptabiliteManager";
import { AiNoticeModal } from "./components/AiNoticeModal";
import { ClassiNoteInstallPrompt } from "./components/ClassiNoteInstallPrompt";
import { PushNotificationBanner } from "./components/PushNotificationBanner";

export default function App() {
  const [activeView, setActiveView] = useState<NavView>("dashboard");
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getUser());
  const [showIdleModal, setShowIdleModal] = useState(() => !!getUser());
  const [idlePin, setIdlePin] = useState("");
  const [idleError, setIdleError] = useState<string | null>(null);
  const [isIdleLoading, setIsIdleLoading] = useState(false);

  // Force password reset state
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  // Redirect superadmin away from school views
  const sa = isSuperadmin();
  const saOnlyViews = ["sa-schools", "sa-admins", "aiProviders"];
  const schoolViews = ["dashboard", "teachers", "students", "classes", "subjects", "feeItems", "assignments", "evaluations", "rapportNotes", "timetable", "announcements", "conversations", "subscription", "payments", "permissions", "settings"];
  useEffect(() => {
    if (sa && schoolViews.includes(activeView)) {
      setActiveView("sa-schools");
    }
  }, [sa, activeView]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdResetError, setPwdResetError] = useState<string | null>(null);
  const [pwdResetLoading, setPwdResetLoading] = useState(false);

  const [settings, setSettings] = useState({
    schoolName: "École ClassiNote",
    address: "Abidjan, Côte d'Ivoire",
    phone: "+225 01 02 03 04 05",
    email: "contact@classinote.com",
    directorName: "Directeur Général",
    motto: "L'excellence par l'éducation",
    currency: "FCFA",
  });

  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const [reportCardStudent, setReportCardStudent] = useState<Student | null>(null);
  const [isAiNoticeModalOpen, setIsAiNoticeModalOpen] = useState(false);
  const [aiNotesEnabled, setAiNotesEnabled] = useState(false);

  const [dataLoaded, setDataLoaded] = useState({ essential: false, evaluations: false, edt: false, payments: false, conversations: false, assignments: false });
  const dataLoadedRef = useRef(dataLoaded);
  dataLoadedRef.current = dataLoaded;

  const loadData = useCallback(async () => {
    const hasSchool = !!localStorage.getItem("classinote_admin_school_id");
    if (!hasSchool) return;

    try {
      const [resClasses, resEleves, resProfs, resMatieres, resFrais, resAnnonces, resSchoolSettings] = await Promise.all([
        apiFetch('/school-admin/classes').catch(() => null),
        apiFetch('/school-admin/eleves/filtered').catch(() => null),
        apiFetch('/school-admin/profs').catch(() => null),
        apiFetch('/school-admin/matieres').catch(() => null),
        apiFetch('/school-admin/frais').catch(() => null),
        apiFetch('/school-admin/annonces').catch(() => null),
        apiFetch('/school-admin/school-settings').catch(() => null),
      ]);

      if (resClasses?.ok) {
        const data = await resClasses.json();
        const items = Array.isArray(data) ? data : (data?.classes || []);
        setClasses(items.map((c: any) => ({
          id: String(c.id),
          name: c.libelle,
          level: (c.section?.libelle || '').toLowerCase().includes('lyc') ? 'lycee' : 'college',
          studentCount: c.eleves_count || 0,
          ecolage: c.ecolage || 0,
        })));
      }

      if (resEleves?.ok) {
        const data = await resEleves.json();
        const items = Array.isArray(data) ? data : (data?.eleves || []);
        setStudents(items.map((e: any) => {
          const sub = e.subscription;
          const dette = e.dette;
          const totalPaye = sub?.total_paye || 0;
          const montantMensuel = sub?.montant_mensuel || 0;
          const nbMoisTotal = 10;
          const nbMoisPayes = (sub?.mois_payes || []).length;
          const nbMoisImpayes = (dette?.mois_impayes || []).length;

          let paymentStatus: 'a_jour' | 'partiel' | 'en_retard' = 'en_retard';
          if (!sub) {
            paymentStatus = 'en_retard';
          } else if (nbMoisImpayes === 0 && nbMoisPayes > 0) {
            paymentStatus = 'a_jour';
          } else if (nbMoisPayes > 0 && nbMoisImpayes > 0) {
            paymentStatus = 'partiel';
          }

          const ecolage = dette?.ecolage ?? montantMensuel;
          const scolReste = dette?.scolarite ?? ecolage;
          const scolPaye = Math.max(0, ecolage - scolReste);

          return {
            id: String(e.id),
            matricule: e.matricule || `STJ-${e.id}`,
            firstName: e.prenom,
            lastName: e.nom,
            birthDate: e.date_naissance || '',
            level: 'college' as const,
            classId: String(e.classe_id || ''),
            className: e.classe || '',
            parentPhone: e.parents?.[0]?.telephone || '',
            parentEmail: '',
            parentAddress: '',
            parentName: e.parents?.[0]?.telephone ? `Parent ${e.prenom}` : '',
            parentCode: e.parents?.[0]?.code_used ? null : (e.parents?.[0]?.code || ''),
            parentCodeUsed: e.parents?.[0]?.code_used || false,
            parentMagicToken: e.parents?.[0]?.magic_token || '',
            gender: e.sexe || 'M',
            paymentStatus,
            tuitionPaid: scolPaye,
            tuitionTotal: ecolage,
            attendanceRate: 95,
            status: (e.status || 'actif') as any,
            registrationDate: e.created_at?.split('T')[0] || '2026-01-01',
            access_locked: !!e.access_locked,
            subscription: sub || null,
            dette: dette || null,
          } as any;
        }));
      }

      if (resProfs?.ok) {
        const data = await resProfs.json();
        const items = Array.isArray(data) ? data : (data?.profs || []);
        setTeachers(items.map((p: any) => ({
          id: String(p.id),
          matricule: `PRF-${p.id}`,
          firstName: p.prenom,
          lastName: p.nom,
          photo: '',
          mainSubject: p.affectations?.[0]?.matiere?.libelle || 'Enseignant',
          secondarySubjects: [],
          assignedClassIds: p.affectations?.map((a: any) => String(a.classe_id)) || [],
          assignedClassNames: p.affectations?.map((a: any) => a.classe?.libelle).filter(Boolean) || [],
          phone: p.telephone || '',
          email: p.email || '',
          status: 'actif' as const,
          weeklyHours: 18,
          maxWeeklyHours: 24,
          diploma: '',
          hireDate: p.created_at?.split('T')[0] || '2026-01-01',
          code: p.code_used ? null : p.code,
          code_used: p.code_used || false,
          magic_token: p.magic_token,
          active: p.active,
        })));
      }

      if (resMatieres?.ok) {
        const data = await resMatieres.json();
        const items = Array.isArray(data) ? data : (data?.matieres || []);
        setSubjects(items.map((m: any) => ({
          id: String(m.id),
          name: m.libelle,
          code: m.libelle.substring(0, 3).toUpperCase(),
          category: (m.categorie || 'Général') as any,
          coefficientDefault: 2,
        })));
      }

      if (resSchoolSettings?.ok) {
        const data = await resSchoolSettings.json();
        setAiNotesEnabled(data.ai_notes_enabled ?? false);
      }

      if (resFrais?.ok) {
        const data = await resFrais.json();
        const items = Array.isArray(data) ? data : (data?.frais || []);
        setFeeItems(items.map((f: any) => ({
          id: String(f.id),
          title: f.libelle,
          amountFCFA: Number(f.montant),
          isMandatory: true,
          targetClassIds: f.classes?.map((c: any) => String(c.id)) || ["all"],
          targetClassNames: f.classes?.map((c: any) => c.libelle) || ["Toutes"],
        })));
      }

      if (resAnnonces?.ok) {
        const data = await resAnnonces.json();
        const items = Array.isArray(data) ? data : (data?.annonces || []);
        setAnnouncements(items.map((a: any) => ({
          id: String(a.id),
          title: a.titre,
          content: a.contenu,
          priority: a.type || 'normale',
          sentDate: a.created_at?.split('T')[0] || '',
          sender: a.author?.name || 'Admin',
          targetAudience: 'Toutes les classes',
          readRate: 100,
        })));
      }

      const user = getUser();
      if (user) {
        setSettings(prev => ({
          ...prev,
          schoolName: user.schoolName || prev.schoolName,
        }));
      }
      setDataLoaded(prev => ({ ...prev, essential: true }));
    } catch (err) {
    }
  }, []);

  const loadSecondaryData = useCallback(async (keys: string[]) => {
    const dl = dataLoadedRef.current;
    const toLoad = keys.filter(k => {
      if (k === 'evaluations' && !dl.evaluations) return true;
      if (k === 'edt' && !dl.edt) return true;
      if (k === 'payments' && !dl.payments) return true;
      if (k === 'conversations' && !dl.conversations) return true;
      if (k === 'assignments' && !dl.assignments) return true;
      return false;
    });
    if (toLoad.length === 0) return;

    const fetches: Record<string, Promise<Response | null>> = {};
    if (toLoad.includes('evaluations')) fetches.evaluations = apiFetch('/school-admin/evaluations').catch(() => null);
    if (toLoad.includes('edt')) fetches.edt = apiFetch('/school-admin/emploi-du-temps').catch(() => null);
    if (toLoad.includes('payments')) fetches.payments = apiFetch('/school-admin/subscriptions').catch(() => null);
    if (toLoad.includes('conversations')) fetches.conversations = apiFetch('/school-admin/messaging').catch(() => null);
    if (toLoad.includes('assignments')) fetches.assignments = apiFetch('/school-admin/affectations').catch(() => null);

    const results = await Promise.all(Object.values(fetches));
    const entries = Object.keys(fetches);
    const updates: Record<string, boolean> = {};

    for (let i = 0; i < entries.length; i++) {
      const key = entries[i];
      const res = results[i];
      if (!res?.ok) continue;

      const data = await res.json();
      if (key === 'evaluations') {
        const items = Array.isArray(data) ? data : (data?.evaluations || []);
        setEvaluations(items.map((e: any) => ({
          id: String(e.id),
          title: e.titre || '',
          type: e.type || 'composition',
          classId: e.classes?.[0]?.classe_id ? String(e.classes[0].classe_id) : '',
          className: e.classes?.map((c: any) => c.libelle).join(', ') || '',
          subject: e.matiere || '',
          subject_id: e.matiere_id ? String(e.matiere_id) : '',
          date: e.date || '',
          term: e.periode || '',
          term_id: e.periode_id ? String(e.periode_id) : '',
          totalPoints: e.note_sur || 20,
          coefficient: e.coefficient || 1,
          note_sur: e.note_sur || 20,
          status: (e.nb_classes > 0 && e.classes?.some((c: any) => c.nb_notes > 0)) ? 'publie' : 'a_venir',
          classes: e.classes || [],
          nb_classes: e.nb_classes || 0,
        })));
        updates.evaluations = true;
      }
      if (key === 'edt') {
        const items = Array.isArray(data) ? data : (data?.emploi_du_temps || data?.edt || []);
        const slotColors = [
          "bg-blue-100 text-blue-800 border-blue-200",
          "bg-emerald-100 text-emerald-800 border-emerald-200",
          "bg-purple-100 text-purple-800 border-purple-200",
          "bg-indigo-100 text-indigo-800 border-indigo-200",
          "bg-rose-100 text-rose-800 border-rose-200",
          "bg-cyan-100 text-cyan-800 border-cyan-200",
        ];
        setTimetable(items.map((e: any, i: number) => ({
          id: String(e.id),
          className: e.classe?.libelle || '',
          classId: String(e.classe_id || ''),
          teacherName: e.prof ? `${e.prof.prenom} ${e.prof.nom}` : '',
          teacherId: String(e.prof_id || ''),
          subject: e.matiere?.libelle || '',
          subjectId: String(e.matiere_id || ''),
          day: (e.jour || '').charAt(0).toUpperCase() + (e.jour || '').slice(1),
          startTime: (e.heure_debut || '').substring(0, 5),
          endTime: (e.heure_fin || '').substring(0, 5),
          type: e.type_cours || 'cours',
          colorBg: slotColors[i % slotColors.length],
        })));
        updates.edt = true;
      }
      if (key === 'payments') {
        const items = Array.isArray(data) ? data : (data?.students || data?.subscriptions || []);
        setPayments(items.flatMap((s: any) =>
          (s.payments || []).map((p: any) => ({
            id: String(p.id),
            receiptNumber: `REC-${p.id}`,
            studentId: String(s.eleve_id || s.id),
            studentName: `${s.eleve?.prenom || s.prenom || ''} ${s.eleve?.nom || s.nom || ''}`,
            className: s.eleve?.classe?.libelle || s.classe || '',
            date: p.created_at?.split('T')[0] || '',
            amountFCFA: Number(p.montant),
            category: p.type || 'scolarite',
            feeTitle: p.fee_title || p.type || 'scolarite',
            method: 'especes' as const,
            status: 'valide' as const,
          }))
        ));
        updates.payments = true;
      }
      if (key === 'conversations') {
        setConversations(Array.isArray(data) ? data.map((c: any) => ({
          id: String(c.id),
          studentName: c.eleve?.nom_complet || 'N/A',
          className: c.eleve?.classe || '',
          parentName: c.parent?.nom_complet || 'N/A',
          teacherName: c.prof?.nom_complet || 'N/A',
          subjectTopic: c.subject || `Discussion ${c.type}`,
          lastMessage: c.last_message?.contenu || '',
          lastMessageTime: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
          unreadCount: c.unread_count || 0,
          status: 'ouvert' as const,
          messages: [],
          type: c.type,
          eleveId: c.eleve?.id,
          profId: c.prof?.id,
          parentId: c.parent?.id,
        })) : []);
        updates.conversations = true;
      }
      if (key === 'assignments') {
        const items = Array.isArray(data) ? data : (data?.affectations || []);
        setAssignments(items.map((a: any) => ({
          id: String(a.id),
          teacherId: String(a.prof_id || ''),
          teacherName: a.prof ? `${a.prof.prenom} ${a.prof.nom}` : '',
          subjectId: String(a.matiere_id || ''),
          subjectName: a.matiere?.libelle || '',
          classId: String(a.classe_id || ''),
          className: a.classe?.libelle || '',
          coefficient: a.coefficient || 2,
        })));
        updates.assignments = true;
      }
    }

    setDataLoaded(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle magic link activation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const magicToken = urlParams.get('magic_token');
    if (magicToken && !isLoggedIn) {
      activateMagicLink(magicToken).then(data => {
        if (data.user) {
          setAuthData(data.user, data.schools?.[0]?.id || '');
          setIsLoggedIn(true);
          // Clean URL
          window.history.replaceState({}, '', '/smart/public/app/admin/');
        }
      }).catch(() => {});
    }
  }, []);

  // Check force_password_reset on login
  useEffect(() => {
    if (isLoggedIn) {
      const user = getUser();
      if (user?.force_password_reset) {
        setNeedsPasswordReset(true);
      } else {
        const sa = user?.role === 'superadmin';
        setActiveView(sa ? "sa-schools" : "dashboard");
      }

    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && !needsPasswordReset) {
      loadData();
    }
  }, [isLoggedIn, needsPasswordReset, loadData]);

  // Lazy-load secondary data when navigating to views that need it
  useEffect(() => {
    if (!dataLoaded.essential) return;
    const map: Record<string, string[]> = {
      evaluations: ['evaluations'],
      gradeEntry: ['evaluations'],
      rapportNotes: ['evaluations'],
      timetable: ['edt'],
      payments: ['payments'],
      conversations: ['conversations'],
      assignments: ['assignments'],
    };
    const keys = map[activeView];
    if (keys) loadSecondaryData(keys);
  }, [activeView, dataLoaded.essential, loadSecondaryData]);

  // Idle detection – interval-based (like subscription check)
  useEffect(() => {
    if (!isLoggedIn || needsPasswordReset) return;

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
            new Notification(title, { body, icon: '/app/admin/icons/icon-192x192.png' });
          }
          window.dispatchEvent(new Event('notification:received'));
        });
      }
    });

    // Periodic check every 30s if idle > 5min → show PIN
    const idleCheck = setInterval(() => {
      const elapsed = Date.now() - getLastActivityTime();
      if (elapsed >= IDLE_TIMEOUT) {
        setShowIdleModal(true);
      }
    }, CHECK_INTERVAL);

    // Activity listeners – just record activity
    const handleActivity = () => { recordActivity(); };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - getLastActivityTime();
        if (elapsed >= IDLE_TIMEOUT) {
          setShowIdleModal(true);
        }
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(idleCheck);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, needsPasswordReset]);

  const handleForcePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword !== confirmPassword) return;
    setPwdResetLoading(true);
    setPwdResetError(null);
    try {
      const data = await forcePasswordReset(newPassword, confirmPassword);
      if (data.message) {
        const user = getUser();
        if (user) {
          user.force_password_reset = false;
          localStorage.setItem('classinote_admin_user', JSON.stringify(user));
        }
        setNeedsPasswordReset(false);
        const sa = getUser()?.role === 'superadmin';
        setActiveView(sa ? "sa-schools" : "dashboard");
      } else {
        setPwdResetError(data.message || "Erreur");
      }
    } catch {
      setPwdResetError("Erreur réseau");
    }
    setPwdResetLoading(false);
  };

  const handleIdleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idlePin.trim() || idlePin.length !== 6) return;
    setIsIdleLoading(true);
    setIdleError(null);
    try {
      const data = await unlock(idlePin);
      if (!data.success) {
        setIdleError(data.message || 'PIN incorrect.');
        return;
      }
      setShowIdleModal(false);
      setIdlePin("");
      recordActivity();
      loadData();
    } catch {
      setIdleError('Erreur de vérification.');
    } finally {
      setIsIdleLoading(false);
    }
  };

  const handleAdminLogout = () => {
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    clearAuthData();
    setIsLoggedIn(false);
  };

  const unreadConversations = conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // Force password reset screen
  if (needsPasswordReset) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#e5eeff] text-[#002366] rounded-2xl shadow-sm border border-[#375ca6]/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">lock_reset</span>
            </div>
            <h1 className="text-2xl font-black text-[#00113a]">Changement de Mot de Passe</h1>
            <p className="text-sm text-slate-500 mt-2">
              Pour des raisons de sécurité, vous devez changer votre mot de passe avant d'accéder au tableau de bord.
            </p>
          </div>

          <div className="bg-white rounded-[28px] p-8 shadow-card border border-slate-100">
            <form onSubmit={handleForcePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  autoFocus
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002366] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002366] focus:border-transparent"
                />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-rose-600 font-medium">Les mots de passe ne correspondent pas</p>
              )}
              {pwdResetError && (
                <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-3 rounded-xl border border-rose-200">
                  {pwdResetError}
                </p>
              )}
              <button
                type="submit"
                disabled={pwdResetLoading || !newPassword.trim() || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer transition-colors"
              >
                {pwdResetLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">lock_open</span>
                    <span>Confirmer le changement</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex antialiased selection:bg-blue-600 selection:text-white">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        unreadCount={unreadConversations}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        totalStudents={students.length}
        onLogout={handleAdminLogout}
        onChangePassword={() => setNeedsPasswordReset(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {!isSuperadmin() && (
          <Header
            settings={settings}
            setIsOpenMobile={setIsOpenMobile}
            setActiveView={setActiveView}
            onLogout={handleAdminLogout}
            onOpenAiAssistant={() => setIsAiNoticeModalOpen(true)}
          />
        )}

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* ─── Superadmin Views ─── */}
          {activeView === "sa-schools" && <SchoolsManager />}
          {activeView === "sa-admins" && <AdminsManager />}
          {activeView === "sa-activityLogs" && <ActivityLogsManager />}
          {activeView === "aiProviders" && <AiProviderManager />}

          {/* ─── School Admin Views ─── */}
          {activeView === "dashboard" && (
            <Dashboard
              students={students}
              teachers={teachers}
              classes={classes}
              payments={payments}
              announcements={announcements}
              setActiveView={setActiveView}
              onOpenAiAssistant={() => setIsAiNoticeModalOpen(true)}
            />
          )}

          {activeView === "teachers" && (
            <TeachersManager teachers={teachers} setTeachers={setTeachers} />
          )}

          {activeView === "students" && (
            <StudentsManager
              students={students}
              setStudents={setStudents}
              classes={classes}
              feeItems={feeItems}
              onGenerateReportCard={(student) => setReportCardStudent(student)}
              onRecordTuitionPayment={async (studentId, amountFCFA, method) => {
                try {
                  const res = await apiFetch(`/school-admin/subscriptions/pay-by-eleve/${studentId}`, {
                    method: 'POST',
                    body: JSON.stringify({
                      montant: amountFCFA,
                      methode_paiement: 'especes',
                      type: 'scolarite',
                    }),
                  });
                  if (res.ok) {
                    loadData();
                  }
                } catch {}
              }}
              onRecordFeePayment={async (studentId, feeItem, method) => {
                try {
                  const res = await apiFetch(`/school-admin/subscriptions/pay-by-eleve/${studentId}`, {
                    method: 'POST',
                    body: JSON.stringify({
                      montant: feeItem.amountFCFA,
                      frais_id: feeItem.id,
                      methode_paiement: 'especes',
                      type: 'frais',
                    }),
                  });
                  if (res.ok) {
                    loadData();
                  }
                } catch {}
              }}
              onRecordSubscriptionPayment={async (studentId, selectedMonths, totalFCFA, method) => {
                try {
                  const res = await apiFetch(`/school-admin/subscriptions/pay-by-eleve/${studentId}`, {
                    method: 'POST',
                    body: JSON.stringify({
                      months: selectedMonths,
                      montant: totalFCFA,
                      methode_paiement: 'especes',
                      type: 'abonnement',
                    }),
                  });
                  if (res.ok) {
                    loadData();
                  }
                } catch {}
              }}
            />
          )}

          {activeView === "classes" && (
            <ClassesManager
              classes={classes}
              setClasses={setClasses}
              teachers={teachers}
              onSelectClassFilter={() => setActiveView("students")}
            />
          )}

          {activeView === "subjects" && (
            <SubjectsManager subjects={subjects} setSubjects={setSubjects} />
          )}

          {activeView === "feeItems" && (
            <FeeItemsManager feeItems={feeItems} setFeeItems={setFeeItems} classes={classes} />
          )}

          {activeView === "assignments" && (
            <AssignmentsManager assignments={assignments} setAssignments={setAssignments} teachers={teachers} classes={classes} />
          )}

          {activeView === "gradeEntry" && (
            <NotesEvaluationsManager
              classes={classes}
              students={students}
              subjects={subjects}
              aiNotesEnabled={aiNotesEnabled}
            />
          )}

          {activeView === "timetable" && (
            <TimetableManager timetable={timetable} setTimetable={setTimetable} classes={classes} teachers={teachers} />
          )}

          {activeView === "announcements" && (
            <AnnouncementsManager classes={classes} />
          )}

          {activeView === "conversations" && (
            <ConversationsManager conversations={conversations} setConversations={setConversations} />
          )}

          {activeView === "subscription" && (
            <SubscriptionManager />
          )}

          {activeView === "payments" && (
            <PaymentsManager payments={payments} setPayments={setPayments} students={students} classes={classes} feeItems={feeItems} />
          )}

          {activeView === "bulletins" && <BulletinManager />}

          {activeView === "comptabilite" && <ComptabiliteManager />}

          {activeView === "permissions" && (
            <PermissionsManager />
          )}

          {activeView === "settings" && (
            <SettingsManager settings={settings} setSettings={setSettings} classes={classes} />
          )}
        </main>
      </div>

      <PushNotificationBanner />

      <ReportCardModal student={reportCardStudent} settings={settings} onClose={() => setReportCardStudent(null)} />

      <AiNoticeModal
        isOpen={isAiNoticeModalOpen}
        onClose={() => setIsAiNoticeModalOpen(false)}
        onNoticeGenerated={(title, content) => {
          setAnnouncements([{
            id: `AN${Date.now()}`,
            title,
            content,
            targetAudience: "Toutes les classes",
            sentDate: new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
            readRate: 0,
            priority: "normale",
            sender: settings.directorName,
          }, ...announcements]);
          setActiveView("announcements");
        }}
      />

      <ClassiNoteInstallPrompt />

      {showIdleModal && (
        <div className="fixed inset-0 z-[100] bg-[#f8f9ff] flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#e5eeff] text-[#002366] rounded-2xl shadow-sm border border-[#375ca6]/20 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </div>
              <h2 className="text-xl font-bold text-[#00113a]">Session sécurisée</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Veuillez saisir votre code PIN pour reprendre votre session.
              </p>
            </div>

            <div className="bg-white rounded-[28px] p-6 shadow-card border border-slate-100">
              <form onSubmit={handleIdleVerify} className="space-y-4">
                <input
                  type="password"
                  value={idlePin}
                  onChange={(e) => setIdlePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  className="w-full px-3.5 py-3 text-center text-2xl font-mono tracking-[0.3em] bg-slate-50 border border-slate-200 rounded-xl text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] focus:border-transparent"
                />
                {idleError && (
                  <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {idleError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isIdleLoading || idlePin.length !== 6}
                  className="w-full h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isIdleLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-lg">lock_open</span>
                  )}
                  <span>{isIdleLoading ? 'Vérification...' : 'Déverrouiller'}</span>
                </button>
              </form>
            </div>

            <button
              onClick={handleAdminLogout}
              className="w-full mt-4 py-3 text-slate-400 hover:text-slate-600 font-medium text-xs rounded-xl transition-colors cursor-pointer"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
