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
    accessToken: localStorage.getItem('aye_token') || null,
    setAuth: (user, token) => {
      localStorage.setItem('aye_user', JSON.stringify(user));
      localStorage.setItem('aye_token', token);
      set({ user, accessToken: token });
    },
    clearAuth: () => {
      localStorage.removeItem('aye_user');
      localStorage.removeItem('aye_token');
      set({ user: null, accessToken: null });
    },
  };
});
