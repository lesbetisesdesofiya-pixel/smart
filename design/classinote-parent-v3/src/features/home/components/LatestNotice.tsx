import React from 'react';
import { Card } from '@/shared/components/ui/Card';

interface LatestNoticeProps {
  auteur: string;
  contenu: string;
  date: string;
  onClick?: () => void;
}

export const LatestNotice: React.FC<LatestNoticeProps> = ({ auteur, contenu, date, onClick }) => (
  <Card delay={0.4} onClick={onClick} style={{ padding: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '18px' }}>💬</span>
      </div>
      <div>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{auteur}</p>
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>{date}</p>
      </div>
    </div>
    <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>"{contenu}"</p>
  </Card>
);
