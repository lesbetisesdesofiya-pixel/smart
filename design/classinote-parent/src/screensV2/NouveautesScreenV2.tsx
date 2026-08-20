import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';

interface Nouveaute {
  id: string;
  type: 'note' | 'absence' | 'examen' | 'annonce' | 'remarque' | 'paiement' | 'message';
  icon: string;
  color: string;
  bgColor: string;
  title: string;
  subtitle: string;
  date: string;
  rawDate: Date;
  isNew: boolean;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
  note: { icon: 'grade', color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Notes' },
  absence: { icon: 'event_busy', color: 'text-rose-600', bgColor: 'bg-rose-50', label: 'Absences' },
  examen: { icon: 'event_note', color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Examens' },
  annonce: { icon: 'campaign', color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Annonces' },
  remarque: { icon: 'edit_note', color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'Remarques' },
  paiement: { icon: 'payments', color: 'text-teal-600', bgColor: 'bg-teal-50', label: 'Paiements' },
  message: { icon: 'chat', color: 'text-indigo-600', bgColor: 'bg-indigo-50', label: 'Messages' },
};

export const NouveautesScreenV2: React.FC = () => {
  const [items, setItems] = useState<Nouveaute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      const [resNotes, resAbsences, resExamens, resAnnonces, resRemarques, resPaiements, resMessages] = await Promise.all([
        apiFetch('/parent/notes').catch(() => null),
        apiFetch('/parent/absences').catch(() => null),
        apiFetch('/parent/evaluations').catch(() => null),
        apiFetch('/parent/avis').catch(() => null),
        apiFetch('/parent/remarques').catch(() => null),
        apiFetch('/parent/paiements').catch(() => null),
        apiFetch('/parent/messages').catch(() => null),
      ]);

      const allItems: Nouveaute[] = [];
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      if (resNotes?.ok) {
        const data = await resNotes.json();
        if (Array.isArray(data)) {
          data.forEach((n: any) => {
            const d = n.created_at ? new Date(n.created_at) : new Date();
            if (d.getTime() >= thirtyDaysAgo) {
              allItems.push({
                id: `note-${n.id}`,
                type: 'note',
                ...TYPE_CONFIG.note,
                title: `${n.evaluation?.matiere?.libelle || 'Matiere'} : ${n.note}/${n.evaluation?.note_sur || 20}`,
                subtitle: n.evaluation?.titre || 'Evaluation',
                date: formatDate(d),
                rawDate: d,
                isNew: now - d.getTime() < 172800000,
              });
            }
          });
        }
      }

      if (resAbsences?.ok) {
        const data = await resAbsences.json();
        if (Array.isArray(data)) {
          data.forEach((a: any) => {
            const d = a.date ? new Date(a.date) : new Date();
            if (d.getTime() >= thirtyDaysAgo && !a.est_present) {
              allItems.push({
                id: `abs-${a.id}`,
                type: 'absence',
                ...TYPE_CONFIG.absence,
                title: a.remarque || 'Absence',
                subtitle: a.classe?.libelle || '',
                date: formatDate(d),
                rawDate: d,
                isNew: now - d.getTime() < 172800000,
              });
            }
          });
        }
      }

      if (resExamens?.ok) {
        const data = await resExamens.json();
        if (Array.isArray(data)) {
          data.forEach((e: any) => {
            const d = e.date ? new Date(e.date) : new Date();
            const config = TYPE_CONFIG.examen;
            allItems.push({
              id: `exam-${e.id}`,
              type: 'examen',
              icon: config.icon,
              color: config.color,
              bgColor: config.bgColor,
              title: e.titre || 'Examen',
              subtitle: `${e.matiere?.libelle || ''} — ${e.note_sur || 20} pts`,
              date: formatDate(d),
              rawDate: d,
              isNew: d.getTime() >= now,
            });
          });
        }
      }

      if (resAnnonces?.ok) {
        const data = await resAnnonces.json();
        if (Array.isArray(data)) {
          data.forEach((a: any) => {
            const d = a.created_at ? new Date(a.created_at) : new Date();
            if (d.getTime() >= thirtyDaysAgo) {
              allItems.push({
                id: `ann-${a.id}`,
                type: 'annonce',
                ...TYPE_CONFIG.annonce,
                title: a.titre || 'Annonce',
                subtitle: (a.contenu || '').substring(0, 80),
                date: formatDate(d),
                rawDate: d,
                isNew: now - d.getTime() < 172800000,
              });
            }
          });
        }
      }

      if (resRemarques?.ok) {
        const data = await resRemarques.json();
        if (Array.isArray(data)) {
          data.forEach((r: any) => {
            const d = r.created_at ? new Date(r.created_at) : new Date();
            if (d.getTime() >= thirtyDaysAgo) {
              const prof = r.prof ? `${r.prof.prenom || ''} ${r.prof.nom || ''}`.trim() : 'Professeur';
              allItems.push({
                id: `rem-${r.id}`,
                type: 'remarque',
                ...TYPE_CONFIG.remarque,
                title: prof,
                subtitle: (r.contenu || '').substring(0, 80),
                date: formatDate(d),
                rawDate: d,
                isNew: now - d.getTime() < 172800000,
              });
            }
          });
        }
      }

      if (resPaiements?.ok) {
        const data = await resPaiements.json();
        if (Array.isArray(data)) {
          data.forEach((p: any) => {
            const d = p.created_at ? new Date(p.created_at) : new Date();
            if (d.getTime() >= thirtyDaysAgo) {
              allItems.push({
                id: `pay-${p.id}`,
                type: 'paiement',
                ...TYPE_CONFIG.paiement,
                title: `${p.montant?.toLocaleString('fr-FR') || 0} FCFA`,
                subtitle: p.frais?.libelle || p.type || 'Paiement',
                date: formatDate(d),
                rawDate: d,
                isNew: now - d.getTime() < 172800000,
              });
            }
          });
        }
      }

      if (resMessages?.ok) {
        const data = await resMessages.json();
        if (Array.isArray(data)) {
          data.forEach((m: any) => {
            if (!m.lu) {
              const d = m.created_at ? new Date(m.created_at) : new Date();
              allItems.push({
                id: `msg-${m.id}`,
                type: 'message',
                ...TYPE_CONFIG.message,
                title: m.sender_name || 'Message',
                subtitle: (m.contenu || m.message || '').substring(0, 80),
                date: formatDate(d),
                rawDate: d,
                isNew: true,
              });
            }
          });
        }
      }

      allItems.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
      setItems(allItems);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const types = ['all', ...Object.keys(TYPE_CONFIG)];
  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);
  const newCount = items.filter(i => i.isNew).length;

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-[#375ca6] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto">
      <div className="pt-2 mb-4">
        <h1 className="text-lg font-bold text-[#00113a]">Nouveautes</h1>
        <p className="text-xs text-gray-400">
          {newCount > 0 ? `${newCount} nouveaute${newCount > 1 ? 's' : ''} cette semaine` : 'Tout est a jour'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-semibold">Total</p>
          <p className="text-lg font-extrabold text-[#002366]">{items.length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-semibold">Nouveau</p>
          <p className="text-lg font-extrabold text-rose-500">{newCount}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-semibold">Categories</p>
          <p className="text-lg font-extrabold text-gray-500">{new Set(items.map(i => i.type)).size}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {types.map(t => {
          const label = t === 'all' ? 'Tout' : TYPE_CONFIG[t]?.label || t;
          const count = t === 'all' ? items.length : items.filter(i => i.type === t).length;
          if (count === 0 && t !== 'all') return null;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === t ? 'bg-[#002366] text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-[#375ca6]'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Items list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-gray-200">notifications_off</span>
          <p className="text-sm text-gray-400 mt-2">Aucune nouveaute.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div
              key={item.id}
              className={`bg-white rounded-xl p-3.5 border border-gray-100 flex items-start gap-3 transition-all ${item.isNew ? 'ring-1 ring-[#002366]/10' : ''}`}
            >
              <div className={`w-9 h-9 rounded-xl ${item.bgColor} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined text-lg ${item.color}`}>{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                  {item.isNew && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtitle}</p>
                <p className="text-[10px] text-gray-300 mt-1">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function formatDate(d: Date): string {
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
