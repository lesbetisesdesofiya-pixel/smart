import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/Feedback';
import { useDashboard } from '@/shared/stores/stores';
import { MessageSquare, Award, AlertTriangle, Info } from 'lucide-react';

const typeConfig: Record<string, { icon: any; color: string; badge: 'emerald' | 'amber' | 'blue' }> = {
  'Felicitations': { icon: Award, color: 'text-emerald-600', badge: 'emerald' },
  'Attention': { icon: AlertTriangle, color: 'text-amber-600', badge: 'amber' },
  'Information': { icon: Info, color: 'text-blue-600', badge: 'blue' },
};

export const NoticesPage: React.FC = () => {
  const { data, isLoading } = useDashboard();
  const [filter, setFilter] = useState<string | null>(null);

  if (isLoading || !data) return <div className="px-5 pb-28 max-w-lg mx-auto pt-4"><div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-3xl p-5 animate-shimmer h-20" />)}</div></div>;

  const remarques = data.remarques || [];
  const types = [...new Set(remarques.map((r: any) => r.type).filter(Boolean))];
  const filtered = filter ? remarques.filter((r: any) => r.type === filter) : remarques;

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-4 pt-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button onClick={() => setFilter(null)} className={`shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${!filter ? 'bg-navy-800 text-white' : 'bg-white text-gray-500 border border-gray-100'}`}>Tous</button>
        {types.map((t) => <button key={t} onClick={() => setFilter(t)} className={`shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${filter === t ? 'bg-navy-800 text-white' : 'bg-white text-gray-500 border border-gray-100'}`}>{t}</button>)}
      </div>

      {filtered.length === 0 ? <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="Aucun avis" /> : (
        <div className="space-y-2.5">
          {filtered.map((remarque: any, i: number) => {
            const config = typeConfig[remarque.type] || typeConfig['Information'];
            const Icon = config.icon;
            const profNom = remarque.prof ? `${remarque.prof.prenom} ${remarque.prof.nom}` : 'Professeur';
            return (
              <Card key={remarque.id || i} className="p-4" delay={0.05 + i * 0.03}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-900">{profNom}</p>
                      <Badge color={config.badge}>{remarque.type || 'Info'}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{remarque.contenu}</p>
                    <p className="text-xs text-gray-300 mt-2">{remarque.created_at || remarque.date || ''}</p>
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
