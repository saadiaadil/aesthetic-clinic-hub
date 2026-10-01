/**
 * Calendar and scheduling helpers.
 *
 * Dates for bookings are handled as "YYYY-MM-DD" keys and "HH:mm" slot keys so
 * they map cleanly to the future API (appointments.scheduled_at is stored in UTC,
 * clinics operate in Riyadh time, UTC+3).
 */

export const WEEKDAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const RIYADH_OFFSET_HOURS = 3;

/** Current date key in Riyadh ("2026-10-01"). */
export function todayKey(now = new Date()) {
  return toDateKey(now);
}

/** Date → "YYYY-MM-DD" in Riyadh time. */
export function toDateKey(date) {
  const riyadh = new Date(date.getTime() + RIYADH_OFFSET_HOURS * 3600 * 1000);
  return riyadh.toISOString().slice(0, 10);
}

/**
 * "YYYY-MM-DD" → Date anchored at 12:00 UTC. Noon keeps the same calendar day
 * in every time zone between UTC-11 and UTC+11, so local getters (getDay,
 * getDate) and Riyadh-time formatting both show the intended date.
 */
export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function addDays(key, days) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return formatKey(date);
}

function formatKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Day of week (0 = Sunday) for a date key. */
export function dayOfWeek(key) {
  return fromDateKey(key).getDay();
}

/** Combines a Riyadh date key and "HH:mm" slot into an ISO UTC timestamp. */
export function toScheduledAt(dateKey, slot) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [h, min] = slot.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, h - RIYADH_OFFSET_HOURS, min)).toISOString();
}

/** ISO timestamp → { dateKey, slot } in Riyadh time. */
export function fromScheduledAt(iso) {
  const riyadh = new Date(new Date(iso).getTime() + RIYADH_OFFSET_HOURS * 3600 * 1000);
  const [dateKey, time] = riyadh.toISOString().split('T');
  return { dateKey, slot: time.slice(0, 5) };
}

/** ISO timestamp relative to "now": dayOffset days away at a Riyadh "HH:mm". */
export function relativeScheduledAt(dayOffset, slot, now = new Date()) {
  return toScheduledAt(addDays(todayKey(now), dayOffset), slot);
}

/**
 * Month matrix for the booking calendar (Sunday-first, like Stitch).
 * Returns 6 weeks max of { key, day, inMonth }.
 */
export function getMonthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const lastOfMonth = new Date(year, month + 1, 0);
  const cells = [];
  const cursor = new Date(start);
  while (cursor <= lastOfMonth || cursor.getDay() !== 0) {
    cells.push({ key: formatKey(cursor), day: cursor.getDate(), inMonth: cursor.getMonth() === month });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

export function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/** Minutes since midnight for "HH:mm". */
export function slotToMinutes(slot) {
  const [h, m] = slot.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToSlot(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Morning / Afternoon / Evening grouping used by the Stitch time-slot grid. */
export function slotPeriod(slot) {
  const minutes = slotToMinutes(slot);
  if (minutes < 13 * 60 + 30) return 'morning';
  if (minutes < 18 * 60) return 'afternoon';
  return 'evening';
}

export function isPastDateKey(key, now = new Date()) {
  return key < todayKey(now);
}
