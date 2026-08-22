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

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-5">
      {/* Child selector */}
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
        <div className="bg-gradient-to-br from-[#002366] to-[#1a3a7a] text-white rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -left-8 -top-8 w-24 h-24 bg-[#375ca6]/20 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-blue-200">Bonjour {parentName}</p>
                <p className="text-2xl font-extrabold mt-1">Tout va bien !</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/20">
                <span className="material-symbols-outlined text-emerald-300 text-2xl">check_circle</span>
              </div>
            </div>
            <p className="text-sm text-blue-200/80">
              {activeChild.name} est present(e) en classe aujourd'hui.
            </p>
          </div>
        </div>
      )}

      {/* Locked child */}
      {activeChild?.locked && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-rose-500 text-3xl">lock</span>
          </div>
          <p className="text-base font-bold text-rose-800">Acces bloque</p>
          <p className="text-sm text-rose-600 mt-1">Contactez l'administration pour debloquer.</p>
        </div>
      )}

      {/* Big action cards */}
      <div className="space-y-4">
        {/* Notes card */}
        <button
          onClick={() => onNavigate('notes')}
          className="w-full bg-white rounded-3xl p-5 border border-gray-100 text-left hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-2xl">grade</span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">Notes</p>
              <p className="text-sm text-gray-400 mt-0.5">Resultats et graphiques</p>
            </div>
            {latestGrade && (
              <div className="text-right">
                <span className="text-3xl font-extrabold text-[#002366]">{latestGrade.score}</span>
                <span className="text-sm text-gray-300 font-bold">/{latestGrade.max}</span>
              </div>
            )}
          </div>
        </button>

        {/* Examens card */}
        <button
          onClick={() => onNavigate('examens')}
          className="w-full bg-white rounded-3xl p-5 border border-gray-100 text-left hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-2xl">event_note</span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">Examens</p>
              <p className="text-sm text-gray-400 mt-0.5">Evaluations a venir</p>
            </div>
            <span className="material-symbols-outlined text-gray-300 text-2xl">chevron_right</span>
          </div>
        </button>

        {/* Messages card */}
        <button
          onClick={() => onNavigate('messages')}
          className="w-full bg-white rounded-3xl p-5 border border-gray-100 text-left hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-2xl">chat</span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">Messages</p>
              <p className="text-sm text-gray-400 mt-0.5">Discuter avec l'ecole</p>
            </div>
            <span className="material-symbols-outlined text-gray-300 text-2xl">chevron_right</span>
          </div>
        </button>

        {/* Paiements card */}
        <button
          onClick={() => onNavigate('paiements')}
          className="w-full bg-white rounded-3xl p-5 border border-gray-100 text-left hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-2xl">payments</span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">Paiements</p>
              <p className="text-sm text-gray-400 mt-0.5">Scolarite et frais</p>
            </div>
            <span className="material-symbols-outlined text-gray-300 text-2xl">chevron_right</span>
          </div>
        </button>
      </div>

      {/* Secondary actions - smaller grid */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate('avis')}
          className="bg-white rounded-2xl p-4 border border-gray-100 text-center hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-amber-600 text-xl">notifications_active</span>
          </div>
          <p className="text-xs font-bold text-gray-700">Avis</p>
        </button>

        <button
          onClick={() => onNavigate('schedule')}
          className="bg-white rounded-2xl p-4 border border-gray-100 text-center hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-purple-600 text-xl">calendar_month</span>
          </div>
          <p className="text-xs font-bold text-gray-700">Emploi</p>
        </button>

        <button
          onClick={() => onNavigate('support')}
          className="bg-white rounded-2xl p-4 border border-gray-100 text-center hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-gray-600 text-xl">support_agent</span>
          </div>
          <p className="text-xs font-bold text-gray-700">Aide</p>
        </button>
      </div>

      {/* Latest notice */}
      {latestNotice && (
        <button
          onClick={() => onNavigate('avis')}
          className="w-full bg-white rounded-3xl p-5 border border-gray-100 text-left hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#375ca6] text-lg">comment</span>
            <p className="text-sm font-bold text-gray-900">{latestNotice.author}</p>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">"{latestNotice.text}"</p>
        </button>
      )}
    </div>
  );
};
