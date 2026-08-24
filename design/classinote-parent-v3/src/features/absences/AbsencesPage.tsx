import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useDashboard } from '@/shared/stores/stores';

export const AbsencesPage: React.FC = () => {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <div style={{ padding: '20px', maxWidth: '512px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>{[1,2,3].map(i => <div key={i} className="animate-shimmer" style={{ height: '60px', borderRadius: '24px' }} />)}</div>;

  const absences = data?.absences || [];

  return (
    <div style={{ padding: '20px', paddingBottom: '120px', maxWidth: '512px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>Absences</h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>{absences.length} absence{absences.length > 1 ? 's' : ''} au total</p>
      </div>

      {absences.length === 0 ? (
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Aucune absence</p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Votre enfant est assidu</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {absences.map((a: any, i: number) => (
            <Card key={a.id || i} style={{ padding: '16px' }} delay={0.05 + i * 0.03}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: a.justifie ? '#ecfdf5' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {a.justifie ? <CheckCircle size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    {a.date ? new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Date inconnue'}
                  </p>
                  {a.matiere && <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{a.matiere}</p>}
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: a.justifie ? '#ecfdf5' : '#fef2f2', color: a.justifie ? '#10b981' : '#ef4444' }}>
                  {a.justifie ? 'Justifiée' : 'Non justifiée'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
