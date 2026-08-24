import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { SkeletonList } from '@/shared/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback';
import { CalendarDays, Clock, X } from 'lucide-react';
import { useChildrenStore } from '@/shared/stores/stores';

export const ExamsPage: React.FC = () => {
  const { activeChildId } = useChildrenStore();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [detail, setDetail] = useState<any>(null);

  const { data: exams, isLoading, error, refetch } = useQuery({
    queryKey: ['parent-exams', activeChildId],
    queryFn: async () => {
      const res = await apiFetch('/parent/evaluations');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading) return <div className="px-5 pb-28 max-w-lg mx-auto pt-4"><SkeletonList /></div>;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  const examsList = Array.isArray(exams) ? exams : [];
  const now = new Date();

  const filtered = examsList.filter((e: any) => {
    if (filter === 'upcoming') return new Date(e.date) >= now;
    if (filter === 'past') return new Date(e.date) < now;
    return true;
  });

  const upcoming = examsList.filter((e: any) => new Date(e.date) >= now).length;

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-4 pt-4">
      {/* Stats */}
      <Card variant="highlight" className="p-5" delay={0}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center">
            <CalendarDays className="w-7 h-7 text-rose-600" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-gray-900">{upcoming}</p>
            <p className="text-sm text-gray-400">examen{upcoming > 1 ? 's' : ''} à venir</p>
          </div>
        </div>
      </Card>

      {/* Filtres */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'Tous' },
          { id: 'upcoming', label: 'À venir' },
          { id: 'past', label: 'Passés' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              filter === f.id ? 'bg-navy-800 text-white' : 'bg-white text-gray-500 border border-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-8 h-8" />} title="Aucun examen" />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((exam: any, i: number) => {
            const isFuture = new Date(exam.date) >= now;
            return (
              <Card key={exam.id} className="p-4" delay={0.05 + i * 0.03} onClick={() => setDetail(exam)}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink- ${
                    isFuture ? 'bg-rose-50' : 'bg-gray-50'
                  }`}>
                    <span className="text-xs font-bold text-gray-400">{new Date(exam.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                    <span className={`text-lg font-extrabold ${isFuture ? 'text-rose-600' : 'text-gray-500'}`}>{new Date(exam.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{exam.titre}</p>
                    <p className="text-xs text-gray-400">{exam.matiere?.libelle} · Coeff. {exam.coefficient}</p>
                  </div>
                  <Badge color={isFuture ? 'rose' : 'gray'}>{isFuture ? 'À venir' : 'Passé'}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-extrabold text-gray-900">{detail.titre}</p>
                <p className="text-sm text-gray-400">{detail.matiere?.libelle}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-2xl p-3"><p className="text-xs text-gray-400">Date</p><p className="text-sm font-extrabold">{new Date(detail.date).toLocaleDateString('fr-FR')}</p></div>
              <div className="bg-gray-50 rounded-2xl p-3"><p className="text-xs text-gray-400">Coefficient</p><p className="text-sm font-extrabold">{detail.coefficient}</p></div>
              <div className="bg-gray-50 rounded-2xl p-3"><p className="text-xs text-gray-400">Barème</p><p className="text-sm font-extrabold">/{detail.note_sur || 20}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
