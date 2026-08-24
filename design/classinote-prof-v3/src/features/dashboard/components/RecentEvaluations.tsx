import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { formatDate } from '@/shared/utils/format';
import type { Evaluation } from '@/shared/types';

interface RecentEvaluationsProps {
  evaluations: Evaluation[];
  onNavigate: (screen: string) => void;
}

export const RecentEvaluations: React.FC<RecentEvaluationsProps> = ({ evaluations, onNavigate }) => {
  if (evaluations.length === 0) return null;

  return (
    <Card className="p-5" delay={0.4}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">Évaluations récentes</h3>
        <button
          onClick={() => onNavigate('evaluations')}
          className="text-xs font-medium text-navy-600 hover:text-navy-800 transition-colors cursor-pointer"
        >
          Voir tout
        </button>
      </div>

      <div className="space-y-2">
        {evaluations.slice(0, 5).map((ev) => (
          <button
            key={ev.id}
            onClick={() => onNavigate('evaluations')}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all active:scale-[0.99] cursor-pointer text-left"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              ev.has_notes
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-amber-100 text-amber-600'
            }`}>
              {ev.has_notes ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{ev.titre}</p>
              <p className="text-[11px] text-gray-400">
                {ev.classe?.libelle} · {ev.matiere?.libelle} · Coeff. {ev.coefficient}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400">{formatDate(ev.date)}</p>
              <Badge color={ev.has_notes ? 'emerald' : 'amber'} className="mt-1">
                {ev.has_notes ? 'Noté' : 'À saisir'}
              </Badge>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
};
