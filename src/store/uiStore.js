import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Preferred Riyadh district (header location pill) — used as the default discovery filter. */
export const usePreferencesStore = create(
  persist(
    (set) => ({
      district: 'all',
      setDistrict: (district) => set({ district }),
    }),
    { name: 'ach.preferences', storage: createJSONStorage(() => localStorage) },
  ),
);

let toastId = 0;

/** Toast notifications. Use through the `useToast()` hook. */
export const useToastStore = create((set, get) => ({
  toasts: [],
  push: ({ title, description = '', tone = 'success', duration = 4500 }) => {
    toastId += 1;
    const id = toastId;
    set({ toasts: [...get().toasts.slice(-2), { id, title, description, tone }] });
    if (duration) setTimeout(() => get().dismiss(id), duration);
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));
