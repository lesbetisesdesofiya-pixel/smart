import React, { useState, useEffect } from "react";
import { SuperadminView } from "./types";
import { apiFetch, getUser, recordActivity, getLastActivityTime, clearAuthData, forcePasswordReset, unlock } from "./api";

import { LoginScreen } from "./components/LoginScreen";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { SchoolsManager } from "./components/SchoolsManager";
import { AdminsManager } from "./components/AdminsManager";
import { ActivityLogsManager } from "./components/ActivityLogsManager";
import { AiProviderManager } from "./components/AiProviderManager";
import { FinancialReportsManager } from "./components/FinancialReportsManager";
import { AdminSchoolView } from "./components/AdminSchoolView";
import { SettingsManager } from "./components/SettingsManager";
import { GradeSubmissionsManager } from "./components/GradeSubmissionsManager";

export default function App() {
  const [activeView, setActiveView] = useState<SuperadminView>("schools");
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getUser());
  const [showIdleModal, setShowIdleModal] = useState(() => !!getUser());
  const [idlePin, setIdlePin] = useState("");
  const [idleError, setIdleError] = useState<string | null>(null);
  const [isIdleLoading, setIsIdleLoading] = useState(false);

  // Selected school for admin view
  const [selectedSchool, setSelectedSchool] = useState<{ id: number; name: string } | null>(null);

  // Force password reset state
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdResetError, setPwdResetError] = useState<string | null>(null);
  const [pwdResetLoading, setPwdResetLoading] = useState(false);

  // Check force_password_reset on login
  useEffect(() => {
    if (isLoggedIn) {
      const user = getUser();
      if (user?.force_password_reset) {
        setNeedsPasswordReset(true);
      }
    }
  }, [isLoggedIn]);

  // Idle detection
  useEffect(() => {
    if (!isLoggedIn || needsPasswordReset) return;

    const IDLE_TIMEOUT = 5 * 60 * 1000;
    const CHECK_INTERVAL = 30 * 1000;

    recordActivity();

    const idleCheck = setInterval(() => {
      const elapsed = Date.now() - getLastActivityTime();
      if (elapsed >= IDLE_TIMEOUT) {
        setShowIdleModal(true);
      }
    }, CHECK_INTERVAL);

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
          localStorage.setItem('classinote_superadmin_user', JSON.stringify(user));
        }
        setNeedsPasswordReset(false);
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
    } catch {
      setIdleError('Erreur de vérification.');
    } finally {
      setIsIdleLoading(false);
    }
  };

  const handleViewSchool = (schoolId: number, schoolName: string) => {
    setSelectedSchool({ id: schoolId, name: schoolName });
    setActiveView("adminView");
  };

  const handleBackFromSchool = () => {
    setSelectedSchool(null);
    setActiveView("schools");
  };

  const handleAdminLogout = () => {
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    clearAuthData();
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // Force password reset screen
  if (needsPasswordReset) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl shadow-sm border border-amber-300/30 flex items-center justify-center mx-auto mb-4">
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
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer transition-colors"
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
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex antialiased selection:bg-amber-600 selection:text-white">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        onLogout={handleAdminLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          setIsOpenMobile={setIsOpenMobile}
          setActiveView={setActiveView}
          onLogout={handleAdminLogout}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* ─── Superadmin Views ─── */}
          {activeView === "schools" && <SchoolsManager onViewSchool={handleViewSchool} />}
          {activeView === "admins" && <AdminsManager onViewSchool={handleViewSchool} />}
          {activeView === "activityLogs" && <ActivityLogsManager />}
          {activeView === "aiProviders" && <AiProviderManager />}
          {activeView === "financialReports" && <FinancialReportsManager />}
          {activeView === "settings" && <SettingsManager />}
          {activeView === "gradeSubmissions" && <GradeSubmissionsManager />}
          {activeView === "adminView" && selectedSchool && (
            <AdminSchoolView
              schoolId={selectedSchool.id}
              schoolName={selectedSchool.name}
              onBack={handleBackFromSchool}
            />
          )}
        </main>
      </div>

      {showIdleModal && (
        <div className="fixed inset-0 z-[100] bg-[#f8f9ff] flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl shadow-sm border border-amber-300/30 flex items-center justify-center mx-auto mb-4">
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
                  className="w-full px-3.5 py-3 text-center text-2xl font-mono tracking-[0.3em] bg-slate-50 border border-slate-200 rounded-xl text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                {idleError && (
                  <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {idleError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isIdleLoading || idlePin.length !== 6}
                  className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
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
