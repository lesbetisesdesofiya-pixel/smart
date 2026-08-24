import React, { useState, useCallback } from 'react';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { BottomNav } from '@/shared/components/layout/BottomNav';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

interface LayoutProps {
  onLogout: () => void;
}

const screenTitles: Record<string, string> = {
  dashboard: 'Tableau de bord',
  evaluations: 'Évaluations',
  presences: 'Présences',
  interrogation: 'Interrogation',
  messaging: 'Messages',
  classes: 'Mes classes',
};

export const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = useCallback((screen: string) => {
    setCurrentScreen(screen);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectClass = useCallback((id: number) => {
    // TODO: navigate to class details
    console.log('Select class', id);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        teacherName="Professeur"
        teacherInitials="P"
        schoolName=""
        unreadCount={0}
        onOpenNotifications={() => {}}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-64">
        <PageHeader
          title={screenTitles[currentScreen] || 'ClassiNote'}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main>
          {currentScreen === 'dashboard' && (
            <DashboardPage onNavigate={handleNavigate} onSelectClass={handleSelectClass} />
          )}
          {currentScreen !== 'dashboard' && (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-gray-400">Écran "{currentScreen}" à venir</p>
            </div>
          )}
        </main>

        <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
      </div>
    </div>
  );
};
