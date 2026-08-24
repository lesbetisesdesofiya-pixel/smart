import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { CheckCircle, Clock, BookOpen } from 'lucide-react';

interface HeroCardProps {
  parentName: string;
  childName: string;
  present: boolean;
  prochainCours: { matiere: string; heure: string } | null;
}

export const HeroCard: React.FC<HeroCardProps> = ({ parentName, childName, present, prochainCours }) => (
  <Card variant="hero" className="p-6" delay={0}>
    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full" />
    <div className="absolute -left-8 -top-8 w-28 h-28 bg-[#375ca6]/20 rounded-full" />

    <div className="relative z-10">
      <p className="text-sm text-blue-200 mb-1">Bonjour,</p>
      <h2 className="text-2xl font-extrabold mb-4">{parentName}</h2>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          present ? 'bg-emerald-500/20 border border-emerald-400/20' : 'bg-rose-500/20 border border-rose-400/20'
        }`}>
          {present
            ? <CheckCircle className="w-5 h-5 text-emerald-300" />
            : <Clock className="w-5 h-5 text-rose-300" />
          }
        </div>
        <div>
          <p className="text-sm font-bold">{childName}</p>
          <p className="text-xs text-blue-200/80">
            {present ? 'Présent(e) aujourd\'hui' : 'Absent(e) aujourd\'hui'}
          </p>
        </div>
      </div>

      {prochainCours && (
        <div className="flex items-center gap-2 mt-3 text-xs text-blue-200/70">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Prochain cours : {prochainCours.matiere} à {prochainCours.heure}</span>
        </div>
      )}
    </div>
  </Card>
);
