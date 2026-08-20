import React from 'react';
import { ScreenType, Classe, Evaluation } from '../../types';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenType) => void;
  teacherName: string;
  subjects: string[];
  stats: { nb_classes: number; nb_matieres: number; nb_evaluations: number };
  classes: Classe[];
  evaluations: Evaluation[];
  onSelectClass?: (classeId: number) => void;
  onTestNotification?: () => void;
  testNotifLoading?: boolean;
  testNotifMessage?: string | null;
  successMessage?: string | null;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate, teacherName, subjects, stats, classes, evaluations,
  onSelectClass, onTestNotification, testNotifLoading, testNotifMessage, successMessage,
}) => {
  const quickActions = [
    { id: 'interrogation' as ScreenType, label: 'Interrogation rapide', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-navy-800 to-navy-500', desc: 'Creer une interrogation' },
    { id: 'assessments' as ScreenType, label: 'Saisir des notes', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', gradient: 'from-blue-600 to-blue-400', desc: 'Saisir les notes d\'une evaluation' },
    { id: 'presences' as ScreenType, label: 'Presences', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', gradient: 'from-emerald-600 to-emerald-400', desc: 'Gerer les presences' },
    { id: 'create_remark' as ScreenType, label: 'Remarque', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', gradient: 'from-rose-600 to-rose-400', desc: 'Ajouter une remarque sur un eleve' },
    { id: 'assessments' as ScreenType, label: 'Voir les notes', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', gradient: 'from-amber-600 to-amber-400', desc: 'Consulter les evaluations' },
    { id: 'messaging' as ScreenType, label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', gradient: 'from-teal-600 to-teal-400', desc: 'Discuter avec les parents' },
  ];

  return (
    <div className="p-4 lg:p-8 pb-24 space-y-6">
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-slideUp">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
          <p className="text-sm font-semibold text-emerald-700">{successMessage}</p>
        </div>
      )}

      <section className="animate-slideUp">
        <p className="text-sm text-gray-400 mb-1">Bonjour,</p>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{teacherName}</h2>
        <div className="flex gap-2 mt-2 flex-wrap">{subjects.map((sub, i) => (<span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-navy-100 text-navy-800">{sub}</span>))}</div>
      </section>

      <section className="grid grid-cols-3 gap-3 animate-slideUp" style={{ animationDelay: '0.1s' }}>
        <div className="bg-white rounded-xl p-4 text-center border border-navy-100 shadow-sm"><p className="text-2xl lg:text-3xl font-bold gradient-text">{stats.nb_classes}</p><p className="text-xs text-gray-400 mt-1">Classes</p></div>
        <div className="bg-white rounded-xl p-4 text-center border border-navy-100 shadow-sm"><p className="text-2xl lg:text-3xl font-bold gradient-text">{stats.nb_matieres}</p><p className="text-xs text-gray-400 mt-1">Matieres</p></div>
        <div className="bg-white rounded-xl p-4 text-center border border-navy-100 shadow-sm"><p className="text-2xl lg:text-3xl font-bold gradient-text">{stats.nb_evaluations}</p><p className="text-xs text-gray-400 mt-1">Evaluations</p></div>
      </section>

      <section className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button key={action.id + action.label} onClick={() => onNavigate(action.id)} className="bg-white rounded-xl p-4 text-left border border-navy-100 shadow-sm hover:shadow-md hover:border-navy-200 transition-all group active:scale-95 cursor-pointer">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} /></svg></div>
              <p className="text-sm font-bold text-gray-900">{action.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{action.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {classes.length > 0 && (
        <section className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Mes Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classes.map((classe) => (
              <button key={classe.id} onClick={() => onSelectClass?.(classe.id)} className="bg-white rounded-xl p-4 text-left border border-navy-100 shadow-sm hover:shadow-md hover:border-navy-200 transition-all group active:scale-[0.99] cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-bold shrink-0">{classe.libelle.slice(0, 2).toUpperCase()}</div>
                    <div><p className="font-bold text-sm text-gray-900">{classe.libelle}</p>{classe.section && <p className="text-[11px] text-gray-400 mt-0.5">{classe.section.libelle}</p>}</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-navy-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                {classe.eleves_count !== undefined && <p className="text-[11px] text-gray-400 mt-2 ml-[52px]">{classe.eleves_count} eleves</p>}
              </button>
            ))}
          </div>
        </section>
      )}

      {evaluations.length > 0 && (
        <section className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-gray-900">Evaluations recentes</h3><button onClick={() => onNavigate('assessments')} className="text-xs font-medium text-navy-800 hover:text-navy-800 transition-colors">Voir tout &rarr;</button></div>
          <div className="space-y-2">
            {evaluations.slice(0, 5).map((ev) => (
              <div key={ev.id} onClick={() => onNavigate('assessments')} className="bg-white rounded-xl p-4 flex items-center justify-between border border-navy-100 shadow-sm hover:shadow-md hover:border-navy-200 transition-all cursor-pointer">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ev.has_notes ? 'bg-gradient-to-br from-emerald-500 to-emerald-400' : 'bg-gradient-to-br from-amber-500 to-amber-400'}`}><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ev.has_notes ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'} /></svg></div>
                  <div className="min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{ev.titre}</p><p className="text-[11px] text-gray-400">{ev.classe?.libelle} &middot; {ev.matiere?.libelle} &middot; Coeff. {ev.coefficient}</p></div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs text-gray-400">{new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                  {ev.has_notes ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold mt-1">Note</span> : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold mt-1">A saisir</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="animate-slideUp" style={{ animationDelay: '0.5s' }}>
        <button onClick={onTestNotification} disabled={testNotifLoading} className="w-full bg-white rounded-xl p-4 flex items-center justify-center gap-3 border border-navy-100 shadow-sm hover:shadow-md hover:border-navy-200 transition-all cursor-pointer disabled:opacity-50">
          {testNotifLoading ? <div className="w-5 h-5 border-2 border-navy-200 border-t-violet-600 rounded-full animate-spin" /> : <><svg className="w-5 h-5 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg><span className="text-sm font-medium text-gray-600">Tester les notifications push</span></>}
        </button>
        {testNotifMessage && <p className="text-xs text-center text-navy-800 mt-2">{testNotifMessage}</p>}
      </section>
    </div>
  );
};

