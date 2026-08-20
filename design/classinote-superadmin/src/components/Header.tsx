import React, { useState, useEffect } from "react";
import { Menu, Bell, User, ChevronDown, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { SuperadminView } from "../types";
import { getUser } from "../api";

interface HeaderProps {
  setIsOpenMobile: (open: boolean) => void;
  setActiveView: (view: SuperadminView) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  setIsOpenMobile,
  setActiveView,
  onLogout,
}) => {
  const user = getUser();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
      {/* Left section: Mobile toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          id="btn-mobile-sidebar-toggle"
          onClick={() => setIsOpenMobile(true)}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-md">SUPER ADMIN</span>
            <span>ClassiNote</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Administration de la plateforme</p>
        </div>
      </div>

      {/* Right section: Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Admin User Profile Tag */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-amber-100">
            SA
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || "Super Admin"}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{user?.email || ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
