import React from 'react';
import { Home, GraduationCap, CalendarDays, MessageCircle, CreditCard } from 'lucide-react';

interface BottomNavProps {
  tab: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  { id: 'accueil', label: 'Accueil', icon: Home },
  { id: 'notes', label: 'Notes', icon: GraduationCap },
  { id: 'examens', label: 'Examens', icon: CalendarDays },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'paiements', label: 'Paiements', icon: CreditCard },
];

export const BottomNav: React.FC<BottomNavProps> = ({ tab, onNavigate }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 safe-area-pb">
    <div className="flex justify-around items-center px-2 py-2 max-w-lg mx-auto">
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onNavigate(t.id)}
            className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-all cursor-pointer
              ${active ? 'text-navy-800 bg-navy-50' : 'text-gray-400'}`}
          >
            <t.icon className={`w-5 h-5 ${active ? 'text-navy-800' : 'text-gray-400'}`} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[10px] mt-0.5 ${active ? 'font-bold' : 'font-medium'}`}>{t.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
