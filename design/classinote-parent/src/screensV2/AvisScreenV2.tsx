import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';

export const AvisScreenV2: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [filter, setFilter] = useState('Tous');
  const [loading, setLoading] = useState(true);

  const loadNotices = useCallback(async () => {
    try {
      const [resRem, resAnn] = await Promise.all([
        apiFetch('/parent/remarques').catch(() => null),
        apiFetch('/parent/avis').catch(() => null),
      ]);

      const items: any[] = [];

      if (resRem?.ok) {
        const data = await resRem.json();
        if (Array.isArray(data)) {
          data.forEach((r: any) => {
            items.push({
              id: `rem-${r.id}`,
              author: r.prof ? `${r.prof.prenom || ''} ${r.prof.nom || ''}`.trim() : 'Professeur',
              role: r.prof?.affectations?.[0]?.matiere?.libelle || '',
              date: r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '',
              type: r.type === 'felicitations' ? 'Felicitations' : r.type === 'attention' ? 'Attention' : 'Information',
              content: r.contenu || '',
              isNew: r.created_at ? (Date.now() - new Date(r.created_at).getTime()) < 172800000 : false,
            });
          });
        }
      }

      if (resAnn?.ok) {
        const data = await resAnn.json();
        if (Array.isArray(data)) {
          data.forEach((a: any) => {
            items.push({
              id: `ann-${a.id}`,
              author: a.author?.name || 'Administration',
              role: 'Administration',
              date: a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '',
              type: 'Information',
              content: a.contenu || '',
              isNew: a.created_at ? (Date.now() - new Date(a.created_at).getTime()) < 172800000 : false,
            });
          });
        }
      }

      setNotices(items);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotices(); }, [loadNotices]);

  const filters = ['Tous', 'Felicitations', 'Attention', 'Information'];
  const filtered = filter === 'Tous' ? notices : notices.filter(n => n.type === filter);

  const getTypeStyle = (type: string) => {
    if (type === 'Felicitations') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (type === 'Attention') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'Felicitations') return 'emoji_events';
    if (type === 'Attention') return 'warning';
    return 'info';
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-[#375ca6] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto">
      <div className="pt-2 mb-4">
        <h1 className="text-lg font-bold text-[#00113a]">Avis</h1>
        <p className="text-xs text-gray-400">Remarques et annonces de l'equipe pedagogique</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === f ? 'bg-[#002366] text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-[#375ca6]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Aucun avis.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(notice => (
            <div key={notice.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#002366] text-white flex items-center justify-center text-xs font-bold">
                    {notice.author.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#00113a]">{notice.author}</p>
                    {notice.role && <p className="text-[10px] text-gray-400">{notice.role}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {notice.isNew && (
                    <span className="px-2 py-0.5 rounded-full bg-[#002366] text-white text-[9px] font-bold">Nouveau</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeStyle(notice.type)}`}>
                    {notice.type}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{notice.content}</p>
              <p className="text-[10px] text-gray-300 mt-2">{notice.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
