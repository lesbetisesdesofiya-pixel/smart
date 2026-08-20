import React, { useState, useEffect } from 'react';
import { Notice } from '../types';
import { Avatar } from '../components/Avatar';

const STORAGE_KEY = 'classinote_viewed_notices';

function getViewedIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch { return new Set(); }
}

function saveViewedIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

interface AvisScreenProps {
  notices: Notice[];
}

export const AvisScreen: React.FC<AvisScreenProps> = ({ notices }) => {
  const [filterType, setFilterType] = useState<string>('Tous');
  const [viewedIds, setViewedIds] = useState<Set<string>>(getViewedIds);

  const filteredNotices = notices.filter((n) => {
    if (filterType === 'Tous') return true;
    return n.type === filterType;
  });

  // Mark all currently visible notices as viewed after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      const ids = getViewedIds();
      let changed = false;
      filteredNotices.forEach(n => {
        if (n.isNew && !ids.has(n.id)) {
          ids.add(n.id);
          changed = true;
        }
      });
      if (changed) {
        saveViewedIds(ids);
        setViewedIds(new Set(ids));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [filteredNotices]);

  return (
    <div className="space-y-5 pb-24 px-4 sm:px-5 max-w-lg mx-auto animate-fadeIn">
      <div className="pt-2">
        <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Avis et Remarques</h2>
        <p className="text-xs text-[#757682] mt-0.5">Dernières communications de l'équipe pédagogique.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {['Tous', 'Félicitations', 'Attention', 'Information générale'].map((cat) => {
          const isActive = filterType === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`flex-none px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                isActive
                  ? 'bg-[#002366] text-white border-[#002366] shadow-xs'
                  : 'bg-[#f8f9ff] text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {filteredNotices.map((notice) => {
          const isNew = notice.isNew && !viewedIds.has(notice.id);
          const isProf = notice.authorRole && notice.authorRole !== 'Administration';
          const displayName = isProf ? notice.authorName : 'Administration';

          return (
            <div
              key={notice.id}
              className="bg-white rounded-[24px] p-5 shadow-card flex flex-col gap-3 border border-slate-100/80 hover:shadow-md transition-all relative"
            >
              {isNew && (
                <span className="absolute top-3 right-4 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                  Nouveau
                </span>
              )}

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar name={displayName} size="md" />
                  <div>
                    <p className="text-sm font-bold text-[#0b1c30]">{displayName}</p>
                    <p className="text-[11px] text-[#757682]">{notice.date}</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${notice.badgeBg} ${notice.badgeTextColor}`}>
                  {notice.type}
                </span>
              </div>

              <p className="text-xs text-[#444650] leading-relaxed pt-1">
                {notice.content}
              </p>

              {isProf && notice.authorRole && (
                <p className="text-[10px] text-[#757682] font-medium">
                  {notice.authorRole}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
