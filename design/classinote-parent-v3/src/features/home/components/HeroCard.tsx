import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { CheckCircle, Clock, BookOpen, ChevronDown } from 'lucide-react';

interface HeroCardProps {
  parentName: string;
  childName: string;
  present: boolean;
  prochainCours: { matiere: string; heure: string } | null;
}

export const HeroCard: React.FC<HeroCardProps> = ({ parentName, childName, present, prochainCours }) => (
  <Card variant="hero" className="p-6" delay={0}>
    <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-white/5 rounded-full" />
    <div className="absolute -left-10 -top-10 w-32 h-32 bg-[#375ca6]/20 rounded-full" />
    <div className="absolute right-10 top-6 w-16 h-16 bg-white/3 rounded-full" />

    <div className="relative z-10">
      <p className="text-sm text-blue-200/80 mb-1">Bonjour,</p>
      <h2 className="text-3xl font-extrabold mb-5">{parentName}</h2>

      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          present
            ? 'bg-emerald-500/20 border border-emerald-400/30'
            : 'bg-rose-500/20 border border-rose-400/30'
        }`}>
          {present
            ? <CheckCircle className="w-5 h-5 text-emerald-300" />
            : <Clock className="w-5 h-5 text-rose-300" />
          }
        </div>
        <div>
          <p className="text-sm font-bold">{childName}</p>
          <p className="text-xs text-blue-200/70">
            {present ? 'Présent(e) aujourd\'hui' : 'Absent(e) aujourd\'hui'}
          </p>
        </div>
      </div>

      {prochainCours && (
        <div className="flex items-center gap-2 mt-3 text-xs text-blue-200/60">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Prochain : {prochainCours.matiere} à {prochainCours.heure}</span>
        </div>
      )}
    </div>
  </Card>
);

interface ChildSelectorProps {
  enfants: { id: number; nom: string; classe: string }[];
  activeId: number;
  onSelect: (id: number) => void;
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({ enfants, activeId, onSelect }) => {
  if (enfants.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {enfants.map((child) => (
        <button
          key={child.id}
          onClick={() => onSelect(child.id)}
          className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            child.id === activeId
              ? 'bg-[#002366] text-white shadow-lg shadow-navy-800/20'
              : 'bg-white text-navy-600 border border-gray-100 hover:border-navy-200 shadow-sm'
          }`}
        >
          {child.nom.split(' ')[0]}
          {child.classe && <span className="opacity-60 ml-1">({child.classe})</span>}
        </button>
      ))}
    </div>
  );
};
