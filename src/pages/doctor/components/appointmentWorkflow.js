import { CircleCheck, Play, UserCheck } from 'lucide-react';
import { addDays, fromDateKey, todayKey } from '@/utils/date';
import { formatShortDate, formatSlot } from '@/utils/format';

/**
 * Day-of-visit progression on the doctor workstation (Stitch queue actions:
 * Mark Arrived → Start Session → Finish Session). Mirrors the transitions
 * allowed by `updateAppointmentStatus`.
 */
export const NEXT_STEP = {
  confirmed: { status: 'checked_in', label: 'Mark Arrived', icon: UserCheck },
  rescheduled: { status: 'checked_in', label: 'Mark Arrived', icon: UserCheck },
  checked_in: { status: 'in_session', label: 'Start Session', icon: Play },
  in_session: { status: 'completed', label: 'Finish Session', icon: CircleCheck },
};

/** Bookings the specialist can still move to another time. */
export const PROPOSABLE_STATUSES = ['pending', 'confirmed', 'rescheduled'];

/** Next progression step, or null. Arrival can only be marked on the day of the visit. */
export function getNextStep(appointment) {
  const step = NEXT_STEP[appointment.status];
  if (!step) return null;
  if (step.status === 'checked_in' && appointment.dateKey !== todayKey()) return null;
  return step;
}

/** Success toast copy for each progression step: [title, description]. */
export const STEP_TOASTS = {
  checked_in: (appointment) => [`${appointment.patient?.name} has arrived`, `Checked in for ${appointment.service?.shortTitle} at ${formatSlot(appointment.slot)}.`],
  in_session: (appointment) => ['Session started', `${appointment.patient?.name} • ${appointment.service?.shortTitle}`],
  completed: (appointment) => ['Session completed', `${appointment.patient?.name} will be invited to share a verified review.`],
};

/** "Today" / "Tomorrow" / "Sat, 3 Oct". */
export function relativeDayLabel(dateKey) {
  const today = todayKey();
  if (dateKey === today) return 'Today';
  if (dateKey === addDays(today, 1)) return 'Tomorrow';
  return formatShortDate(fromDateKey(dateKey));
}

/** "Tomorrow, 11:00 AM" */
export const whenLabel = (appointment) => `${relativeDayLabel(appointment.dateKey)}, ${formatSlot(appointment.slot)}`;

/** Replaces one appointment (matched by id) in a list, keeping the list order. */
export const replaceAppointment = (list = [], updated) => list.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
