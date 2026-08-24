import React from 'react';
import { Card } from '@/shared/components/ui/Card';

interface SummaryRowProps {
  absences: number;
  examens: number;
  messages: number;
  montantDu: number;
}

const items = [
  { key: 'absences', label: 'Absences', color: '#f97316', bg: '#fff7ed' },
  { key: 'examens', label: 'Examens', color: '#ef4444', bg: '#fef2f2' },
  { key: 'messages', label: 'Messages', color: '#6366f1', bg: '#eef2ff' },
  { key: 'paiements', label: 'À payer', color: '#10b981', bg: '#ecfdf5' },
];

export const SummaryRow: React.FC<SummaryRowProps> = ({ absences, examens, messages, montantDu }) => {
  const values: Record<string, string> = {
    absences: `${absences}`,
    examens: `${examens}`,
    messages: `${messages}`,
    paiements: montantDu > 0 ? `${(montantDu / 1000).toFixed(0)}k` : '0',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
      {items.map((item, i) => (
        <Card key={item.key} delay={0.15 + i * 0.05} style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: item.color, opacity: 0.6 }} />
          </div>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{values[item.key]}</p>
          <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500, marginTop: '2px' }}>{item.label}</p>
        </Card>
      ))}
    </div>
  );
};
