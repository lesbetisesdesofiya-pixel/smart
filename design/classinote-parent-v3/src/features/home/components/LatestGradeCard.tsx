import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Sparkline } from '@/shared/components/ui/Sparkline';
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

export const LatestGradeCard: React.FC<LatestGradeCardProps> = ({
  matiere, titre, note, sur, appreciation, tendance, onClick,
}) => {
  const pct = (note / sur) * 100;
  const color = pct >= 75 ? 'emerald' : pct >= 50 ? 'amber' : 'rose';
  const TrendIcon = pct >= 75 ? TrendingUp : pct >= 50 ? Minus : TrendingDown;

  const colors = {
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', spark: '#10b981' },
    amber: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', spark: '#f59e0b' },
    rose: { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', spark: '#ef4444' },
  };

  const c = colors[color];

  return (
    <Card className="p-5" delay={0.1} onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>{matiere}</p>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">{titre}</p>
        </div>
        <div className={`w-9 h-9 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`}>
          <TrendIcon className={`w-4 h-4 ${c.text}`} />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className={`text-5xl font-extrabold ${c.text}`}>{note}</span>
          <span className="text-lg text-gray-300 font-bold">/{sur}</span>
        </div>
        {tendance && tendance.length > 1 && (
          <Sparkline data={tendance} color={c.spark} height={32} className="w-24" />
        )}
      </div>

      {appreciation && (
        <p className="text-xs text-gray-400 mt-3 italic">"{appreciation}"</p>
      )}
    </Card>
  );
};
