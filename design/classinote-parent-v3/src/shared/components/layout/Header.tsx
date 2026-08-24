import React from 'react';
import { Bell, LogOut } from 'lucide-react';

interface HeaderProps {
  title: string;
  onNotifications: () => void;
  onLogout: () => void;
  notifCount: number;
}

export const Header: React.FC<HeaderProps> = ({ title, onNotifications, onLogout, notifCount }) => (
  <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'linear-gradient(135deg, #002366, #1a3a7a)', color: '#ffffff' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', maxWidth: '512px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '13px', fontWeight: 800 }}>CN</span>
        </div>
        <h1 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button onClick={onNotifications} style={{ position: 'relative', padding: '10px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#ffffff', cursor: 'pointer' }}>
          <Bell size={20} />
          {notifCount > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '10px', height: '10px', background: '#f43f5e', borderRadius: '50%' }} />}
        </button>
        <button onClick={onLogout} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#ffffff', cursor: 'pointer' }}>
          <LogOut size={20} />
        </button>
      </div>
    </div>
  </header>
);
