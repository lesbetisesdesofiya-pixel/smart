import React from 'react';
import { Home, GraduationCap, CalendarDays, MessageCircle, CreditCard } from 'lucide-react';

interface BottomNavProps {
  tab: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  { id: 'accueil', label: 'Accueil', Icon: Home },
  { id: 'notes', label: 'Notes', Icon: GraduationCap },
  { id: 'examens', label: 'Examens', Icon: CalendarDays },
  { id: 'messages', label: 'Messages', Icon: MessageCircle },
  { id: 'paiements', label: 'Paiements', Icon: CreditCard },
];

export const BottomNav: React.FC<BottomNavProps> = ({ tab, onNavigate }) => (
  <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '6px 4px', maxWidth: '512px', margin: '0 auto', paddingBottom: 'env(safe-area-inset-bottom, 6px)' }}>
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onNavigate(t.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
              background: active ? '#eef2ff' : 'transparent',
              color: active ? '#002366' : '#9ca3af',
            }}
          >
            <t.Icon size={20} strokeWidth={active ? 2.5 : 2} style={{ marginBottom: '2px' }} />
            <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
