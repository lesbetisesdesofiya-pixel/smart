import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { GraduationCap, CalendarDays, MessageCircle, CreditCard, ChevronRight } from 'lucide-react';

interface ActionCardsProps {
  onNavigate: (tab: string) => void;
  resume: { absences_mois: number; examens_a_venir: number; messages_non_lus: number; montant_du: number };
}

const actions = [
  { id: 'notes', label: 'Notes', desc: 'Résultats et graphiques', Icon: GraduationCap, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadow: '0 4px 12px rgba(59,130,246,0.3)' },
  { id: 'examens', label: 'Examens', desc: 'Évaluations à venir', Icon: CalendarDays, gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)', shadow: '0 4px 12px rgba(244,63,94,0.3)' },
  { id: 'messages', label: 'Messages', desc: "Discuter avec l'école", Icon: MessageCircle, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', shadow: '0 4px 12px rgba(99,102,241,0.3)' },
  { id: 'paiements', label: 'Paiements', desc: 'Scolarité et frais', Icon: CreditCard, gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: '0 4px 12px rgba(16,185,129,0.3)' },
];

export const ActionCards: React.FC<ActionCardsProps> = ({ onNavigate, resume }) => {
  const badges: Record<string, number> = { examens: resume.examens_a_venir, messages: resume.messages_non_lus };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {actions.map((action, i) => (
        <Card key={action.id} delay={0.2 + i * 0.05} onClick={() => onNavigate(action.id)} style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: action.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: action.shadow, flexShrink: 0, position: 'relative' }}>
              <action.Icon size={24} color="#ffffff" />
              {badges[action.id] > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', minWidth: '20px', height: '20px', padding: '0 6px', background: '#f43f5e', color: '#ffffff', fontSize: '10px', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badges[action.id]}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{action.label}</p>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>{action.desc}</p>
            </div>
            <ChevronRight size={20} color="#d1d5db" />
          </div>
        </Card>
      ))}
    </div>
  );
};
