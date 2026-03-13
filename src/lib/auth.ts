import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
interface AuthState {
  userId: string;
  setUserId: (id: string) => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  userId: (() => {
    const stored = localStorage.getItem('bb_user_id');
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem('bb_user_id', newId);
    return newId;
  })(),
  setUserId: (id: string) => {
    localStorage.setItem('bb_user_id', id);
    set({ userId: id });
  },
}));
export function useAuth() {
  const userId = useAuthStore(s => s.userId);
  return { userId };
}