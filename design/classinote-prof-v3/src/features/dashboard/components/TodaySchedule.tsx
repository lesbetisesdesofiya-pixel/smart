import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Clock, MapPin } from 'lucide-react';
import type { EmploiItem } from '@/shared/types';

interface TodayScheduleProps {
  items: EmploiItem[];
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <Card className="p-5" delay={0.1}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
          <Clock className="w-4 h-4 text-violet-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Aujourd'hui</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {items.map((item, i) => (
          <div
            key={i}
            className="shrink-0 w-28 p-3 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100"
          >
            <p className="text-xs font-bold text-violet-700">{item.heure}</p>
            <p className="text-sm font-extrabold text-gray-900 mt-1 truncate">{item.matiere}</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <p className="text-[11px] text-gray-400 truncate">{item.classe}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
