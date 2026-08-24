import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';

interface HeroCardProps {
  parentName: string;
  childName: string;
  present: boolean;
  prochainCours: { matiere: string; heure: string } | null;
}

export const HeroCard: React.FC<HeroCardProps> = ({ parentName, childName, present, prochainCours }) => (
  <Card variant="hero" delay={0}>
    <div style={{ position: 'absolute', right: '-60px', bottom: '-60px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
    <div style={{ position: 'absolute', left: '-40px', top: '-40px', width: '120px', height: '120px', background: 'rgba(55,92,166,0.2)', borderRadius: '50%' }} />
    <div style={{ position: 'relative', zIndex: 10 }}>
      <p style={{ fontSize: '14px', color: 'rgba(191,219,254,0.8)', marginBottom: '4px' }}>Bonjour,</p>
      <h2 style={{ fontSize: '30px', fontWeight: 800, marginBottom: '20px' }}>{parentName}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: present ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', border: `1px solid ${present ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
          {present ? <CheckCircle size={22} color="#34d399" /> : <XCircle size={22} color="#f87171" />}
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700 }}>{childName}</p>
          <p style={{ fontSize: '12px', color: 'rgba(191,219,254,0.7)' }}>{present ? "Présent(e) aujourd'hui" : "Absent(e) aujourd'hui"}</p>
        </div>
      </div>
      {prochainCours && <p style={{ fontSize: '12px', color: 'rgba(191,219,254,0.6)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={14} /> Prochain : {prochainCours.matiere} à {prochainCours.heure}</p>}
    </div>
  </Card>
);

interface ChildSelectorProps {
  enfants: { id: number; nom: string; classe: string }[];
  activeId: number;
  onSelect: (id: number) => void;
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({ enfants, activeId, onSelect }) => {
  if (enfants.length <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
      {enfants.map((child) => (
        <button key={child.id} onClick={() => onSelect(child.id)} style={{
          flexShrink: 0, padding: '8px 16px', borderRadius: '16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
          border: child.id === activeId ? 'none' : '1px solid #f3f4f6',
          background: child.id === activeId ? '#002366' : '#ffffff',
          color: child.id === activeId ? '#ffffff' : '#2a4386',
          boxShadow: child.id === activeId ? '0 4px 12px rgba(0,35,102,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          {child.nom.split(' ')[0]}{child.classe && <span style={{ opacity: 0.6, marginLeft: '4px' }}>({child.classe})</span>}
        </button>
      ))}
    </div>
  );
};
