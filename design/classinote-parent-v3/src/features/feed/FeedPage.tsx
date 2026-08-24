import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { SkeletonList } from '@/shared/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback';
import { Bell, GraduationCap, CalendarDays, AlertTriangle, CreditCard, MessageCircle } from 'lucide-react';

const typeIcons: Record<string, { icon: any; color: string; bg: string }> = {
  note: { icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
  examen: { icon: CalendarDays, color: 'text-rose-600', bg: 'bg-rose-50' },
  absence: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  paiement: { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  message: { icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  avis: { icon: Bell, color: 'text-violet-600', bg: 'bg-violet-50' },
};

export const FeedPage: React.FC = () => {
  const [filter, setFilter] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['parent-feed'],
    queryFn: async () => {
      const res = await apiFetch('/parent/nouveautes');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading) return <div className="px-5 pb-28 max-w-lg mx-auto pt-4"><SkeletonList /></div>;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  const items = Array.isArray(data) ? data : [];
  const types = [...new Set(items.map((i: any) => i.type).filter(Boolean))];

  const filtered = filter ? items.filter((i: any) => i.type === filter) : items;

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
        {types.map((t) => {
          const config = typeIcons[t] || typeIcons['avis'];
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                filter === t ? 'bg-navy-800 text-white' : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8" />} title="Aucune nouveauté" />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item: any, i: number) => {
            const config = typeIcons[item.type] || typeIcons['avis'];
            const Icon = config.icon;
            return (
              <Card key={item.id || i} className="p-4" delay={0.05 + i * 0.03}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{item.titre || item.type}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.contenu || item.description}</p>
                    <p className="text-[10px] text-gray-300 mt-1">{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : ''}</p>
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
