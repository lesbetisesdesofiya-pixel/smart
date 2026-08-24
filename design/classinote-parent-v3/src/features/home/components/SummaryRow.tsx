import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { AlertTriangle, CalendarDays, MessageCircle, CreditCard } from 'lucide-react';

interface SummaryRowProps {
  absences: number;
  examens: number;
  messages: number;
  montantDu: number;
}

const items = [
  { key: 'absences', label: 'Absences', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'examens', label: 'Examens', icon: CalendarDays, color: 'text-rose-500', bg: 'bg-rose-50' },
  { key: 'messages', label: 'Messages', icon: MessageCircle, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { key: 'paiements', label: 'À payer', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

export const SummaryRow: React.FC<SummaryRowProps> = ({ absences, examens, messages, montantDu }) => {
  const values: Record<string, string> = {
    absences: `${absences}`,
    examens: `${examens}`,
    messages: `${messages}`,
    paiements: montantDu > 0 ? `${(montantDu / 1000).toFixed(0)}k` : '0',
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item, i) => (
        <Card key={item.key} className="p-3 text-center" delay={0.15 + i * 0.05}>
          <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center mx-auto mb-2`}>
            <item.icon className={`w-4 h-4 ${item.color}`} />
          </div>
          <p className="text-lg font-extrabold text-gray-900">{values[item.key]}</p>
          <p className="text-[10px] text-gray-400 font-medium">{item.label}</p>
        </Card>
      ))}
    </div>
  );
};
