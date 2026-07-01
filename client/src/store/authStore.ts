import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe parsing helper for localStorage
  const getPersistedUser = (): User | null => {
    try {
      const stored = localStorage.getItem('aye_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  return {
    user: getPersistedUser(),
    accessToken: null,
    setAuth: (user, token) => {
      localStorage.setItem('aye_user', JSON.stringify(user));
      set({ user, accessToken: token });
    },
    clearAuth: () => {
      localStorage.removeItem('aye_user');
      set({ user: null, accessToken: null });
    },
  };
});
