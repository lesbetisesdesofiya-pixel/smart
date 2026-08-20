import React, { useState, useEffect } from "react";
import { loginAdmin, loginAdminPin, setupAdminPin, changeAdminPin, setAuthData, getUser } from "../api";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const storedUser = getUser();
  const hasStoredUser = !!storedUser;
  const hasPin = storedUser?.has_pin === true;

  const [mode, setMode] = useState<"pin" | "password" | "setup" | "change_pin">(
    hasStoredUser && hasPin ? "pin" : "password"
  );
  const [email, setEmail] = useState(storedUser?.email || "");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverRequiresPin, setServerRequiresPin] = useState(false);

  useEffect(() => {
    if (hasStoredUser && hasPin) {
      setMode("pin");
    } else if (hasStoredUser && !hasPin) {
      setMode("setup");
    } else {
      setMode("password");
    }
  }, []);

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || pin.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loginAdminPin(email, pin);
      if (data.success && data.must_change_pin) {
        setAuthData(data.user, "");
        setMode("change_pin");
      } else if (data.user) {
        setAuthData(data.user, data.schools?.[0]?.id || "");
        onLoginSuccess();
      } else {
        setError(data.message || "Email ou PIN incorrect");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loginAdmin(email, password);
      if (data.user) {
        if (data.user?.has_pin) {
          setAuthData(data.user, data.schools?.[0]?.id || "");
          onLoginSuccess();
        } else {
          setAuthData(data.user, data.schools?.[0]?.id || "");
          setServerRequiresPin(true);
          setMode("setup");
        }
      } else {
        setError(data.message || data.email?.[0] || "Identifiants incorrects");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || pin.length !== 6 || pin !== confirmPin) {
      setError("Les codes PIN ne correspondent pas");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await setupAdminPin(email, password, pin);
      if (data.user) {
        setAuthData(data.user, data.schools?.[0]?.id || "");
        onLoginSuccess();
      } else {
        setError(data.message || "Erreur lors de la configuration du PIN");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6 || newPin !== confirmNewPin) {
      setError("Les codes PIN ne correspondent pas");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await changeAdminPin("1111", newPin);
      if (data.success) {
        setMode("pin");
        setNewPin("");
        setConfirmNewPin("");
        setError(null);
        alert("PIN modifié avec succès. Veuillez vous connecter avec votre nouveau PIN.");
      } else {
        setError(data.message || "Erreur lors du changement de PIN");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('classinote_admin_user');
    localStorage.removeItem('classinote_admin_school_id');
    setMode("password");
    setEmail("");
    setPassword("");
    setPin("");
    setConfirmPin("");
    setServerRequiresPin(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col justify-between items-center p-5 relative font-sans">
      <header className="w-full max-w-sm pt-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-[#dce9ff] text-[#002366] rounded-2xl shadow-sm border border-[#375ca6]/20 flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-3xl">school</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e5eeff] text-[#002366] text-[11px] font-bold tracking-wide uppercase mb-2">
          <span className="w-2 h-2 rounded-full bg-[#375ca6] animate-pulse" />
          Espace Admin
        </div>
        <h1 className="text-2xl font-black text-[#00113a] tracking-tight">
          ClassiNote
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed font-normal">
          {mode === "password" && "Connectez-vous avec vos identifiants administrateur."}
          {mode === "pin" && "Saisissez votre code PIN pour accéder à votre espace."}
          {mode === "setup" && "Définissez votre code PIN pour les prochaines connexions."}
          {mode === "change_pin" && "Définissez un nouveau code PIN sécurisé."}
        </p>
      </header>

      <main className="w-full max-w-sm my-auto py-4 flex flex-col items-center">
        <div className="w-full bg-white rounded-[28px] p-6 shadow-card border border-slate-100 flex flex-col items-center">

          {mode === "pin" && (
            <form onSubmit={handlePinLogin} className="w-full space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-[#e5eeff] text-[#002366] flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-4xl">lock_open</span>
              </div>

              <div className="text-center">
                <h2 className="text-lg font-bold text-[#00113a]">Connexion rapide</h2>
                <p className="text-xs text-slate-500 mt-1">Saisissez votre code PIN à 6 chiffres</p>
              </div>

              <div className="text-center text-xs font-semibold text-[#002366] bg-[#e5eeff] py-2.5 px-4 rounded-xl">
                {email}
              </div>

              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                autoFocus
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.3em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />

              {error && (
                <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || pin.length !== 6}
                className="w-full h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">lock_open</span>
                    <span>Se connecter</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full h-11 bg-slate-50 hover:bg-slate-100 text-[#375ca6] font-medium text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Changer de compte
              </button>
            </form>
          )}

          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="w-full space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-[#e5eeff] text-[#002366] flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-4xl">login</span>
              </div>

              <div className="text-center">
                <h2 className="text-lg font-bold text-[#00113a]">Connexion par mot de passe</h2>
                <p className="text-xs text-slate-500 mt-1">Utilisez vos identifiants classiques</p>
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ecole.com"
                autoFocus
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              {error && (
                <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">login</span>
                    <span>Se connecter</span>
                  </>
                )}
              </button>
            </form>
          )}

          {mode === "setup" && (
            <form onSubmit={handleSetupPin} className="w-full space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-[#e5eeff] text-[#002366] flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-4xl">pin</span>
              </div>

              <div className="text-center">
                <h2 className="text-lg font-bold text-[#00113a]">Définir votre PIN</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {serverRequiresPin
                    ? "Pour des raisons de sécurité, vous devez définir un code PIN avant de continuer."
                    : "Créez un code PIN à 6 chiffres pour vos connexions futures"}
                </p>
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ecole.com"
                autoFocus
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe actuel"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />

              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="PIN à 6 chiffres"
                maxLength={6}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.3em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />

              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Confirmer le PIN"
                maxLength={6}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.3em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />

              {error && (
                <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim() || pin.length !== 6 || pin !== confirmPin}
                className="w-full h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">pin</span>
                    <span>Définir le PIN</span>
                  </>
                )}
              </button>

              {!serverRequiresPin && (
                <button
                  type="button"
                  onClick={() => { setMode("password"); setError(null); setPin(""); setConfirmPin(""); setPassword(""); }}
                  className="w-full h-11 bg-slate-50 hover:bg-slate-100 text-[#375ca6] font-medium text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  ← Retour
                </button>
              )}
            </form>
          )}

          {mode === "change_pin" && (
            <form onSubmit={handleChangePin} className="w-full space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-4xl">lock_reset</span>
              </div>

              <div className="text-center">
                <h2 className="text-lg font-bold text-[#00113a]">Changer votre PIN</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Votre PIN a été réinitialisé. Veuillez définir un nouveau PIN.
                </p>
              </div>

              <div className="text-center text-xs font-semibold text-[#002366] bg-[#e5eeff] py-2.5 px-4 rounded-xl">
                {email}
              </div>

              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Nouveau PIN à 6 chiffres"
                maxLength={6}
                autoFocus
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.3em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />

              <input
                type="password"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Confirmer le nouveau PIN"
                maxLength={6}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.3em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />

              {error && (
                <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || newPin.length !== 6 || newPin !== confirmNewPin}
                className="w-full h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">lock_reset</span>
                    <span>Définir le nouveau PIN</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="w-full max-w-sm pb-4 text-center space-y-3">
        <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-3.5 flex items-start gap-3 text-left">
          <div className="w-8 h-8 rounded-full bg-[#e5eeff] text-[#002366] flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-base">info</span>
          </div>
          <div className="text-[11px] text-slate-600 leading-relaxed">
            <span className="font-bold text-[#0b1c30] block mb-0.5">Besoin d'aide ?</span>
            Contactez le support technique si vous avez oublié vos identifiants.
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-medium">
          ClassiNote © {new Date().getFullYear()} — Espace Sécurisé Admin
        </p>
      </footer>
    </div>
  );
}
