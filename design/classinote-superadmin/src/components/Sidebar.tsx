import React from "react";
import { SuperadminView } from "../types";
import { getUser } from "../api";
import {
  Building2,
  UserCog,
  ScrollText,
  Brain,
  ChevronRight,
  ShieldCheck,
  X,
  Settings,
  BarChart3,
  FileCheck,
} from "lucide-react";

interface SidebarProps {
  activeView: SuperadminView;
  setActiveView: (view: SuperadminView) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onLogout?: () => void;
}

interface NavItem {
  id: SuperadminView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: "schools", label: "Écoles", icon: Building2 },
  { id: "admins", label: "Administrateurs", icon: UserCog },
  { id: "gradeSubmissions", label: "Notes reçues", icon: FileCheck },
  { id: "financialReports", label: "Rapports financiers", icon: BarChart3 },
  { id: "activityLogs", label: "Journal d'activités", icon: ScrollText },
  { id: "aiProviders", label: "Providers IA", icon: Brain },
  { id: "settings", label: "Paramètres", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isOpenMobile,
  setIsOpenMobile,
  onLogout,
}) => {
  const user = getUser();

  const handleSelect = (id: SuperadminView) => {
    setActiveView(id);
    setIsOpenMobile(false);
  };

  const roleLabel = "Super Administrateur";
  const roleBadge = "SUPER ADMIN";
  const roleBadgeColor = "bg-amber-500/20 text-amber-300 border border-amber-400/30";

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        id="sidebar-nav"
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Branding */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/20 ring-amber-400/30">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">ClassiNote</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-semibold tracking-wide rounded-md ${roleBadgeColor}`}>
                  {roleBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[180px]">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          <div className="px-3 pb-2 pt-1 text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider">
            Plateforme
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 font-semibold"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-amber-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 rounded-lg ring-1 bg-amber-500/10 text-amber-400 ring-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || roleLabel}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleSelect("settings")}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              Paramètres
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex-1 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
