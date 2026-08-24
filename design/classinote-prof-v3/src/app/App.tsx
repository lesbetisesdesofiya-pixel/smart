import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getSessionUser } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';
import { Layout } from './Layout';
import { LoginPage } from '@/features/auth/LoginPage';
import { MagicConsumePage } from '@/features/auth/MagicConsumePage';

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
  const isMagicLink = parseMagicToken();

  useEffect(() => {
    if (isMagicLink) return;

    getSessionUser().then((user) => {
      if (user) {
        setAuth({ id: user.id, nom_complet: user.nom_complet });
      }
      setLoading(false);
    });
  }, [isMagicLink, setAuth]);

  if (isMagicLink) {
    return <MagicConsumePage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => {
      getSessionUser().then((user) => {
        if (user) setAuth({ id: user.id, nom_complet: user.nom_complet });
        setLoading(false);
        window.location.reload();
      });
    }} />;
  }

  return <Layout onLogout={() => { clearAuth(); window.location.reload(); }} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
