import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as authService from '@/services/authService';

/**
 * Current user + auth actions. Components use the `useAuth()` hook.
 *
 * Mock phase: the signed-in user is persisted to localStorage so a refresh
 * keeps you signed in. With the Express API the JWT lives in an HTTP-only
 * cookie the browser manages; `restoreSession()` calls GET /auth/me instead
 * and nothing sensitive is stored in JavaScript.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      /** 'unknown' until restoreSession() has run, then 'authenticated' | 'guest'. */
      status: 'unknown',

      login: async (credentials) => {
        const { user } = await authService.login(credentials);
        set({ user, status: 'authenticated' });
        return user;
      },

      register: async (data) => {
        const { user } = await authService.register(data);
        set({ user, status: 'authenticated' });
        return user;
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          set({ user: null, status: 'guest' });
        }
      },

      restoreSession: async () => {
        const current = get().user;
        if (!current) {
          set({ status: 'guest' });
          return;
        }
        try {
          const { user } = await authService.getCurrentUser(current.id);
          set({ user, status: 'authenticated' });
        } catch {
          set({ user: null, status: 'guest' });
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'ach.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        // Optimistically treat a persisted user as signed in until restoreSession() confirms.
        if (state?.user) state.status = 'authenticated';
      },
    },
  ),
);
