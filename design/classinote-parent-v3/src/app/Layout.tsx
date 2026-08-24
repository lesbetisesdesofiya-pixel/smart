import React, { useState } from 'react';
import { Header } from '@/shared/components/layout/Header';
import { BottomNav } from '@/shared/components/layout/BottomNav';
import { HomePage } from '@/features/home/HomePage';
import { EmptyState } from '@/shared/components/ui/Feedback';
import { Construction } from 'lucide-react';

interface LayoutProps {
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const [tab, setTab] = useState('accueil');
  const [notifCount] = useState(0);

  const handleNavigate = (t: string) => {
    setTab(t);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
      <Header title="ClassiNote" onNotifications={() => {}} onLogout={onLogout} notifCount={notifCount} />

      <main className="flex-1">
        {tab === 'accueil' && <HomePage onNavigate={handleNavigate} onLogout={onLogout} />}
        {tab !== 'accueil' && (
          <EmptyState
            icon={<Construction className="w-8 h-8" />}
            title={`Écran "${tab}" à venir`}
            description="Cet écran sera disponible prochainement."
          />
        )}
      </main>

      <BottomNav tab={tab} onNavigate={handleNavigate} />
    </div>
  );
};
