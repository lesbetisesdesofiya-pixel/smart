import React, { useState } from "react";
import { Lock, Key, Eye, EyeOff } from "lucide-react";
import { changeMyPin, changeMyPassword } from "../api";

export const SecurityTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<"pin" | "password">("pin");

  // PIN change
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      setPinError("Les PIN ne correspondent pas");
      return;
    }
    if (newPin.length !== 6) {
      setPinError("Le PIN doit contenir 6 chiffres");
      return;
    }
    setPinLoading(true);
    setPinError(null);
    try {
      const data = await changeMyPin(currentPin, newPin);
      if (data.success) {
        setPinSuccess(true);
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        setTimeout(() => setPinSuccess(false), 3000);
      } else {
        setPinError(data.message || "Erreur");
      }
    } catch {
      setPinError("Erreur de connexion");
    } finally {
      setPinLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setPwdLoading(true);
    setPwdError(null);
    try {
      const data = await changeMyPassword(currentPassword, newPassword, confirmPassword);
      if (data.success || data.message) {
        setPwdSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPwdSuccess(false), 3000);
      } else {
        setPwdError(data.message || "Erreur");
      }
    } catch {
      setPwdError("Erreur de connexion");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection("pin")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
            activeSection === "pin" ? "bg-amber-600 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          <Key className="w-4 h-4" /> Code PIN
        </button>
        <button
          onClick={() => setActiveSection("password")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
            activeSection === "password" ? "bg-amber-600 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          <Lock className="w-4 h-4" /> Mot de passe
        </button>
      </div>

      {activeSection === "pin" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Changer le code PIN</h3>
          <form onSubmit={handleChangePin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">PIN actuel</label>
              <input
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-xl font-mono tracking-[0.3em] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nouveau PIN</label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-xl font-mono tracking-[0.3em] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Confirmer le nouveau PIN</label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-xl font-mono tracking-[0.3em] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {pinError && <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg">{pinError}</p>}
            {pinSuccess && <p className="text-xs text-emerald-600 font-medium bg-emerald-50 p-2 rounded-lg">PIN modifié avec succès !</p>}
            <button
              type="submit"
              disabled={pinLoading || !currentPin || !newPin || !confirmPin}
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 cursor-pointer"
            >
              {pinLoading ? "Modification..." : "Modifier le PIN"}
            </button>
          </form>
        </div>
      )}

      {activeSection === "password" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Changer le mot de passe</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mot de passe actuel</label>
              <div className="relative">
                <input
                  type={showCurrentPwd ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mot de passe actuel"
                  className="w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showNewPwd ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  className="w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {pwdError && <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg">{pwdError}</p>}
            {pwdSuccess && <p className="text-xs text-emerald-600 font-medium bg-emerald-50 p-2 rounded-lg">Mot de passe modifié avec succès !</p>}
            <button
              type="submit"
              disabled={pwdLoading || !currentPassword || !newPassword || !confirmPassword}
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 cursor-pointer"
            >
              {pwdLoading ? "Modification..." : "Modifier le mot de passe"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
