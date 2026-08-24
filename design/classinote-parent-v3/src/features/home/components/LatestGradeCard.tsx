import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LatestGradeCardProps {
  matiere: string;
  titre: string;
  note: number;
  sur: number;
  appreciation?: string;
  tendance?: number[];
  onClick?: () => void;
}

export const LatestGradeCard: React.FC<LatestGradeCardProps> = ({ matiere, titre, note, sur, appreciation, tendance, onClick }) => {
  const pct = (note / sur) * 100;
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const TrendIcon = pct >= 75 ? TrendingUp : pct >= 50 ? Minus : TrendingDown;

  return (
    <Card delay={0.1} onClick={onClick} style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{matiere}</p>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '2px' }}>{titre}</p>
        </div>
        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendIcon style={{ width: '16px', height: '16px', color }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span style={{ fontSize: '42px', fontWeight: 800, color }}>{note}</span>
          <span style={{ fontSize: '16px', color: '#d1d5db', fontWeight: 700 }}>/{sur}</span>
        </div>
      </div>
      {appreciation && <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px', fontStyle: 'italic' }}>"{appreciation}"</p>}
    </Card>
  );
};
