import React, { useState, useEffect } from "react";
import { deviceRegister, deviceVerify, deviceLogin, checkDevice, unlock, setAuthData, clearAuthData, getUser, changeMyPin } from "../../api";

interface LoginScreenProps { onLoginSuccess: () => void; }

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const existingUser = getUser();
  const [step, setStep] = useState<"pin" | "login" | "register" | "change_pin">(existingUser ? "pin" : "register");
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

  useEffect(() => { if (!existingUser) checkDeviceStatus(); else setCheckingDevice(false); }, []);
  const checkDeviceStatus = async () => { try { const data = await checkDevice(); setStep(data.trusted ? "login" : "register"); } catch { setStep("register"); } finally { setCheckingDevice(false); } };
  const handleVerify = async (e: React.FormEvent) => { e.preventDefault(); if (code.length !== 8 || !telephone.trim()) return; setLoading(true); setError(null); try { const data = await deviceVerify(code, telephone); if (data.valid) setVerified(true); else setError(data.message || "Code ou numero incorrect"); } catch { setError("Code ou numero incorrect"); } finally { setLoading(false); } };
  const handlePinSetup = async (e: React.FormEvent) => { e.preventDefault(); if (pin.length !== 4 || pin !== confirmPin) { setError("Les codes PIN ne correspondent pas"); return; } setLoading(true); setError(null); try { const data = await deviceRegister(code, telephone, pin); if (data.user) { setAuthData(data.user); onLoginSuccess(); } else if (data.message?.includes('deja un PIN')) { setStep("login"); setError(null); } else setError(data.message || "Erreur"); } catch { setError("Erreur de connexion"); } finally { setLoading(false); } };
  const handleDeviceLogin = async (e: React.FormEvent) => { e.preventDefault(); if (!telephone.trim() || pin.length !== 4) return; setLoading(true); setError(null); try { const data = await deviceLogin(telephone, pin, 'prof'); if (data.success) { if (data.must_change_pin) { setStep("change_pin"); setLoading(false); return; } if (data.user) { setAuthData(data.user); onLoginSuccess(); } else setError("Erreur: donnees manquantes"); } else setError(data.message || "Identifiants incorrects"); } catch { setError("Erreur de connexion"); } finally { setLoading(false); } };
  const handleUnlock = async (e: React.FormEvent) => { e.preventDefault(); if (pin.length !== 4) return; setLoading(true); setError(null); try { const data = await unlock(pin); if (data.success) onLoginSuccess(); else setError(data.message || "PIN incorrect"); } catch { setError("Erreur de connexion"); } finally { setLoading(false); } };
  const handleChangePin = async (e: React.FormEvent) => { e.preventDefault(); if (newPin.length !== 4 || newPin !== confirmNewPin) { setError("Les codes PIN ne correspondent pas"); return; } if (newPin === '1111') { setError("Le nouveau PIN ne peut pas etre 1111"); return; } setLoading(true); setError(null); try { const data = await changeMyPin(pin, newPin); if (data.success) { if (data.user) setAuthData(data.user); onLoginSuccess(); } else setError(data.message || "Erreur"); } catch { setError("Erreur de connexion"); } finally { setLoading(false); } };
  const handleLogout = () => { clearAuthData(); setStep("register"); setCode(""); setTelephone(""); setPin(""); setConfirmPin(""); setVerified(false); setError(null); checkDeviceStatus(); };

  if (checkingDevice) return <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center"><div className="w-8 h-8 border-2 border-navy-200 border-t-violet-600 rounded-full animate-spin" /></div>;

  const inputClass = "w-full px-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm text-center text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-navy-400 transition-all";

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-gray-900 flex flex-col justify-between items-center p-5 relative">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <header className="w-full max-w-sm pt-8 flex flex-col items-center text-center relative z-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-500 flex items-center justify-center mb-4 shadow-lg shadow-navy-200 animate-float">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-100 text-navy-800 text-[11px] font-bold tracking-wide uppercase mb-3">
          <span className="w-2 h-2 rounded-full bg-navy-500 animate-pulse" /> Espace Enseignant
        </div>
        <h1 className="text-3xl font-black gradient-text tracking-tight">ClassiNote</h1>
        <p className="text-sm text-gray-400 max-w-xs mt-2 leading-relaxed">
          {step === "register" && !verified && "Entrez votre code d'acces et votre numero de telephone."}
          {step === "register" && verified && "Definissez un code PIN a 4 chiffres."}
          {step === "login" && "Appareil reconnu. Entrez votre telephone et PIN."}
          {step === "pin" && "Saisissez votre code PIN pour deverrouiller."}
          {step === "change_pin" && "Votre PIN a ete reinitialise. Veuillez en definir un nouveau."}
        </p>
      </header>
      <main className="w-full max-w-sm my-auto py-6 flex flex-col items-center relative z-10">
        <div className="w-full bg-white rounded-2xl p-6 shadow-xl border border-navy-100 flex flex-col items-center">
          {step === "register" && !verified && (
            <form onSubmit={handleVerify} className="w-full space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-navy-100 text-navy-800 flex items-center justify-center mx-auto mb-2"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></div>
              <div className="text-center"><h2 className="text-lg font-bold text-gray-900">Premiere connexion</h2><p className="text-xs text-gray-400 mt-1">Code d'acces et numero de telephone</p></div>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))} placeholder="Code d'acces (8 caracteres)" maxLength={8} autoFocus className={`${inputClass} font-mono font-bold tracking-[0.2em] uppercase`} />
              <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value.replace(/[^0-9+]/g, '').slice(0, 15))} placeholder="Numero de telephone" className={inputClass} />
              {error && <p className="text-xs text-rose-500 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>}
              <button type="submit" disabled={loading || code.length !== 8 || !telephone.trim()} className="w-full h-12 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-navy-200 disabled:opacity-40 cursor-pointer transition-all">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verifier'}</button>
            </form>
          )}
          {step === "register" && verified && (
            <form onSubmit={handlePinSetup} className="w-full space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              <div className="text-center"><h2 className="text-lg font-bold text-gray-900">Code verifie</h2><p className="text-xs text-gray-400 mt-1">Definissez un code PIN a 4 chiffres</p></div>
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="PIN a 4 chiffres" maxLength={4} autoFocus className={`${inputClass} font-mono font-bold tracking-[0.3em]`} />
              <input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Confirmer le PIN" maxLength={4} className={`${inputClass} font-mono font-bold tracking-[0.3em]`} />
              {error && <p className="text-xs text-rose-500 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => { setVerified(false); setError(null); }} className="flex-1 h-12 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl cursor-pointer hover:bg-gray-200 transition-all">Retour</button>
                <button type="submit" disabled={loading || pin.length !== 4 || pin !== confirmPin} className="flex-1 h-12 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-navy-200 disabled:opacity-40 cursor-pointer transition-all">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Enregistrer"}</button>
              </div>
            </form>
          )}
          {step === "login" && (
            <form onSubmit={handleDeviceLogin} className="w-full space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-navy-100 text-navy-800 flex items-center justify-center mx-auto mb-2"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg></div>
              <div className="text-center"><h2 className="text-lg font-bold text-gray-900">Connexion</h2><p className="text-xs text-gray-400 mt-1">Appareil reconnu, entrez vos identifiants</p></div>
              <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value.replace(/[^0-9+]/g, '').slice(0, 15))} placeholder="Numero de telephone" autoFocus className={inputClass} />
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="&bull; &bull; &bull; &bull;" maxLength={4} className={`${inputClass} font-mono font-bold tracking-[0.3em]`} />
              {error && <p className="text-xs text-rose-500 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>}
              <button type="submit" disabled={loading || !telephone.trim() || pin.length !== 4} className="w-full h-12 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-navy-200 disabled:opacity-40 cursor-pointer transition-all">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Se connecter"}</button>
            </form>
          )}
          {step === "pin" && (
            <form onSubmit={handleUnlock} className="w-full space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-navy-100 text-navy-800 flex items-center justify-center mx-auto mb-2"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
              <div className="text-center"><h2 className="text-lg font-bold text-gray-900">Deverrouiller</h2><p className="text-xs text-gray-400 mt-1">Saisissez votre code PIN</p></div>
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="&bull; &bull; &bull; &bull;" maxLength={4} autoFocus className={`${inputClass} font-mono font-bold tracking-[0.3em]`} />
              {error && <p className="text-xs text-rose-500 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>}
              <button type="submit" disabled={loading || pin.length !== 4} className="w-full h-12 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-navy-200 disabled:opacity-40 cursor-pointer transition-all">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Deverrouiller"}</button>
              <button type="button" onClick={handleLogout} className="w-full py-3 text-gray-400 hover:text-gray-600 font-medium text-sm rounded-xl transition-colors cursor-pointer">Se deconnecter</button>
            </form>
          )}
          {step === "change_pin" && (
            <form onSubmit={handleChangePin} className="w-full space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></div>
              <div className="text-center"><h2 className="text-lg font-bold text-gray-900">Changer le PIN</h2><p className="text-xs text-gray-400 mt-1">Votre PIN a ete reinitialise</p></div>
              <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Nouveau PIN" maxLength={4} autoFocus className={`${inputClass} font-mono font-bold tracking-[0.3em]`} />
              <input type="password" value={confirmNewPin} onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Confirmer le PIN" maxLength={4} className={`${inputClass} font-mono font-bold tracking-[0.3em]`} />
              {error && <p className="text-xs text-rose-500 text-center font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>}
              <button type="submit" disabled={loading || newPin.length !== 4 || newPin !== confirmNewPin} className="w-full h-12 bg-gradient-to-r from-navy-800 to-navy-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-navy-200 disabled:opacity-40 cursor-pointer transition-all">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Changer le PIN"}</button>
            </form>
          )}
        </div>
      </main>
      <footer className="w-full max-w-sm pb-4 text-center relative z-10"><p className="text-[11px] text-gray-300 font-medium">ClassiNote &copy; {new Date().getFullYear()} — Espace Enseignant</p></footer>
    </div>
  );
}

