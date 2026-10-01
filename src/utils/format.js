/**
 * Display formatting helpers (currency, dates, names).
 * Riyadh time (AST, UTC+3) is used for every clinic-facing date and time.
 */

export const TIME_ZONE = 'Asia/Riyadh';
export const VAT_RATE = 0.15;

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1400 → "1,400" */
export function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

/** 1400 → "1,400 SAR"; formatPrice(402.5, { decimals: true }) → "402.50 SAR" */
export function formatPrice(value, { currency = 'SAR', decimals = false } = {}) {
  const amount = decimals ? decimalFormatter.format(Number(value) || 0) : formatNumber(value);
  return `${amount} ${currency}`;
}

/** Price range for a clinic service: "1,200 SAR" or "1,200 – 1,800 SAR". */
export function formatPriceRange(min, max, currency = 'SAR') {
  if (!max || max === min) return formatPrice(min, { currency });
  return `${formatNumber(min)} – ${formatNumber(max)} ${currency}`;
}

/** Rating to 1 or 2 decimals as shown in Stitch (4.9, 4.95, 4.88). */
export function formatRating(value) {
  const rounded = Math.round((Number(value) || 0) * 100) / 100;
  return Number.isInteger(rounded * 10) ? rounded.toFixed(1) : rounded.toFixed(2);
}

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

/** "Thursday, 24 October 2025" */
export function formatLongDate(value) {
  return toDate(value).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}

/** "24 Oct 2025" */
export function formatDate(value) {
  return toDate(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}

/** "Thu, 24 Oct" */
export function formatShortDate(value) {
  return toDate(value).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: TIME_ZONE,
  });
}

/** "07:15 PM" */
export function formatTime(value) {
  return toDate(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TIME_ZONE,
  });
}

/** "19:15" (24h slot key) → "07:15 PM" */
export function formatSlot(slot) {
  const [h, m] = slot.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

/** Relative label used in dashboards: "2h ago", "Yesterday", "3 days ago". */
export function formatRelative(value, now = new Date()) {
  const diffMs = now - toDate(value);
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  const months = Math.round(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

/** "Sara Abdulaziz Al-Muqrin" → "SA" */
export function getInitials(name = '') {
  const parts = name
    .replace(/^(Dr\.|Princess)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1].replace(/^Al-/i, '')[0] : '';
  return `${first}${last}`.toUpperCase();
}

/** "Sara Abdulaziz Al-Muqrin" → "Sara" */
export function getFirstName(name = '') {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts[0] === 'Dr.' && parts[1]) return `Dr. ${parts[1]}`;
  return parts[0] ?? '';
}

/** "+966 55 491 8832" style display for a Saudi mobile number stored as E.164. */
export function formatSaudiPhone(e164 = '') {
  const digits = e164.replace(/\D/g, '').replace(/^966/, '');
  if (digits.length !== 9) return e164;
  return `+966 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
