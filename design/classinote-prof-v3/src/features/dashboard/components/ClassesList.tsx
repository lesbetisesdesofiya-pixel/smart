import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Users, ChevronRight } from 'lucide-react';
import { getInitials } from '@/shared/utils/format';
import type { Classe } from '@/shared/types';

interface ClassesListProps {
  classes: Classe[];
  onSelectClass: (id: number) => void;
}

const colors = [
  'from-blue-600 to-blue-400',
  'from-violet-600 to-violet-400',
  'from-emerald-600 to-emerald-400',
  'from-amber-600 to-amber-400',
  'from-rose-600 to-rose-400',
  'from-teal-600 to-teal-400',
];

export const ClassesList: React.FC<ClassesListProps> = ({ classes, onSelectClass }) => {
  if (classes.length === 0) return null;

  return (
    <Card className="p-5" delay={0.35}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Users className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Mes classes</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {classes.map((classe, i) => (
          <button
            key={classe.id}
            onClick={() => onSelectClass(classe.id)}
            className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all active:scale-[0.99] cursor-pointer text-left"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
              {classe.libelle.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{classe.libelle}</p>
              {classe.eleves_count !== undefined && (
                <p className="text-[11px] text-gray-400">{classe.eleves_count} élèves</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-navy-600 transition-colors" />
          </button>
        ))}
      </div>
    </Card>
  );
};
