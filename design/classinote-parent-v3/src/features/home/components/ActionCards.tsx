import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { GraduationCap, CalendarDays, MessageCircle, CreditCard, ChevronRight } from 'lucide-react';

interface ActionCardsProps {
  onNavigate: (tab: string) => void;
  resume: {
    absences_mois: number;
    examens_a_venir: number;
    messages_non_lus: number;
    montant_du: number;
  };
}

const actions = [
  { id: 'notes', label: 'Notes', desc: 'Résultats et graphiques', icon: GraduationCap, gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200/50' },
  { id: 'examens', label: 'Examens', desc: 'Évaluations à venir', icon: CalendarDays, gradient: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-200/50' },
  { id: 'messages', label: 'Messages', desc: 'Discuter avec l\'école', icon: MessageCircle, gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-200/50' },
  { id: 'paiements', label: 'Paiements', desc: 'Scolarité et frais', icon: CreditCard, gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-200/50' },
];

export const ActionCards: React.FC<ActionCardsProps> = ({ onNavigate, resume }) => {
  const badges: Record<string, number> = {
    examens: resume.examens_a_venir,
    messages: resume.messages_non_lus,
  };

  return (
    <div className="space-y-3">
      {actions.map((action, i) => (
        <Card key={action.id} className="p-5" delay={0.2 + i * 0.05} onClick={() => onNavigate(action.id)}>
          <div className="flex items-center gap-4">
            <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0 shadow-lg ${action.shadow}`}>
              <action.icon className="w-6 h-6 text-white" />
              {badges[action.id] > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {badges[action.id]}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-gray-900">{action.label}</p>
              <p className="text-sm text-gray-400">{action.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
        </Card>
      ))}
    </div>
  );
};
