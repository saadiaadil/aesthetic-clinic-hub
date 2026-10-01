import { Moon, Sun, Sunrise } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/utils/cn';
import { slotPeriod } from '@/utils/date';
import { formatSlot } from '@/utils/format';

const PERIODS = [
  { key: 'morning', label: 'Morning Sessions', icon: Sunrise },
  { key: 'afternoon', label: 'Afternoon Sessions', icon: Sun },
  { key: 'evening', label: 'Evening Sessions', icon: Moon },
];

/**
 * Stitch "Available Time Slots": grouped Morning / Afternoon / Evening, with
 * available, selected ("Selected") and booked/reserved (disabled) states.
 */
export function TimeSlotGrid({ slots, value, onChange, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-space-xs sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-12" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-space-sm">
      {PERIODS.map((period) => {
        const items = slots.filter((slot) => slotPeriod(slot.slot) === period.key);
        if (!items.length) return null;
        return (
          <div key={period.key} className="space-y-space-xs" role="radiogroup" aria-label={period.label}>
            <p className="flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              <period.icon className="size-[15px] text-secondary" aria-hidden="true" />
              {period.label}
            </p>
            <div className="grid grid-cols-2 gap-space-xs sm:grid-cols-4">
              {items.map((item) => {
                const selected = item.slot === value;
                const unavailable = item.status !== 'available';
                return (
                  <button
                    key={item.slot}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={unavailable}
                    onClick={() => onChange(item)}
                    className={cn(
                      'rounded-lg px-4 py-3 text-center font-title-md text-body-sm transition-all',
                      !unavailable && !selected && 'bg-surface-container text-on-surface hover:bg-surface-container-high',
                      unavailable && 'cursor-not-allowed bg-surface-container-highest text-outline opacity-50',
                      selected && 'bg-primary font-semibold text-on-primary shadow-md ring-2 ring-secondary',
                    )}
                  >
                    {formatSlot(item.slot)}
                    {(unavailable || selected) && (
                      <span className={cn('block text-[10px] uppercase tracking-wider', selected && 'text-primary-fixed')}>
                        {selected ? 'Selected' : item.status === 'reserved' ? 'Reserved' : 'Booked'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
