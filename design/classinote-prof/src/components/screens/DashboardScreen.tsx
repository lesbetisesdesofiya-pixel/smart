import React, { useState } from 'react';
import { ScreenType } from '../../types';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenType) => void;
  teacherName: string;
  subjects: string[];
  hasUnreadMessages?: boolean;
  stats?: { nb_classes: number; nb_matieres: number; nb_evaluations: number };
  classes?: { id: number; libelle: string; section?: { libelle: string }; eleves_count?: number }[];
  onSelectClass?: (classeId: number) => void;
  onTestNotification?: () => void;
  testNotifLoading?: boolean;
  testNotifMessage?: string | null;
  successMessage?: string | null;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  teacherName,
  subjects,
  hasUnreadMessages = false,
  stats,
  classes = [],
  onSelectClass,
  onTestNotification,
  testNotifLoading,
  testNotifMessage,
  successMessage,
}) => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSuccess(true);
    setTimeout(() => {
      setSupportSuccess(false);
      setSupportMessage('');
      setIsSupportOpen(false);
    }, 2000);
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-10 pt-6 pb-28">
      {successMessage && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
          <p className="text-sm font-bold text-emerald-800">{successMessage}</p>
        </div>
      )}

      {/* DEBUG */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs font-mono space-y-1">
        <p><strong>DEBUG Dashboard</strong></p>
        <p>classes.length: {classes.length}</p>
        {classes.length > 0 && (
          <>
            <p>first class keys: {Object.keys(classes[0]).join(', ')}</p>
            <p>first class eleves: {JSON.stringify(classes[0].eleves?.slice(0, 2))}</p>
            <p>first class eleves_count: {classes[0].eleves_count}</p>
          </>
        )}
      </div>

      <section className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Bonjour, {teacherName}
          </h2>
          <div className="flex gap-2 mt-1 flex-wrap">
            {subjects.map((sub, i) => (
              <span key={i} className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-semibold">
                {sub}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="mb-8 grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant text-center">
            <p className="text-2xl font-bold text-primary">{stats.nb_classes}</p>
            <p className="text-xs text-on-surface-variant mt-1">Classes</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant text-center">
            <p className="text-2xl font-bold text-primary">{stats.nb_matieres}</p>
            <p className="text-xs text-on-surface-variant mt-1">Matières</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant text-center">
            <p className="text-2xl font-bold text-primary">{stats.nb_evaluations}</p>
            <p className="text-xs text-on-surface-variant mt-1">Évaluations</p>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="mb-10">
        <h3 className="text-lg md:text-xl font-bold text-on-surface mb-4">Actions rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div onClick={() => onNavigate('interrogation')} className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant flex flex-col justify-between aspect-square cursor-pointer hover:border-primary active:scale-95 transition-all group">
            <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">quiz</span>
            <p className="text-sm font-bold text-primary mt-2">Interrogation rapide</p>
          </div>

          <div onClick={() => onNavigate('grade_entry')} className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant flex flex-col justify-between aspect-square cursor-pointer hover:border-primary active:scale-95 transition-all group">
            <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">edit_note</span>
            <p className="text-sm font-bold text-primary mt-2">Saisir des notes</p>
          </div>

          <div onClick={() => onNavigate('presences')} className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant flex flex-col justify-between aspect-square cursor-pointer hover:border-primary active:scale-95 transition-all group">
            <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">fact_check</span>
            <p className="text-sm font-bold text-primary mt-2">Présences</p>
          </div>

          <div onClick={() => onNavigate('assessments')} className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant flex flex-col justify-between aspect-square cursor-pointer hover:border-primary active:scale-95 transition-all group">
            <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>assessment</span>
            <p className="text-sm font-bold text-primary mt-2">Voir les notes</p>
          </div>
        </div>
      </section>

      {/* Classes */}
      {classes.length > 0 && (
        <section className="mb-10">
          <h3 className="text-lg md:text-xl font-bold text-on-surface mb-4">Mes Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classes.map((classe) => (
              <div
                key={classe.id}
                onClick={() => onSelectClass?.(classe.id)}
                className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant hover:border-primary cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-on-surface">{classe.libelle}</p>
                    {classe.section && (
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{classe.section.libelle}</p>
                    )}
                  </div>
                  <span className="text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </span>
                </div>
                {classe.eleves_count !== undefined && (
                  <p className="text-[11px] text-on-surface-variant mt-2">{classe.eleves_count} élèves</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Evaluations */}
      <section className="mb-10">
        <h3 className="text-lg md:text-xl font-bold text-on-surface mb-4">Évaluations récentes</h3>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant text-center">
            <p className="text-sm text-on-surface-variant">Connectez-vous pour voir vos évaluations</p>
          </div>
        </div>
      </section>
    </main>
  );
};
