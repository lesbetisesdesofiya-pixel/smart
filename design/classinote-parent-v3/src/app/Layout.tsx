import React, { useState } from 'react';
import { Header } from '@/shared/components/layout/Header';
import { BottomNav } from '@/shared/components/layout/BottomNav';
import { HomePage } from '@/features/home/HomePage';
import { GradesPage } from '@/features/grades/GradesPage';
import { ExamsPage } from '@/features/exams/ExamsPage';
import { PaymentsPage } from '@/features/payments/PaymentsPage';
import { NoticesPage } from '@/features/notices/NoticesPage';
import { MessagesPage } from '@/features/messages/MessagesPage';
import { SchedulePage } from '@/features/schedule/SchedulePage';
import { SupportPage } from '@/features/support/SupportPage';
import { FeedPage } from '@/features/feed/FeedPage';

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
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col">
      <Header title="ClassiNote" onNotifications={() => {}} onLogout={onLogout} notifCount={notifCount} />

      <main className="flex-1">
        {tab === 'accueil' && <HomePage onNavigate={handleNavigate} onLogout={onLogout} />}
        {tab === 'notes' && <GradesPage />}
        {tab === 'examens' && <ExamsPage />}
        {tab === 'paiements' && <PaymentsPage />}
        {tab === 'avis' && <NoticesPage />}
        {tab === 'messages' && <MessagesPage />}
        {tab === 'schedule' && <SchedulePage />}
        {tab === 'support' && <SupportPage />}
        {tab === 'nouveautes' && <FeedPage />}
      </main>

      <BottomNav tab={tab} onNavigate={handleNavigate} />
    </div>
  );
};
