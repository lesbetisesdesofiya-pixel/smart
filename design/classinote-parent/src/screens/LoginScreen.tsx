import React from "react";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
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
          Connectez-vous via le lien WhatsApp envoyé par l'école.
        </p>
      </header>

      <main className="w-full max-w-sm my-auto py-4 flex flex-col items-center">
        <div className="w-full bg-white rounded-[28px] p-6 shadow-card border border-slate-100 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl">chat</span>
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-lg font-bold text-[#00113a]">Lien WhatsApp requis</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pour accéder à votre espace, demandez un lien d'accès à l'administration de l'école via WhatsApp.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-600 font-medium">
                Écrivez <span className="font-bold text-[#002366]">"dashboard"</span> sur WhatsApp pour recevoir votre lien.
              </p>
            </div>
          </div>
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
