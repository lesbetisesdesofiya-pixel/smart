import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '@/shared/api/client';
import { SkeletonList } from '@/shared/components/ui/Skeleton';
import { ErrorState } from '@/shared/components/ui/Feedback';
import { HeroCard, ChildSelector } from './components/HeroCard';
import { LatestGradeCard } from './components/LatestGradeCard';
import { SummaryRow } from './components/SummaryRow';
import { ActionCards } from './components/ActionCards';
import { LatestNotice } from './components/LatestNotice';
import { useChildrenStore } from '@/shared/stores/stores';
import type { DashboardData } from '@/shared/types';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onLogout }) => {
  const { activeChildId, setActiveChild } = useChildrenStore();

  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['parent-dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) return <div className="px-5 pb-28 max-w-lg mx-auto space-y-4 pt-4"><SkeletonList /></div>;
  if (error || !data) return <ErrorState title="Impossible de charger les données" onRetry={() => refetch()} />;

  const enfants = data.enfants || [];
  const currentId = activeChildId || enfants[0]?.id;
  const actif = data.actif || {};
  const resume = data.resume || { absences_mois: 0, examens_a_venir: 0, messages_non_lus: 0, montant_du: 0, montant_paye: 0 };

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-4 pt-4">
      <ChildSelector
        enfants={enfants.map((e: any) => ({ id: e.id, nom: e.nom_complet || `${e.prenom} ${e.nom}`, classe: e.classe?.libelle || '' }))}
        activeId={currentId}
        onSelect={setActiveChild}
      />

      <HeroCard
        parentName={data.parent?.nom_complet || 'Parent'}
        childName={actif.nom || 'Enfant'}
        present={actif.present_aujourd_hui ?? true}
        prochainCours={actif.prochain_cours}
      />

      {data.derniere_note && (
        <LatestGradeCard
          matiere={data.derniere_note.matiere}
          titre={data.derniere_note.titre}
          note={data.derniere_note.note}
          sur={data.derniere_note.sur}
          appreciation={data.derniere_note.appreciation}
          tendance={data.derniere_note.tendance}
          onClick={() => onNavigate('notes')}
        />
      )}

      <SummaryRow
        absences={resume.absences_mois}
        examens={resume.examens_a_venir}
        messages={resume.messages_non_lus}
        montantDu={resume.montant_du}
      />

      <ActionCards onNavigate={onNavigate} resume={resume} />

      {data.dernier_avis && (
        <LatestNotice
          auteur={data.dernier_avis.auteur}
          contenu={data.dernier_avis.contenu}
          date={data.dernier_avis.date}
          onClick={() => onNavigate('avis')}
        />
      )}
    </div>
  );
};
