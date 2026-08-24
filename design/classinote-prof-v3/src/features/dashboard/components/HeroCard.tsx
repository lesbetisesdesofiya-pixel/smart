import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { Sparkline } from '@/shared/components/ui/Sparkline';
import { GraduationCap, BookOpen, FileText, TrendingUp } from 'lucide-react';

interface HeroCardProps {
  teacherName: string;
  subjects: string[];
  stats: {
    nb_classes: number;
    nb_matieres: number;
    nb_evaluations: number;
    taux_saisie: number;
  };
}

export const HeroCard: React.FC<HeroCardProps> = ({ teacherName, subjects, stats }) => (
  <Card variant="hero" className="p-6" delay={0}>
    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full" />
    <div className="absolute -left-8 -top-8 w-28 h-28 bg-[#375ca6]/20 rounded-full" />

    <div className="relative z-10">
      <p className="text-sm text-blue-200 mb-1">Bonjour,</p>
      <h2 className="text-2xl lg:text-3xl font-extrabold mb-3">{teacherName}</h2>

      <div className="flex gap-2 flex-wrap mb-5">
        {subjects.map((sub, i) => (
          <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-blue-100 border border-white/10">
            {sub}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatItem icon={<GraduationCap className="w-4 h-4" />} value={stats.nb_classes} label="Classes" />
        <StatItem icon={<BookOpen className="w-4 h-4" />} value={stats.nb_matieres} label="Matières" />
        <StatItem icon={<FileText className="w-4 h-4" />} value={stats.nb_evaluations} label="Évaluations" />
        <StatItem icon={<TrendingUp className="w-4 h-4" />} value={`${stats.taux_saisie}%`} label="Saisies" />
      </div>
    </div>
  </Card>
);

const StatItem = ({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) => (
  <div className="text-center">
    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-1.5 text-blue-200">
      {icon}
    </div>
    <p className="text-lg font-extrabold">{value}</p>
    <p className="text-[10px] text-blue-200/70">{label}</p>
  </div>
);
