import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '../types/user.types';

interface AuthState {
  user: User | null;
  token: string | null;
  expiresAtEpochMs: number | null;
  setSession: (user: User, token: string, expiresAtEpochMs: number) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      expiresAtEpochMs: null,
      setSession: (user, token, expiresAtEpochMs) => set({ user, token, expiresAtEpochMs }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null, expiresAtEpochMs: null }),
    }),
    { name: 'usm-auth' }
  )
);
