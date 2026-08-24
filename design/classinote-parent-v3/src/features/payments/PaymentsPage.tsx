import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import { useDashboard } from '@/shared/stores/stores';

const ProgressRing: React.FC<{ paid: number; total: number }> = ({ paid, total }) => {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? (paid / total) * 100 : 0;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
      <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'all 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <span style={{ fontSize: '20px', fontWeight: 800 }}>{Math.round(progress)}%</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>payé</span>
      </div>
    </div>
  );
};

const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

export const PaymentsPage: React.FC = () => {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <div style={{ padding: '20px', maxWidth: '512px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>{[1,2,3].map(i => <div key={i} className="animate-shimmer" style={{ height: '80px', borderRadius: '24px' }} />)}</div>;

  const paiements = data?.paiements || [];
  const total = paiements.reduce((s: number, p: any) => s + (p.montant || 0), 0);
  const paid = paiements.filter((p: any) => p.statut === 'paye').reduce((s: number, p: any) => s + (p.montant || 0), 0);
  const remaining = Math.max(0, total - paid);

  return (
    <div style={{ padding: '20px', paddingBottom: '120px', maxWidth: '512px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Hero card */}
      <Card variant="hero" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'rgba(191,219,254,0.7)', marginBottom: '4px' }}>Solde payé</p>
            <p style={{ fontSize: '28px', fontWeight: 800 }}>{formatFCFA(paid)}</p>
            <p style={{ fontSize: '12px', color: 'rgba(191,219,254,0.5)', marginTop: '4px' }}>Reste : {formatFCFA(remaining)}</p>
          </div>
          <ProgressRing paid={paid} total={total} />
        </div>
      </Card>

      {/* Liste */}
      {paiements.length === 0 ? (
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <CreditCard size={48} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Aucun paiement</p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Aucun paiement enregistré</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paiements.map((p: any, i: number) => {
            const isPaid = p.statut === 'paye';
            return (
              <Card key={p.id || i} style={{ padding: '16px' }} delay={0.05 + i * 0.03}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isPaid ? '#ecfdf5' : '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isPaid ? <CheckCircle size={18} color="#10b981" /> : <Clock size={18} color="#f97316" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{p.libelle || 'Frais'}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>{p.date ? new Date(p.date).toLocaleDateString('fr-FR') : ''}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{formatFCFA(p.montant || 0)}</p>
                    <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: isPaid ? '#ecfdf5' : '#fff7ed', color: isPaid ? '#10b981' : '#f97316' }}>
                      {isPaid ? 'Payé' : 'En attente'}
                    </span>
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
