import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { useAsync } from '@/hooks/useAsync';
import { getMonthAvailability } from '@/services/appointmentService';
import { cn } from '@/utils/cn';
import { fromDateKey, monthLabel, todayKey, WEEKDAYS, WEEKDAYS_SHORT } from '@/utils/date';

/**
 * Stitch booking calendar: Sunday-first month grid with available, fully
 * booked and selected states, month navigation and a legend. Availability
 * comes from the appointment service (doctor schedules, leave, bookings).
 */
export function BookingCalendar({ clinicId, clinicServiceId, doctorId, value, onChange }) {
  const start = fromDateKey(value ?? todayKey());
  const [cursor, setCursor] = useState({ year: start.getFullYear(), month: start.getMonth() });
  const today = fromDateKey(todayKey());
  const isCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth();
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const atMax = new Date(cursor.year, cursor.month, 1) >= maxMonth;

  const { data: days, isLoading } = useAsync(
    () => getMonthAvailability({ clinicId, clinicServiceId, doctorId, year: cursor.year, month: cursor.month }),
    [clinicId, clinicServiceId, doctorId, cursor.year, cursor.month],
    { keepPreviousData: true },
  );

  const move = (delta) =>
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  return (
    <div className="space-y-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <CalendarDays className="size-[22px] text-primary" aria-hidden="true" />
          <h2 className="font-headline-sm text-headline-sm text-on-surface" aria-live="polite">
            {monthLabel(cursor.year, cursor.month)}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={isCurrentMonth}
            aria-label="Previous month"
            className="flex size-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-40"
          >
            <ChevronLeft className="size-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={atMax}
            aria-label="Next month"
            className="flex size-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-40"
          >
            <ChevronRight className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 py-1 text-center font-label-md text-label-md text-on-surface-variant" aria-hidden="true">
        {WEEKDAYS_SHORT.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      {isLoading && !days ? (
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }, (_, index) => (
            <Skeleton key={index} className="h-10" />
          ))}
        </div>
      ) : (
        <div className={cn('grid grid-cols-7 gap-1.5 text-center font-body-sm text-body-sm transition-opacity', isLoading && 'opacity-60')} role="grid" aria-label="Choose a date">
          {days?.map((day) => {
            const selected = day.key === value;
            const selectable = day.inMonth && day.status === 'available';
            const date = fromDateKey(day.key);
            const label = `${WEEKDAYS[date.getDay()]} ${day.day} ${monthLabel(date.getFullYear(), date.getMonth())}, ${
              day.status === 'available' ? 'available' : day.status === 'full' ? 'fully booked' : 'unavailable'
            }`;
            return (
              <button
                key={day.key}
                type="button"
                role="gridcell"
                aria-selected={selected}
                aria-label={label}
                disabled={!selectable}
                onClick={() => onChange(day.key)}
                className={cn(
                  'rounded-lg py-2.5 transition-colors',
                  !day.inMonth && 'invisible',
                  selectable && !selected && 'text-on-surface-variant hover:bg-surface-container',
                  !selectable && day.inMonth && 'cursor-not-allowed text-outline-variant opacity-50',
                  day.status === 'full' && day.inMonth && 'line-through decoration-outline-variant',
                  selected && 'bg-primary font-bold text-on-primary shadow-md ring-2 ring-secondary/40',
                )}
              >
                {day.day}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-space-md pt-2 font-label-sm text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary" /> Selected Day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-surface-container-highest" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-outline-variant opacity-40" /> Fully Booked / Closed
        </span>
      </div>
    </div>
  );
}
