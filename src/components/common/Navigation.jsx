import { Fragment, useId, useRef } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Breadcrumb trail (Stitch clinic profile sub-header). */
export function Breadcrumb({ items, className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('font-label-md text-label-md text-on-surface-variant', className)}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={item.label}>
              <li>
                {item.to && !last ? (
                  <Link to={item.to} className="transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                ) : (
                  <span className={cn(last && 'font-semibold text-on-surface')} aria-current={last ? 'page' : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
              {!last && (
                <li aria-hidden="true" className="text-[10px] text-outline-variant">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Tabs in the three Stitch styles:
 * - segmented: dashboard queue tabs (Today's (18) · Upcoming · Waitlist …)
 * - chips: clinic profile treatment categories (All Services (6) …)
 * - underline: patient sign-in (Patient Sanctuary | Clinic Portal)
 * Keyboard: arrow keys move between tabs (WAI-ARIA tabs pattern).
 */
export function Tabs({ tabs, value, onChange, variant = 'segmented', label, className, fullWidth = false }) {
  const baseId = useId();
  const listRef = useRef(null);

  const onKeyDown = (event) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.value === value);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    onChange(tabs[next].value);
    listRef.current?.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  const containerClass = {
    segmented: 'inline-flex rounded-lg bg-surface-container p-1',
    chips: 'flex flex-wrap gap-2',
    underline: 'flex items-center gap-space-md border-b border-surface-container-highest',
  }[variant];

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(containerClass, 'no-scrollbar max-w-full overflow-x-auto', fullWidth && variant === 'segmented' && 'flex w-full', className)}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        const tabClass = {
          segmented: cn(
            'shrink-0 whitespace-nowrap rounded-md px-3.5 py-1.5 font-label-md text-label-md transition-all',
            fullWidth && 'flex-1',
            active ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface',
          ),
          chips: cn(
            'shrink-0 whitespace-nowrap rounded-full px-4 py-2 font-label-md text-label-md transition-all',
            active ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
          ),
          underline: cn(
            'relative shrink-0 whitespace-nowrap pb-2 font-title-md text-title-md transition-colors',
            active ? 'font-semibold text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary' : 'text-on-surface-variant hover:text-on-surface',
          ),
        }[variant];
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`${baseId}-${tab.value}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={tabClass}
          >
            {tab.label}
            {tab.count !== undefined && <span className="ml-1 opacity-80">({tab.count})</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Toggle chip (Stitch discovery filter chips: MOH Licensed · Valet Parking …). */
export function FilterChip({ active, onClick, icon: Icon, iconNode, children, className }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 font-label-sm text-label-sm transition-all',
        active ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest',
        className,
      )}
    >
      {iconNode}
      {Icon && <Icon className="size-[15px]" aria-hidden="true" />}
      {children}
    </button>
  );
}

function pageList(page, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 1, totalPages - 2].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  return sorted.flatMap((p, index) => (index > 0 && p - sorted[index - 1] > 1 ? ['…', p] : [p]));
}

/** Pagination (Stitch discovery footer: ‹ 1 2 3 … 8 ›). */
export function Pagination({ page, totalPages, total, pageSize, onChange, itemLabel = 'results', className }) {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className={cn('flex flex-col items-center justify-between gap-space-md md:flex-row', className)}>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Showing <span className="font-semibold text-on-surface">{from} - {to}</span> of {total} {itemLabel}
      </p>
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="flex size-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-highest disabled:opacity-40"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          {pageList(page, totalPages).map((item, index) =>
            item === '…' ? (
              <span key={`gap-${index}`} className="px-2 text-outline">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  'size-10 rounded-lg font-label-md text-label-md transition-colors',
                  item === page ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-highest',
                )}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="flex size-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-highest disabled:opacity-40"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
