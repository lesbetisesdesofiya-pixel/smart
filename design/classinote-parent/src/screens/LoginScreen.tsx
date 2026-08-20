import React, { useState, useEffect } from "react";
import { deviceRegister, deviceVerify, deviceLogin, checkDevice, unlock, setAuthData, clearAuthData, getUser, changeMyPin } from "../api";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const existingUser = getUser();

  const [step, setStep] = useState<"pin" | "login" | "register" | "change_pin">(
    existingUser ? "pin" : "register"
  );
  const [code, setCode] = useState("");
  const [telephone, setTelephone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingDevice, setCheckingDevice] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!existingUser) {
      checkDeviceStatus();
    } else {
      setCheckingDevice(false);
    }
  }, []);

  const checkDeviceStatus = async () => {
    try {
      const data = await checkDevice();
      if (data.trusted) {
        setStep("login");
      } else {
        setStep("register");
      }
    } catch {
      setStep("register");
    } finally {
      setCheckingDevice(false);
    }
  };

  // Étape 1 : Vérifier code + téléphone ensemble
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 8 || !telephone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await deviceVerify(code, telephone);
      if (data.valid) {
        setVerified(true);
      } else {
        setError(data.message || "Code ou numéro incorrect");
      }
    } catch {
      setError("Code ou numéro incorrect");
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Définir le PIN et enregistrer
  const handlePinSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || pin !== confirmPin) {
      setError("Les codes PIN ne correspondent pas");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await deviceRegister(code, telephone, pin);
      if (data.user) {
        setAuthData(data.user);
        onLoginSuccess();
      } else if (data.message?.includes('déjà un PIN')) {
        // L'utilisateur a déjà un PIN, rediriger vers la connexion
        setStep("login");
        setError(null);
      } else {
        setError(data.message || "Erreur lors de l'enregistrement");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // Connexion sur appareil connu
  const handleDeviceLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telephone.trim() || pin.length !== 4) return;
    setLoading(true);
    setError(null);
    try {
      const data = await deviceLogin(telephone, pin, 'parent');
      if (data.success) {
        if (data.must_change_pin) {
          setStep("change_pin");
          setLoading(false);
          return;
        }
        if (data.user) {
          setAuthData(data.user);
          onLoginSuccess();
        } else {
          setError("Erreur: données utilisateur manquantes");
        }
      } else {
        setError(data.message || "Identifiants incorrects");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // Déverrouiller avec PIN
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    setLoading(true);
    setError(null);
    try {
      const data = await unlock(pin);
      if (data.success) {
        onLoginSuccess();
      } else {
        setError(data.message || "PIN incorrect");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // Changer le PIN
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || newPin !== confirmNewPin) {
      setError("Les codes PIN ne correspondent pas");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await changeMyPin(pin, newPin);
      if (data.success) {
        if (data.user) {
          setAuthData(data.user);
        }
        onLoginSuccess();
      } else {
        setError(data.message || "Erreur lors du changement de PIN");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    setStep("register");
    setCode("");
    setTelephone("");
    setPin("");
    setConfirmPin("");
    setVerified(false);
    setError(null);
    checkDeviceStatus();
  };

  if (checkingDevice) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#002366] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col justify-between items-center p-5 relative font-sans">
      <header className="w-full max-w-sm pt-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-[#dce9ff] text-[#002366] rounded-2xl shadow-sm border border-[#375ca6]/20 flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-3xl">family_restroom</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e5eeff] text-[#002366] text-[11px] font-bold tracking-wide uppercase mb-2">
          <span className="w-2 h-2 rounded-full bg-[#375ca6] animate-pulse" />
          Espace Parent
        </div>
        <h1 className="text-2xl font-black text-[#00113a] tracking-tight">
          ClassiNote
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed font-normal">
          {step === "register" && !verified && "Entrez votre code d'accès et votre numéro de téléphone."}
          {step === "register" && verified && "Définissez un code PIN à 4 chiffres."}
          {step === "login" && "Appareil reconnu. Entrez votre téléphone et PIN."}
          {step === "pin" && "Saisissez votre code PIN pour déverrouiller."}
          {step === "change_pin" && "Votre PIN a été réinitialisé. Veuillez en définir un nouveau."}
        </p>
      </header>

      <main className="w-full max-w-sm my-auto py-4 flex flex-col items-center">
        <div className="w-full bg-white rounded-[28px] p-6 shadow-card border border-slate-100 flex flex-col items-center">

          {/* Étape 1 : Code + Téléphone */}
          {step === "register" && !verified && (
            <form onSubmit={handleVerify} className="w-full space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-[#e5eeff] text-[#002366] flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-4xl">vpn_key</span>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-[#00113a]">Première connexion</h2>
                <p className="text-xs text-slate-500 mt-1">Code d'accès et numéro de téléphone</p>
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                placeholder="Code d'accès (8 caractères)"
                maxLength={8}
                autoFocus
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.2em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] uppercase transition-all"
              />
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value.replace(/[^0-9+]/g, '').slice(0, 15))}
                placeholder="Numéro de téléphone"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />
              {error && (
                <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || code.length !== 8 || !telephone.trim()}
                className="w-full h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                  <>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    Vérifier
                  </>
                )}
              </button>
            </form>
          )}

          {/* Étape 2 : Définir le PIN */}
          {step === "register" && verified && (
            <form onSubmit={handlePinSetup} className="w-full space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-[#00113a]">Code vérifié</h2>
                <p className="text-xs text-slate-500 mt-1">Définissez un code PIN à 4 chiffres</p>
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="PIN à 4 chiffres"
                maxLength={4}
                autoFocus
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.3em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Confirmer le PIN"
                maxLength={4}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.3em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />
              {error && (
                <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setVerified(false); setError(null); }}
                  className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading || pin.length !== 4 || pin !== confirmPin}
                  className="flex-1 h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Enregistrer"}
                </button>
              </div>
            </form>
          )}

          {/* Connexion sur appareil connu */}
          {step === "login" && (
            <form onSubmit={handleDeviceLogin} className="w-full space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-[#e5eeff] text-[#002366] flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-4xl">lock_open</span>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-[#00113a]">Connexion</h2>
                <p className="text-xs text-slate-500 mt-1">Appareil reconnu, entrez vos identifiants</p>
              </div>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value.replace(/[^0-9+]/g, '').slice(0, 15))}
                placeholder="Numéro de téléphone"
                autoFocus
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="• • • •"
                maxLength={4}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.3em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />
              {error && (
                <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !telephone.trim() || pin.length !== 4}
                className="w-full h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Se connecter"}
              </button>
            </form>
          )}

          {/* Déverrouiller */}
          {step === "pin" && (
            <form onSubmit={handleUnlock} className="w-full space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-[#e5eeff] text-[#002366] flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-4xl">lock</span>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-[#00113a]">Déverrouiller</h2>
                <p className="text-xs text-slate-500 mt-1">Saisissez votre code PIN</p>
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="• • • •"
                maxLength={4}
                autoFocus
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.3em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />
              {error && (
                <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || pin.length !== 4}
                className="w-full h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Déverrouiller"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 text-slate-400 hover:text-slate-600 font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Se déconnecter
              </button>
            </form>
          )}

          {/* Changer le PIN */}
          {step === "change_pin" && (
            <form onSubmit={handleChangePin} className="w-full space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-[#e5eeff] text-[#002366] flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-4xl">lock_reset</span>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-[#00113a]">Changer le PIN</h2>
                <p className="text-xs text-slate-500 mt-1">Votre PIN a été réinitialisé</p>
              </div>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Nouveau PIN"
                maxLength={4}
                autoFocus
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.3em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />
              <input
                type="password"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Confirmer le PIN"
                maxLength={4}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-[0.3em] text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] transition-all"
              />
              {error && (
                <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || newPin.length !== 4 || newPin !== confirmNewPin}
                className="w-full h-12 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Changer le PIN"}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="w-full max-w-sm pb-4 text-center">
        <p className="text-[11px] text-slate-400 font-medium">
          ClassiNote © {new Date().getFullYear()} — Espace Parent
        </p>
      </footer>
    </div>
  );
}
