/**
 * Builds an .ics (iCalendar) file for "Add to calendar" after booking.
 */
function toIcsDate(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function downloadIcs({ id, title, description, location, start, durationMinutes }) {
  const end = new Date(new Date(start).getTime() + durationMinutes * 60000).toISOString();
  const escape = (text = '') => text.replace(/[,;\\]/g, (match) => `\\${match}`).replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aesthetic Clinic Hub//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${id}@aestheticclinichub.sa`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escape(title)}`,
    `DESCRIPTION:${escape(description)}`,
    `LOCATION:${escape(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `appointment-${id}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
