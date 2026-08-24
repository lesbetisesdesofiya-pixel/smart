import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { Card } from '@/shared/components/ui/Card';
import { SkeletonList } from '@/shared/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/components/ui/Feedback';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';

const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const matiereColors: Record<string, string> = {
  'Mathématiques': 'from-blue-500 to-blue-600',
  'Math': 'from-blue-500 to-blue-600',
  'Français': 'from-rose-500 to-rose-600',
  'Physique': 'from-violet-500 to-violet-600',
  'Chimie': 'from-purple-500 to-purple-600',
  'SVT': 'from-emerald-500 to-emerald-600',
  'Histoire': 'from-amber-500 to-amber-600',
  'Géographie': 'from-orange-500 to-orange-600',
  'Anglais': 'from-teal-500 to-teal-600',
  'EPS': 'from-green-500 to-green-600',
};

const getColor = (matiere: string) => matiereColors[matiere] || 'from-gray-500 to-gray-600';

export const SchedulePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['parent-schedule'],
    queryFn: async () => {
      const res = await apiFetch('/parent/emploi-du-temps');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading) return <div className="px-5 pb-28 max-w-lg mx-auto pt-4"><SkeletonList /></div>;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  const schedule = Array.isArray(data) ? data : [];
  const daySchedule = schedule.filter((s: any) => {
    const day = s.jour || s.day;
    return day === jours[selectedDay] || day === selectedDay;
  }).sort((a: any, b: any) => (a.heure_debut || '').localeCompare(b.heure_debut || ''));

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-4 pt-4">
      {/* Sélecteur jour */}
      <div className="flex gap-2">
        {jours.map((j, i) => (
          <button
            key={j}
            onClick={() => setSelectedDay(i)}
            className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              selectedDay === i ? 'bg-navy-800 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-100'
            }`}
          >
            {j}
          </button>
        ))}
      </div>

      {/* Cours du jour */}
      {daySchedule.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-8 h-8" />} title="Aucun cours" description={`Pas de cours le ${jours[selectedDay]}.`} />
      ) : (
        <div className="space-y-3">
          {daySchedule.map((cours: any, i: number) => (
            <Card key={i} className="p-4" delay={0.05 + i * 0.05}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getColor(cours.matiere || '')} flex flex-col items-center justify-center text-white shrink-0`}>
                  <span className="text-xs font-bold">{cours.heure_debut || ''}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-900">{cours.matiere || 'Cours'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {cours.prof && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <User className="w-3 h-3" /> {cours.prof}
                      </span>
                    )}
                    {cours.salle && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" /> {cours.salle}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{cours.heure_debut} - {cours.heure_fin}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
