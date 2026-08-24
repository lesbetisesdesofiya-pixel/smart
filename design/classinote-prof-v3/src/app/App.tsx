import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getSessionUser, checkDevice } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';
import { Layout } from './Layout';
import { PinEntryScreen } from '@/features/auth/PinEntryScreen';
import { MagicConsumePage } from '@/features/auth/MagicConsumePage';
import { LandingPage } from '@/features/auth/LandingPage';
import { PwaInstallBanner } from '@/shared/components/ui/PwaInstallBanner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function parseMagicToken(): boolean {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('t');
  return !!token && /^[a-f0-9]{64}$/i.test(token);
}

function AppContent() {
  const { isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<'loading' | 'magic' | 'pin' | 'landing' | 'dashboard'>('loading');
  const isMagicLink = parseMagicToken();

  useEffect(() => {
    const init = async () => {
      // 1. Si lien magique → consommer
      if (isMagicLink) {
        setScreen('magic');
        return;
      }

      // 2. Vérifier session existante
      const sessionUser = await getSessionUser();
      if (sessionUser) {
        setAuth({ id: sessionUser.id, nom_complet: sessionUser.nom_complet });
        setScreen('dashboard');
        setLoading(false);
        return;
      }

      // 3. Vérifier si appareil enregistré
      const device = await checkDevice();
      if (device.trusted) {
        setScreen('pin');
        setLoading(false);
        return;
      }

      // 4. Rien → landing
      setScreen('landing');
      setLoading(false);
    };

    init();
  }, [isMagicLink, setAuth]);

  const handlePinSuccess = (user: { id: number; nom_complet: string }) => {
    setAuth(user);
    setScreen('dashboard');
  };

  const handleMagicSuccess = () => {
    // Après consommation du lien magique, recharger pour vérifier session
    window.location.replace(window.location.pathname);
  };

  if (loading || screen === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (screen === 'magic') {
    return <MagicConsumePage onSuccess={handleMagicSuccess} />;
  }

  if (screen === 'pin') {
    return <PinEntryScreen onSuccess={handlePinSuccess} onLogout={() => { clearAuth(); setScreen('landing'); }} />;
  }

  if (screen === 'landing' || !isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <>
      <PwaInstallBanner />
      <Layout onLogout={() => { clearAuth(); window.location.reload(); }} />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
