import { ROUTES } from '@/constants/routes';

/**
 * Booking flow steps (Stitch stepper). Medical intake and discretion
 * preferences are captured on the Date & Time step, as in the Stitch screen.
 */
export const BOOKING_STEPS = [
  { key: 'clinic', label: 'Clinic', path: ROUTES.booking.clinic, isComplete: (state) => Boolean(state.clinicId) },
  { key: 'service', label: 'Treatment', path: ROUTES.booking.service, isComplete: (state) => Boolean(state.clinicServiceId) },
  { key: 'doctor', label: 'Specialist', path: ROUTES.booking.doctor, isComplete: (state) => Boolean(state.doctorId) },
  { key: 'dateTime', label: 'Date & Time', path: ROUTES.booking.dateTime, isComplete: (state) => Boolean(state.dateKey && state.slot && state.patientNotes) },
  { key: 'confirmation', label: 'Confirmation', path: ROUTES.booking.confirmation, isComplete: (state) => Boolean(state.confirmedAppointmentId) },
];

/** First step whose prerequisites are not met (used by step guards and /booking). */
export function firstIncompleteStep(state) {
  return BOOKING_STEPS.find((step) => !step.isComplete(state)) ?? BOOKING_STEPS[BOOKING_STEPS.length - 1];
}

/** Whether the user may open `stepKey` given the current selections. */
export function canAccessStep(state, stepKey) {
  const index = BOOKING_STEPS.findIndex((step) => step.key === stepKey);
  return BOOKING_STEPS.slice(0, index).every((step) => step.isComplete(state));
}
