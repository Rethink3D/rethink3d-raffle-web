import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StandState {
  token: string | null;
  pairedAt: string | null;
  setToken: (token: string) => void;
  clear: () => void;
}

export const useStandStore = create<StandState>()(
  persist(
    (set) => ({
      token: null,
      pairedAt: null,
      setToken: (token) => set({ token, pairedAt: new Date().toISOString() }),
      clear: () => set({ token: null, pairedAt: null }),
    }),
    {
      name: 'rethink3d-stand-session',
    }
  )
);
