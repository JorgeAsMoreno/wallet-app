import { create } from 'zustand';
import type { Session } from './domain/types';

interface AuthState {
  session: Session | null;
  setSession: (session: Session) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
}));
