import React from "react";
import { NavView } from "../types";
import { isSuperadmin, getUser } from "../api";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  School,
  GitMerge,
  FileCheck2,
  Calendar,
  Megaphone,
  MessageSquare,
  CreditCard,
  Receipt,
  Settings,
  ChevronRight,
  ShieldCheck,
  X,
  BookOpen,
  Tag,
  BarChart3,
  Building2,
  UserCog,
  Brain,
  ScrollText,
  Shield,
  FileText,
  DollarSign,
} from "lucide-react";

interface SidebarProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  unreadCount: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  totalStudents: number;
  onLogout?: () => void;
  onChangePassword?: () => void;
}

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

const saNavItems: NavItem[] = [
  { id: "sa-schools", label: "Écoles", icon: Building2 },
  { id: "sa-admins", label: "Administrateurs", icon: UserCog },
  { id: "sa-activityLogs", label: "Journal d'activités", icon: ScrollText },
  { id: "aiProviders", label: "Providers IA", icon: Brain },
];

const schoolNavItems = (totalStudents: number, unreadCount: number): NavItem[] => [
  { id: "dashboard", label: "Tableau de Bord", icon: LayoutDashboard },
  { id: "teachers", label: "Professeurs", icon: GraduationCap },
  { id: "students", label: "Élèves & Scolarité", icon: Users, badge: totalStudents },
  { id: "classes", label: "Classes", icon: School },
  { id: "subjects", label: "Matières & Disciplines", icon: BookOpen },
  { id: "feeItems", label: "Tarifs & Frais", icon: Tag },
  { id: "assignments", label: "Affectations", icon: GitMerge },
  { id: "gradeEntry", label: "Notes & Évaluations", icon: FileCheck2 },
  { id: "bulletins", label: "Bulletins", icon: FileText },
  { id: "timetable", label: "Emplois du Temps", icon: Calendar },
  { id: "announcements", label: "Avis aux Parents", icon: Megaphone },
  {
    id: "conversations",
    label: "Conversations",
    icon: MessageSquare,
    badge: unreadCount > 0 ? unreadCount : undefined,
    badgeColor: "bg-amber-500 text-white",
  },
  {
    id: "subscription",
    label: "Abonnement",
    icon: CreditCard,
    badge: "1000F/m",
    badgeColor: "bg-emerald-600 text-white",
  },
  { id: "payments", label: "Caisse & Reçus", icon: Receipt },
  { id: "comptabilite", label: "Comptabilité", icon: DollarSign },
  { id: "permissions", label: "Permissions", icon: Shield },
  { id: "settings", label: "Paramètres", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  unreadCount,
  isOpenMobile,
  setIsOpenMobile,
  totalStudents,
  onLogout,
  onChangePassword,
}) => {
  const user = getUser();
  const sa = isSuperadmin();

  const handleSelect = (id: NavView) => {
    setActiveView(id);
    setIsOpenMobile(false);
  };

  const roleLabel = sa
    ? "Super Administrateur"
    : "Administrateur";
  const roleBadge = sa ? "SUPER ADMIN" : "ADMIN";
  const roleBadgeColor = sa
    ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
    : "bg-blue-500/20 text-blue-300 border border-blue-400/30";

  const items = schoolNavItems(totalStudents, unreadCount);

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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ${
              sa
                ? "bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/20 ring-amber-400/30"
                : "bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-blue-500/20 ring-blue-400/30"
            }`}>
              {sa ? "S" : "A"}
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
          {/* Superadmin Platform Menu */}
          {sa && (
            <>
              <div className="px-3 pb-2 pt-1 text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider">
                Platforme
              </div>
              {saNavItems.map((item) => {
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
                    <div className="flex items-center gap-2">
                      {item.badge !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${item.badgeColor || "bg-slate-800 text-slate-300"}`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                    </div>
                  </button>
                );
              })}
              <div className="my-3 mx-3 border-t border-slate-800/80" />
            </>
          )}

          {/* School Menu - hidden for superadmin */}
          {!sa && (
            <>
              <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Menu Principal
              </div>

              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge !== undefined && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            item.badgeColor || (isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-300")
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
            <div className={`p-2 rounded-lg ring-1 ${
              sa ? "bg-amber-500/10 text-amber-400 ring-amber-500/20" : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
            }`}>
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
            {onChangePassword && (
              <button
                onClick={onChangePassword}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                Mot de passe
              </button>
            )}
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
