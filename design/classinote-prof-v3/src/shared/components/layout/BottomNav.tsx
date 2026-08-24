import React from 'react';
import { LayoutDashboard, FileText, Users, MessageSquare, ClipboardCheck } from 'lucide-react';

interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
  { id: 'evaluations', label: 'Notes', icon: FileText },
  { id: 'presences', label: 'Présences', icon: ClipboardCheck },
  { id: 'classes', label: 'Classes', icon: Users },
  { id: 'messaging', label: 'Messages', icon: MessageSquare },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 safe-area-pb">
    <div className="flex justify-around items-center px-2 py-2 max-w-lg mx-auto">
      {tabs.map((tab) => {
        const active = currentScreen === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-all cursor-pointer
              ${active ? 'text-navy-800 bg-navy-50' : 'text-gray-400'}`}
          >
            <tab.icon className={`w-5 h-5 ${active ? 'text-navy-800' : 'text-gray-400'}`} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[10px] mt-0.5 ${active ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
