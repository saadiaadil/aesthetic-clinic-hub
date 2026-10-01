import { Check, Plus } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { cn } from '@/utils/cn';
import { formatPriceRange } from '@/utils/format';

/**
 * Treatment menu row — Stitch clinic profile "Treatment Menu & Transparent
 * Pricing": title + tag, description, duration/downtime highlights, price
 * with note and "+ Select for Booking".
 */
export function ServiceMenuItem({ service, selected = false, onSelect, actionLabel = 'Select for Booking', className }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface-container-low p-6 transition-all duration-300 hover:bg-surface-container',
        className,
        selected && 'bg-surface-container ring-2 ring-primary/40',
      )}
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="max-w-xl space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-title-lg text-title-lg text-on-surface">{service.title}</h3>
            {service.tag && <Badge tone="gold">{service.tag}</Badge>}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{service.description}</p>
          <div className="flex flex-wrap items-center gap-4 pt-1 font-label-sm text-label-sm text-on-surface-variant">
            {service.highlights?.map((item) => (
              <span key={item.label} className="flex items-center gap-1">
                <DynamicIcon name={item.icon} className="size-[15px] text-primary" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 md:flex-col md:items-end md:justify-center">
          <div className="md:text-right">
            <span className="font-headline-sm text-headline-sm font-bold text-primary">{formatPriceRange(service.priceMin, service.priceMax)}</span>
            <span className="block font-label-sm text-label-sm text-on-surface-variant">{service.priceNote}</span>
          </div>
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(service)}
              aria-pressed={selected}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-4 py-2 font-label-md text-label-md transition-all',
                selected ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface hover:bg-primary hover:text-on-primary',
              )}
            >
              {selected ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
              {selected ? 'Selected' : actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
