import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Booking flow selections (Clinic → Treatment → Specialist → Date & Time →
 * Confirmation). Kept in sessionStorage so a refresh mid-booking does not
 * lose progress, but a new browser session starts clean.
 *
 * Selecting an earlier step clears the later steps that depend on it.
 */

const newIdempotencyKey = () => globalThis.crypto?.randomUUID?.() ?? `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initialState = {
  clinicId: null,
  clinicServiceId: null,
  doctorId: null, // a doctor id or 'any' (next available specialist)
  dateKey: null,
  slot: null,
  preferences: { privateSuite: false, femaleStaff: false },
  patientNotes: '',
  paymentMethod: 'clinic',
  idempotencyKey: newIdempotencyKey(),
  confirmedAppointmentId: null,
};

export const useBookingStore = create(
  persist(
    (set) => ({
      ...initialState,

      /** Pre-fill from a clinic profile or discovery card (?clinic=&service=&doctor=). */
      start: ({ clinicId = null, clinicServiceId = null, doctorId = null, dateKey = null, slot = null } = {}) =>
        set({
          ...initialState,
          idempotencyKey: newIdempotencyKey(),
          clinicId,
          clinicServiceId,
          doctorId,
          dateKey,
          slot,
        }),

      selectClinic: (clinicId) =>
        set((state) =>
          state.clinicId === clinicId
            ? {}
            : { clinicId, clinicServiceId: null, doctorId: null, dateKey: null, slot: null, confirmedAppointmentId: null },
        ),

      selectService: (clinicServiceId) =>
        set((state) =>
          state.clinicServiceId === clinicServiceId ? {} : { clinicServiceId, doctorId: null, dateKey: null, slot: null },
        ),

      selectDoctor: (doctorId) => set((state) => (state.doctorId === doctorId ? {} : { doctorId, dateKey: null, slot: null })),

      selectDate: (dateKey) => set((state) => (state.dateKey === dateKey ? {} : { dateKey, slot: null })),

      selectSlot: (slot) => set({ slot }),

      setDetails: ({ preferences, patientNotes }) => set({ preferences, patientNotes }),

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

      markConfirmed: (appointmentId) => set({ confirmedAppointmentId: appointmentId }),

      reset: () => set({ ...initialState, idempotencyKey: newIdempotencyKey() }),
    }),
    {
      name: 'ach.booking',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
