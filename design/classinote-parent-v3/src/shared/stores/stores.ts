import { create } from 'zustand';

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
