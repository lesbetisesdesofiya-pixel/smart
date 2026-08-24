import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { ClipboardList, PenLine, UserCheck, MessageSquare, FileText, AlertCircle } from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (screen: string) => void;
}

const actions = [
  { id: 'interrogation', label: 'Interrogation', desc: 'Quiz rapide', icon: ClipboardList, gradient: 'from-navy-800 to-navy-500' },
  { id: 'evaluations', label: 'Saisir notes', desc: 'Évaluations', icon: PenLine, gradient: 'from-blue-600 to-blue-400' },
  { id: 'presences', label: 'Présences', desc: 'Appel du jour', icon: UserCheck, gradient: 'from-emerald-600 to-emerald-400' },
  { id: 'create_remark', label: 'Remarque', desc: 'Sur un élève', icon: AlertCircle, gradient: 'from-rose-600 to-rose-400' },
  { id: 'evaluations', label: 'Voir notes', desc: 'Consulter', icon: FileText, gradient: 'from-amber-600 to-amber-400' },
  { id: 'messaging', label: 'Messages', desc: 'Parents', icon: MessageSquare, gradient: 'from-teal-600 to-teal-400' },
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => (
  <Card className="p-5" delay={0.3}>
    <h3 className="text-sm font-bold text-gray-900 mb-4">Actions rapides</h3>
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action, i) => (
        <button
          key={`${action.id}-${i}`}
          onClick={() => onNavigate(action.id)}
          className="group flex flex-col items-center text-center p-3 rounded-xl hover:bg-gray-50 transition-all active:scale-95 cursor-pointer"
        >
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg`}>
            <action.icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs font-bold text-gray-900 leading-tight">{action.label}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{action.desc}</p>
        </button>
      ))}
    </div>
  </Card>
);
