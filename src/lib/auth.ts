import { create } from 'zustand';
import type { User } from '@shared/types';
interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('bb_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('bb_token'),
  login: (user: User, token: string) => {
    localStorage.setItem('bb_user', JSON.stringify(user));
    localStorage.setItem('bb_token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('bb_user');
    localStorage.removeItem('bb_token');
    set({ user: null, token: null });
  },
}));
export function useAuth() {
  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const userId = user?.id || '';
  const isAuthenticated = !!token;
  return { user, userId, token, isAuthenticated, logout };
}