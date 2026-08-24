import { create } from 'zustand';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '@/shared/api/client';

interface AuthState {
  isAuthenticated: boolean;
  user: { id: number } | null;
  setAuth: (user: { id: number }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setAuth: (user) => set({ isAuthenticated: true, user }),
  clearAuth: () => set({ isAuthenticated: false, user: null }),
}));

interface ChildrenState {
  enfants: any[];
  activeChildId: number | null;
  setEnfants: (enfants: any[]) => void;
  setActiveChild: (id: number) => void;
}

export const useChildrenStore = create<ChildrenState>((set) => ({
  enfants: [],
  activeChildId: null,
  setEnfants: (enfants) => set({ enfants }),
  setActiveChild: (id) => set({ activeChildId: id }),
}));

// Hook pour utiliser les données du dashboard (une seule requête API)
export function useDashboard() {
  return useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: fetchDashboard,
    staleTime: 60_000, // 1 minute
  });
}
