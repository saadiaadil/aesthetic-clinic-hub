import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Saved clinics (header heart counter, "Save Clinic", Saved Clinics page).
 * Stored locally for now; Phase 5 syncs this list to the patient account
 * (GET/PUT /me/saved-clinics) after sign in.
 */
export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      clinicIds: ['dermaart', 'laura-skin', 'aurelia'],
      isSaved: (clinicId) => get().clinicIds.includes(clinicId),
      toggle: (clinicId) => {
        const saved = get().clinicIds.includes(clinicId);
        set({ clinicIds: saved ? get().clinicIds.filter((id) => id !== clinicId) : [...get().clinicIds, clinicId] });
        return !saved;
      },
      remove: (clinicId) => set({ clinicIds: get().clinicIds.filter((id) => id !== clinicId) }),
    }),
    { name: 'ach.favorites', storage: createJSONStorage(() => localStorage) },
  ),
);
