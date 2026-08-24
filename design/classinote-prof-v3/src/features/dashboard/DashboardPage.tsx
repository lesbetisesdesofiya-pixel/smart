import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, fetchSchools } from '@/shared/api/client';
import { SkeletonCard } from '@/shared/components/ui/Skeleton';
import { ErrorState } from '@/shared/components/ui/Feedback';
import { HeroCard } from './components/HeroCard';
import { TodaySchedule } from './components/TodaySchedule';
import { ClassAverageChart } from './components/ClassAverageChart';
import { QuickActions } from './components/QuickActions';
import { ClassesList } from './components/ClassesList';
import { RecentEvaluations } from './components/RecentEvaluations';
import type { DashboardData } from '@/shared/types';

interface DashboardPageProps {
  onNavigate: (screen: string) => void;
  onSelectClass: (id: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onSelectClass }) => {
  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 lg:p-8 pb-24">
        <div className="h-48 rounded-2xl animate-shimmer" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState title="Impossible de charger le tableau de bord" onRetry={() => refetch()} />;
  }

  const evaluations = (data.evaluations || []).map((e: any) => ({
    ...e,
    notes_saisies: e.notes_count || 0,
    total_eleves: e.classe?.eleves_count || 30,
  }));

  return (
    <div className="p-4 lg:p-8 pb-24 space-y-4">
      <HeroCard
        teacherName={data.prof?.nom_complet || 'Professeur'}
        subjects={(data.matieres || []).map((m: any) => m.libelle)}
        stats={data.stats || { nb_classes: 0, nb_matieres: 0, nb_evaluations: 0, taux_saisie: 0 }}
      />

      <TodaySchedule items={data.emploi_du_jour || []} />

      <ClassAverageChart data={data.stats?.moyennes_par_classe || []} />

      <QuickActions onNavigate={onNavigate} />

      <ClassesList classes={data.classes || []} onSelectClass={onSelectClass} />

      <RecentEvaluations evaluations={evaluations} onNavigate={onNavigate} />
    </div>
  );
};
