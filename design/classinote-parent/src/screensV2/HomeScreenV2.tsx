import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';

interface HomeScreenV2Props {
  onNavigate: (tab: string) => void;
}

export const HomeScreenV2: React.FC<HomeScreenV2Props> = ({ onNavigate }) => {
  const [parentName, setParentName] = useState('');
  const [children, setChildren] = useState<any[]>([]);
  const [activeChildId, setActiveChildId] = useState('');
  const [latestGrade, setLatestGrade] = useState<any>(null);
  const [latestNotice, setLatestNotice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [resEnfants, resNotes, resRemarques] = await Promise.all([
        apiFetch('/parent/enfants').catch(() => null),
        apiFetch('/parent/notes').catch(() => null),
        apiFetch('/parent/remarques').catch(() => null),
      ]);

      if (resEnfants?.ok) {
        const data = await resEnfants.json();
        if (data.success && Array.isArray(data.enfants) && data.enfants.length > 0) {
          setParentName(data.parent?.nom_complet || '');
          const kids = data.enfants.map((e: any) => ({
            id: String(e.id),
            name: `${e.nom || ''} ${e.prenom || ''}`.trim(),
            classe: e.classe?.libelle || '',
            locked: !!e.access_locked,
          }));
          setChildren(kids);
          if (!activeChildId || !kids.find((k: any) => k.id === activeChildId)) {
            setActiveChildId(kids[0].id);
          }
        }
      }

      if (resNotes?.ok) {
        const notes = await resNotes.json();
        if (Array.isArray(notes) && notes.length > 0) {
          const n = notes[0];
          setLatestGrade({
            subject: n.evaluation?.matiere?.libelle || 'Matiere',
            title: n.evaluation?.titre || 'Evaluation',
            score: n.note ?? 0,
            max: n.evaluation?.note_sur || 20,
          });
        }
      }

      if (resRemarques?.ok) {
        const remarques = await resRemarques.json();
        if (Array.isArray(remarques) && remarques.length > 0) {
          const r = remarques[0];
          setLatestNotice({
            author: r.prof ? `${r.prof.prenom || ''} ${r.prof.nom || ''}`.trim() : 'Professeur',
            text: r.contenu || '',
            type: r.type || 'info',
          });
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [activeChildId]);

  useEffect(() => { loadData(); }, [loadData]);

  const activeChild = children.find(c => c.id === activeChildId) || children[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-[#375ca6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const menuItems = [
    { id: 'notes', icon: 'grade', label: 'Notes', desc: 'Resultats et graphiques', color: 'bg-blue-500' },
    { id: 'examens', icon: 'event_note', label: 'Examens', desc: 'Evaluations a venir', color: 'bg-rose-500' },
    { id: 'avis', icon: 'notifications_active', label: 'Avis', desc: 'Remarques des professeurs', color: 'bg-amber-500' },
    { id: 'paiements', icon: 'payments', label: 'Paiements', desc: 'Scolarite et frais', color: 'bg-emerald-500' },
    { id: 'schedule', icon: 'calendar_month', label: 'Emploi du temps', desc: 'Horaires des cours', color: 'bg-purple-500' },
    { id: 'messages', icon: 'chat', label: 'Messages', desc: 'Discuter avec l\'ecole', color: 'bg-indigo-500' },
    { id: 'support', icon: 'support_agent', label: 'Assistance', desc: 'Besoin d\'aide ?', color: 'bg-gray-500' },
  ];

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-5">
      {/* Child selector pills */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setActiveChildId(child.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                child.id === activeChildId
                  ? 'bg-[#002366] text-white shadow-md'
                  : 'bg-white text-[#375ca6] border border-[#375ca6]/20 hover:border-[#375ca6]/40'
              }`}
            >
              {child.name.split(' ')[0]}
              {child.classe && <span className="opacity-70 ml-1">({child.classe})</span>}
            </button>
          ))}
        </div>
      )}

      {/* Status card */}
      {activeChild && !activeChild.locked && (
        <div className="bg-gradient-to-br from-[#002366] to-[#1a3a7a] text-white rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-blue-200">Bonjour {parentName}</p>
                <p className="text-lg font-bold mt-0.5">Tout va bien !</p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-400/20">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Present(e)
              </div>
            </div>
            <p className="text-xs text-blue-200/80 mt-1">
              {activeChild.name} est en classe aujourd'hui.
            </p>
          </div>
        </div>
      )}

      {/* Locked child */}
      {activeChild?.locked && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center">
          <span className="material-symbols-outlined text-3xl text-rose-400">lock</span>
          <p className="text-sm font-bold text-rose-800 mt-2">Acces bloque</p>
          <p className="text-xs text-rose-600 mt-1">Contactez l'administration.</p>
        </div>
      )}

      {/* Latest grade card */}
      {latestGrade && (
        <button
          onClick={() => onNavigate('notes')}
          className="w-full bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002366]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#002366]">grade</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{latestGrade.subject}</p>
              <p className="text-[11px] text-gray-400">{latestGrade.title}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-[#002366]">{latestGrade.score}</span>
            <span className="text-xs text-gray-300 font-bold">/{latestGrade.max}</span>
          </div>
        </button>
      )}

      {/* Latest notice card */}
      {latestNotice && (
        <button
          onClick={() => onNavigate('avis')}
          className="w-full bg-white rounded-2xl p-4 border border-gray-100 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#375ca6] text-sm">comment</span>
            <p className="text-xs font-bold text-gray-900">{latestNotice.author}</p>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">"{latestNotice.text}"</p>
        </button>
      )}

      {/* Menu grid */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Menu</p>
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="bg-white rounded-2xl p-4 border border-gray-100 text-left hover:shadow-md transition-shadow active:scale-[0.98]"
            >
              <div className={`w-10 h-10 rounded-xl ${item.color} text-white flex items-center justify-center mb-3`}>
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
              </div>
              <p className="text-xs font-bold text-gray-900">{item.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
