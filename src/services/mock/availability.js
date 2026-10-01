import { ACTIVE_APPOINTMENT_STATUSES } from '@/constants/status';
import { dayOfWeek, fromScheduledAt, slotToMinutes, todayKey } from '@/utils/date';
import { db } from './mockDb';

/**
 * Mock availability engine — mirrors what the API will compute from
 * doctor_schedule, doctor_leave and appointments:
 *   available = inside a schedule block, not on leave, clinic open,
 *               not overlapping an active appointment, not in the past.
 * A deterministic share of slots is marked as held by other channels
 * (walk-ins, phone bookings) so the grid looks like a real clinic day.
 */

/** Slot template (Stitch booking screen times). */
export const SLOT_TEMPLATE = [
  '09:00', '10:00', '11:30', '12:15', '13:00', '14:00', '15:30',
  '16:45', '17:30', '18:00', '19:15', '20:30', '21:15',
];

function hash(text) {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

function riyadhNowMinutes() {
  const now = new Date();
  return ((now.getUTCHours() + 3) % 24) * 60 + now.getUTCMinutes();
}

function getBlocks(doctorId, clinicId, dateKey) {
  const schedule = db.all('doctorSchedules').find((row) => row.doctorId === doctorId && row.clinicId === clinicId);
  if (!schedule) return [];
  const dow = dayOfWeek(dateKey);
  return schedule.blocks.filter((block) => block.dayOfWeek === dow);
}

function isOnLeave(doctorId, dateKey) {
  return db
    .all('doctorLeaves')
    .some((leave) => leave.doctorId === doctorId && dateKey >= leave.startDate && dateKey <= leave.endDate);
}

function bookedRanges(doctorId, dateKey, ignoreAppointmentId) {
  return db
    .all('appointments')
    .filter(
      (apt) =>
        apt.doctorId === doctorId &&
        apt.id !== ignoreAppointmentId &&
        ACTIVE_APPOINTMENT_STATUSES.includes(apt.status) &&
        fromScheduledAt(apt.scheduledAt).dateKey === dateKey,
    )
    .map((apt) => {
      const start = slotToMinutes(fromScheduledAt(apt.scheduledAt).slot);
      return [start, start + apt.durationMinutes];
    });
}

/**
 * Slots for one doctor on one date.
 * Returns [{ slot: '19:15', status: 'available' | 'booked' | 'reserved' }]
 * or [] when the doctor does not work that day.
 */
export function getDoctorSlots({ clinicId, doctorId, dateKey, durationMinutes = 45, ignoreAppointmentId }) {
  const clinic = db.find('clinics', clinicId);
  if (!clinic || clinic.openingHours.closedDays.includes(dayOfWeek(dateKey))) return [];
  if (isOnLeave(doctorId, dateKey)) return [];
  const blocks = getBlocks(doctorId, clinicId, dateKey);
  if (blocks.length === 0) return [];

  const booked = bookedRanges(doctorId, dateKey, ignoreAppointmentId);
  const isToday = dateKey === todayKey();
  const nowMinutes = riyadhNowMinutes();

  return SLOT_TEMPLATE.flatMap((slot) => {
    const start = slotToMinutes(slot);
    const end = start + durationMinutes;
    const withinBlock = blocks.some((block) => start >= slotToMinutes(block.start) && end <= slotToMinutes(block.end));
    if (!withinBlock) return [];
    if (isToday && start <= nowMinutes + 30) return [{ slot, status: 'booked' }];
    if (booked.some(([bStart, bEnd]) => start < bEnd && end > bStart)) return [{ slot, status: 'booked' }];
    const held = hash(`${doctorId}|${dateKey}|${slot}`) % 100;
    if (held < 12) return [{ slot, status: 'reserved' }];
    if (held < 24) return [{ slot, status: 'booked' }];
    return [{ slot, status: 'available' }];
  });
}

/** Merge slots across several doctors ("Next available senior consultant"). */
export function getMergedSlots({ clinicId, doctorIds, dateKey, durationMinutes }) {
  const bySlot = new Map();
  doctorIds.forEach((doctorId) => {
    getDoctorSlots({ clinicId, doctorId, dateKey, durationMinutes }).forEach(({ slot, status }) => {
      const current = bySlot.get(slot);
      if (!current || status === 'available') bySlot.set(slot, { slot, status, doctorId: status === 'available' ? doctorId : current?.doctorId });
    });
  });
  return SLOT_TEMPLATE.filter((slot) => bySlot.has(slot)).map((slot) => bySlot.get(slot));
}

/** Calendar day state: 'available' | 'full' | 'closed'. */
export function getDayStatus({ clinicId, doctorIds, dateKey, durationMinutes }) {
  if (dateKey < todayKey()) return 'closed';
  const slots = getMergedSlots({ clinicId, doctorIds, dateKey, durationMinutes });
  if (slots.length === 0) return 'closed';
  return slots.some((slot) => slot.status === 'available') ? 'available' : 'full';
}

export function isSlotAvailable({ clinicId, doctorId, dateKey, slot, durationMinutes, ignoreAppointmentId }) {
  return getDoctorSlots({ clinicId, doctorId, dateKey, durationMinutes, ignoreAppointmentId }).some(
    (item) => item.slot === slot && item.status === 'available',
  );
}
