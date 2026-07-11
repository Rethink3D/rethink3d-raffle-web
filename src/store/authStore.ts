import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Admin } from '../types';

export interface AuthState {
  token: string | null;
  user: User | Admin | null;
  role: 'participant' | 'admin' | null;
  mustChangePin: boolean;
  // Quantidade de cupons de bônus de cadastro a exibir no popup de boas-vindas
  // assim que o usuário chegar no dashboard — null quando não há popup pendente.
  signupBonusPopup: number | null;
  login: (token: string, user: User | Admin, role: 'participant' | 'admin') => void;
  logout: () => void;
  setMustChangePin: (mustChangePin: boolean) => void;
  setUser: (user: User | Admin | null) => void;
  setSignupBonusPopup: (amount: number | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      mustChangePin: false,
      signupBonusPopup: null,
      login: (token, user, role) => {
        const mustChangePin =
          role === 'participant'
            ? (user as User).mustChangePinOnNextLogin || false
            : false;
        set({
          token,
          user,
          role,
          mustChangePin,
        });
      },
      logout: () => {
        set({
          token: null,
          user: null,
          role: null,
          mustChangePin: false,
          signupBonusPopup: null,
        });
      },
      setMustChangePin: (mustChangePin) => set({ mustChangePin }),
      setUser: (user) => set({ user }),
      setSignupBonusPopup: (amount) => set({ signupBonusPopup: amount }),
    }),
    {
      name: 'rethink3d-auth-storage',
    }
  )
);
