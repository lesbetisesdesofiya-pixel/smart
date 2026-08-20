import React from "react";
import { Settings, Shield } from "lucide-react";
import { SecurityTab } from "./SecurityTab";
import { PublicUrlSection } from "./PublicUrlSection";

export const SettingsManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-600" />
          <span>Paramètres</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Gérez vos paramètres de sécurité et de l'application
        </p>
      </div>

      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex items-center gap-4 shadow-md">
        <div className="p-2 bg-amber-500/20 rounded-xl">
          <Shield className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-amber-300">Sécurité du compte</h3>
          <p className="text-xs text-slate-300">
            Modifiez votre code PIN ou votre mot de passe pour sécuriser votre accès.
          </p>
        </div>
      </div>

      <SecurityTab />

      <PublicUrlSection />
    </div>
  );
};
