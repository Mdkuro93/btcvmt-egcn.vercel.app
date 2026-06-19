import { create } from 'zustand';
import { UserProfile, Dept } from '../types';

interface AuthState {
  currentUser: UserProfile | null;
  userRole: Dept;
  setCurrentUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  userRole: 'PTT',
  setCurrentUser: (user) => set({
    currentUser: user,
    userRole: user?.dept || 'PTT'
  }),
}));
