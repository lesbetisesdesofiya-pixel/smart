import React from "react";
import {
  Users,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  Plus,
  Megaphone,
  Receipt,
  FileCheck2,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Student, Teacher, SchoolClass, PaymentRecord, Announcement, NavView } from "../types";

interface DashboardProps {
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  payments: PaymentRecord[];
  announcements: Announcement[];
  setActiveView: (view: NavView) => void;
  onOpenAiAssistant: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  teachers,
  classes,
  payments,
  announcements,
  setActiveView,
  onOpenAiAssistant
}) => {

  // Calculated stats
  const totalStudents = students.length;
  const activeTeachers = teachers.filter((t) => t.status === "actif").length;
  const openClasses = classes.length;

  const totalCollected = payments.reduce((sum, p) => sum + p.amountFCFA, 0);
  const upToDateStudents = students.filter((s) => s.paymentStatus === "a_jour").length;
  const lateStudents = students.filter((s) => s.paymentStatus === "en_retard").length;
  const paymentRate = Math.round((upToDateStudents / (totalStudents || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Abonnement ClassiNote Actif (1 000 FCFA / mois)</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Tableau de Bord Administrateur
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Synthese globale de l'établissement: effectifs, recouvrement de scolarité et accès rapide aux outils de gestion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAiAssistant}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-amber-300" />
              <span>Rédiger un Avis (IA)</span>
            </button>
            <button
              onClick={() => setActiveView("students")}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Inscrire un Élève</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Clean Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Élèves */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Élèves Inscrits
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-slate-900">{totalStudents}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Effectif stable
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Capacité: 1 500 élèves max</p>
        </div>

        {/* Stat 2: Enseignants & Classes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Classes & Professeurs
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-slate-900">{openClasses}</span>
            <span className="text-xs font-medium text-slate-500">classes / {activeTeachers} profs</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% cours programmés
          </p>
        </div>

        {/* Stat 3: Recouvrement Scolarité */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recouvrement Scolarité
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-blue-700">{paymentRate}%</span>
            <span className="text-xs font-medium text-slate-500">à jour</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            {totalCollected.toLocaleString("fr-FR")} FCFA encaissés
          </p>
        </div>

        {/* Stat 4: ClassiNote License */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Abonnement ClassiNote
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-slate-900">1 000 FCFA</span>
            <span className="text-xs font-medium text-slate-500">/ élève / mois</span>
          </div>
          <p className="mt-1 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Licence Établissement Active
          </p>
        </div>
      </div>

      {/* Main Grid: Essential Financial Recovery & Quick Administrative Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Financial Recovery Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">État du Recouvrement des Frais</h3>
                <p className="text-xs text-slate-500">Suivi synthétique des paiements de scolarité</p>
              </div>
              <button
                onClick={() => setActiveView("payments")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Gestion Financière</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Proportion d'élèves à jour de scolarité ({upToDateStudents} sur {totalStudents})</span>
                  <span className="text-blue-600 font-bold">{paymentRate}%</span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${paymentRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500">Total Encaissé</p>
                  <p className="text-base font-black text-emerald-600 mt-1">
                    {totalCollected.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500">Élèves À Jour</p>
                  <p className="text-base font-black text-slate-900 mt-1">
                    {upToDateStudents} élèves
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                  <p className="text-[11px] font-bold text-amber-700">En Retard</p>
                  <p className="text-base font-black text-amber-600 mt-1">
                    {lateStudents} élèves
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Administrative Shortcuts & Announcements */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 mb-2">Raccourcis Directs</h3>

            <button
              onClick={() => setActiveView("announcements")}
              className="w-full p-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-900 font-semibold text-xs border border-blue-200/60 flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Megaphone className="w-4 h-4 text-blue-600" />
                <span>Publier un Avis aux Parents</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
            </button>

            <button
              onClick={() => setActiveView("evaluations")}
              className="w-full p-3 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs border border-emerald-200/60 flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Consulter les Notes de la Classe</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              onClick={() => setActiveView("timetable")}
              className="w-full p-3 rounded-xl bg-purple-50/80 hover:bg-purple-100 text-purple-900 font-semibold text-xs border border-purple-200/60 flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-purple-600" />
                <span>Consulter Emploi du Temps</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-600" />
            </button>

            <button
              onClick={() => setActiveView("subscription")}
              className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-between transition-colors shadow-md cursor-pointer"
            >
<div className="flex items-center gap-3">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Abonnement ClassiNote (1 000 FCFA / mois)</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Recent Parent Announcements */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">Derniers Avis Diffusés</h3>
              <button
                onClick={() => setActiveView("announcements")}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Voir tout
              </button>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 2).map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 line-clamp-1">{a.title}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      {a.readRate}% lus
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{a.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{a.sentDate}</span>
                    <span className="font-semibold text-blue-600">{a.targetAudience}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

