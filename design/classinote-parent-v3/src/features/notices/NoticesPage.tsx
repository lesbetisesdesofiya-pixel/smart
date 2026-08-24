import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { SkeletonList } from '@/shared/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback';
import { MessageSquare, Award, AlertTriangle, Info } from 'lucide-react';
import { useChildrenStore } from '@/shared/stores/stores';
import { formatRelative } from '@/shared/utils/format';

const typeConfig: Record<string, { icon: any; color: string; badge: 'emerald' | 'amber' | 'blue' }> = {
  'Felicitations': { icon: Award, color: 'text-emerald-600', badge: 'emerald' },
  'Attention': { icon: AlertTriangle, color: 'text-amber-600', badge: 'amber' },
  'Information': { icon: Info, color: 'text-blue-600', badge: 'blue' },
};

export const NoticesPage: React.FC = () => {
  const { activeChildId } = useChildrenStore();
  const [filter, setFilter] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['parent-notices', activeChildId],
    queryFn: async () => {
      const res = await apiFetch('/parent/remarques');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading) return <div className="px-5 pb-28 max-w-lg mx-auto pt-4"><SkeletonList /></div>;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  const notices = Array.isArray(data) ? data : [];
  const types = [...new Set(notices.map((n: any) => n.type).filter(Boolean))];

  const filtered = filter ? notices.filter((n: any) => n.type === filter) : notices;

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-4 pt-4">
      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilter(null)}
          className={`shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            !filter ? 'bg-navy-800 text-white' : 'bg-white text-gray-500 border border-gray-100'
          }`}
        >
          Tous
        </button>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              filter === t ? 'bg-navy-800 text-white' : 'bg-white text-gray-500 border border-gray-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="Aucun avis" />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((notice: any, i: number) => {
            const config = typeConfig[notice.type] || typeConfig['Information'];
            const Icon = config.icon;
            return (
              <Card key={notice.id || i} className="p-4" delay={0.05 + i * 0.03}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-900">{notice.prof ? `${notice.prof.prenom} ${notice.prof.nom}` : 'Professeur'}</p>
                      <Badge color={config.badge}>{notice.type || 'Info'}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{notice.contenu}</p>
                    <p className="text-xs text-gray-300 mt-2">{notice.created_at ? formatRelative(notice.created_at) : ''}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
