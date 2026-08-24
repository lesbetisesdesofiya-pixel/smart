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
  const color = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600';
  const TrendIcon = pct >= 75 ? TrendingUp : pct >= 50 ? Minus : TrendingDown;

  return (
    <Card variant="highlight" className="p-5" delay={0.1} onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{matiere}</p>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">{titre}</p>
        </div>
        <div className={`flex items-center gap-1 ${color}`}>
          <TrendIcon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className={`text-4xl font-extrabold ${color}`}>{note}</span>
          <span className="text-sm text-gray-300 font-bold">/{sur}</span>
        </div>
        {tendance && tendance.length > 1 && (
          <Sparkline data={tendance} color={pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'} height={28} className="w-20" />
        )}
      </div>

      {appreciation && (
        <p className="text-xs text-gray-500 mt-2 italic">"{appreciation}"</p>
      )}
    </Card>
  );
};
