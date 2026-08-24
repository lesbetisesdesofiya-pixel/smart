import { Card } from '@/shared/components/ui/Card';
import { useDashboard, useChildrenStore } from '@/shared/stores/stores';
import { HeroCard, ChildSelector } from './components/HeroCard';
import { LatestGradeCard } from './components/LatestGradeCard';
import { SummaryRow } from './components/SummaryRow';
import { ActionCards } from './components/ActionCards';
import { LatestNotice } from './components/LatestNotice';
import { CalendarDays, AlertTriangle, Clock } from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onLogout }) => {
  const { data, isLoading, error, refetch } = useDashboard();
  const { setActiveChild } = useChildrenStore();

  if (isLoading) return <div style={{ padding: '20px', paddingBottom: '120px', maxWidth: '512px', margin: '0 auto' }}><div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{[1,2,3,4].map(i => <div key={i} className="animate-shimmer" style={{ height: '80px', borderRadius: '24px' }} />)}</div></div>;
  if (error || !data) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>Impossible de charger les données <button onClick={() => refetch()} style={{ marginLeft: '8px', color: '#002366', fontWeight: 700, cursor: 'pointer', border: 'none', background: 'none' }}>Réessayer</button></div>;

  const enfants = data.enfants || [];
  const actif = data.actif || {};
  const resume = data.resume || { absences_mois: 0, examens_a_venir: 0, messages_non_lus: 0, montant_du: 0, montant_paye: 0 };
  const emploi = data.emploi || [];
  const remarques = data.remarques || [];

  return (
    <div style={{ padding: '16px 20px', paddingBottom: '120px', maxWidth: '512px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ChildSelector
        enfants={enfants.map((e: any) => ({ id: e.id, nom: e.nom_complet || `${e.prenom} ${e.nom}`, classe: e.classe?.libelle || '' }))}
        activeId={actif.id}
        onSelect={(id) => { setActiveChild(id); }}
      />

      <HeroCard parentName={data.parent?.nom_complet || 'Parent'} childName={actif.nom || 'Enfant'} present={actif.present_aujourd_hui ?? true} prochainCours={actif.prochain_cours} />

      {data.derniere_note && (
        <LatestGradeCard matiere={data.derniere_note.matiere} titre={data.derniere_note.titre} note={data.derniere_note.note} sur={data.derniere_note.sur} appreciation={data.derniere_note.appreciation} tendance={data.derniere_note.tendance} onClick={() => onNavigate('notes')} />
      )}

      <SummaryRow absences={resume.absences_mois} examens={resume.examens_a_venir} messages={resume.messages_non_lus} montantDu={resume.montant_du} />

      <ActionCards onNavigate={onNavigate} resume={resume} />

      {data.dernier_avis && <LatestNotice auteur={data.dernier_avis.auteur} contenu={data.dernier_avis.contenu} date={data.dernier_avis.date} onClick={() => onNavigate('avis')} />}

      {/* Absences */}
      {resume.absences_mois > 0 && (
        <Card delay={0.4} onClick={() => onNavigate('absences')} style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={18} color="#f97316" /></div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>Absences</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>{resume.absences_mois} absence{resume.absences_mois > 1 ? 's' : ''} ce mois</p>
            </div>
          </div>
          {data.absences && data.absences.slice(0, 3).map((a: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
              <p style={{ fontSize: '13px', color: '#374151' }}>{a.date ? new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}</p>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', background: a.justifie ? '#ecfdf5' : '#fef2f2', color: a.justifie ? '#10b981' : '#ef4444', fontWeight: 700 }}>{a.justifie ? 'Justifiée' : 'Non justifiée'}</span>
            </div>
          ))}
          {resume.absences_mois > 3 && <p style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600, marginTop: '8px', textAlign: 'center' }}>Voir toutes les absences</p>}
        </Card>
      )}

      {/* Emploi du temps */}
      <Card delay={0.45} onClick={() => onNavigate('schedule')} style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CalendarDays size={18} color="#9333ea" /></div>
          <div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>Emploi du temps</p>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>{emploi.length > 0 ? `${emploi.length} cours aujourd'hui` : 'Aucun cours'}</p>
          </div>
        </div>
        {emploi.length > 0 ? (
          <>
            {emploi.slice(0, 3).map((c: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Clock size={16} color="#9333ea" /></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{c.matiere}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>{c.heure || c.debut}{c.salle ? ` · ${c.salle}` : ''}</p>
                </div>
              </div>
            ))}
            {emploi.length > 3 && <p style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600, marginTop: '8px', textAlign: 'center' }}>+{emploi.length - 3} autres cours</p>}
          </>
        ) : (
          <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>Pas de cours programmé aujourd'hui</p>
        )}
      </Card>

      {/* Dernières remarques */}
      {remarques.length > 0 && (
        <Card delay={0.5} onClick={() => onNavigate('avis')} style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '18px' }}>📋</span></div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>Remarques</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>{remarques.length} observation{remarques.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          {remarques.slice(0, 2).map((r: any, i: number) => (
            <div key={i} style={{ padding: '10px 0', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{r.prof ? `${r.prof.prenom} ${r.prof.nom}` : 'Professeur'}</p>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', background: '#f3f4f6', color: '#6b7280', fontWeight: 600 }}>{r.type || 'Info'}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{r.contenu}</p>
            </div>
          ))}
          {remarques.length > 2 && <p style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600, marginTop: '8px', textAlign: 'center' }}>+{remarques.length - 2} autres remarques</p>}
        </Card>
      )}
    </div>
  );
};
