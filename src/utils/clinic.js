import { addDays, dayOfWeek, todayKey, WEEKDAYS } from './date';
import { formatSlot } from './format';

/**
 * Saudi consumer prices are shown VAT-inclusive (Stitch profile: "All prices
 * include 15% VAT"). Returns the VAT portion contained in an inclusive price.
 */
export function includedVat(price, rate = 0.15) {
  return Math.round((price * rate) / (1 + rate));
}

/** "Open Today until 10:00 PM" / "Closed Today • Opens Saturday 10:00 AM". */
export function getOpeningStatus(openingHours, now = new Date()) {
  if (!openingHours) return { open: false, label: 'Hours on request' };
  const today = todayKey(now);
  const riyadhMinutes = ((now.getUTCHours() + 3) % 24) * 60 + now.getUTCMinutes();
  const [closeH, closeM] = openingHours.close.split(':').map(Number);
  const closedToday = openingHours.closedDays.includes(dayOfWeek(today));
  if (!closedToday && riyadhMinutes < closeH * 60 + closeM) {
    return { open: true, label: `Open Today until ${formatSlot(openingHours.close).replace(/^0/, '')}` };
  }
  for (let offset = 1; offset <= 7; offset += 1) {
    const key = addDays(today, offset);
    if (!openingHours.closedDays.includes(dayOfWeek(key))) {
      const day = offset === 1 ? 'Tomorrow' : WEEKDAYS[dayOfWeek(key)];
      return { open: false, label: `Closed now • Opens ${day} ${formatSlot(openingHours.open).replace(/^0/, '')}` };
    }
  }
  return { open: false, label: 'Temporarily closed' };
}

/** Next `count` dates the clinic opens (booking dock date tabs). */
export function getUpcomingOpenDays(openingHours, count = 3, now = new Date()) {
  const days = [];
  // Skip today once the clinic is within an hour of closing.
  const riyadhMinutes = ((now.getUTCHours() + 3) % 24) * 60 + now.getUTCMinutes();
  const [closeH, closeM] = (openingHours?.close ?? '22:00').split(':').map(Number);
  let offset = riyadhMinutes > closeH * 60 + closeM - 60 ? 1 : 0;
  while (days.length < count && offset < 21) {
    const key = addDays(todayKey(now), offset);
    if (!openingHours?.closedDays.includes(dayOfWeek(key))) {
      days.push({ key, offset, label: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : WEEKDAYS[dayOfWeek(key)] });
    }
    offset += 1;
  }
  return days;
}

export const mapsUrl = ({ latitude, longitude }) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
