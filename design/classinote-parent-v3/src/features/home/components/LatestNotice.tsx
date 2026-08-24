import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { MessageSquare } from 'lucide-react';
import { formatRelative } from '@/shared/utils/format';

interface LatestNoticeProps {
  auteur: string;
  contenu: string;
  date: string;
  onClick?: () => void;
}

export const LatestNotice: React.FC<LatestNoticeProps> = ({ auteur, contenu, date, onClick }) => (
  <Card className="p-5" delay={0.4} onClick={onClick}>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
        <MessageSquare className="w-4 h-4 text-violet-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{auteur}</p>
        <p className="text-[11px] text-gray-400">{formatRelative(date)}</p>
      </div>
    </div>
    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">"{contenu}"</p>
  </Card>
);
