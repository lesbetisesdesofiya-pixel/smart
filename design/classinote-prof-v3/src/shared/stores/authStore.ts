import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: { id: number; nom_complet: string } | null;
  setAuth: (user: { id: number; nom_complet: string }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setAuth: (user) => set({ isAuthenticated: true, user }),
  clearAuth: () => set({ isAuthenticated: false, user: null }),
}));
