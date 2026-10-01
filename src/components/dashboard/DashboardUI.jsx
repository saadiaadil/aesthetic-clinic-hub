import { cn } from '@/utils/cn';

/**
 * Dashboard building blocks from the Stitch clinic management screen.
 */

/** Page header: status pills, Playfair title (plum), meta line and action cluster. */
export function PageHeader({ pills, title, meta, actions, className }) {
  return (
    <section className={cn('flex flex-col justify-between gap-space-md pb-space-xs xl:flex-row xl:items-end', className)}>
      <div className="flex min-w-0 flex-col gap-space-xs">
        {pills && <div className="flex flex-wrap items-center gap-space-xs">{pills}</div>}
        <h1 className="font-headline-lg text-headline-md tracking-tight text-primary sm:text-headline-lg">{title}</h1>
        {meta && <div className="flex flex-wrap items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-space-xs sm:gap-space-sm">{actions}</div>}
    </section>
  );
}

/** White card container with optional header (title, subtitle, right action). */
export function Panel({ title, subtitle, action, titleAs: TitleTag = 'h2', titleSize = 'headline', className, bodyClassName, children }) {
  return (
    <section className={cn('flex min-w-0 flex-col rounded-xl bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg', className)}>
      {(title || action) && (
        <div className="mb-space-md flex flex-col justify-between gap-space-sm sm:flex-row sm:items-center">
          <div className="min-w-0">
            {title && (
              <TitleTag
                className={cn(
                  'flex items-center gap-2 text-on-surface',
                  titleSize === 'headline' ? 'font-headline-sm text-headline-sm' : 'font-title-lg text-title-lg font-semibold',
                )}
              >
                {title}
              </TitleTag>
            )}
            {subtitle && <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p>}
          </div>
          {action && <div className="min-w-0 max-w-full self-start sm:shrink-0 sm:self-auto">{action}</div>}
        </div>
      )}
      <div className={cn('min-w-0', bodyClassName)}>{children}</div>
    </section>
  );
}

const GLOWS = {
  gold: 'bg-secondary-fixed/20',
  plum: 'bg-primary-fixed/20',
  champagne: 'bg-secondary-container/20',
  blush: 'bg-tertiary-fixed/30',
};

/** KPI tile ("Today's Appointments 18 · 100% Slot Target"). */
export function StatCard({ label, value, unit, accent, icon: Icon, iconTone = 'primary', glow = 'gold', footer, className }) {
  return (
    <div className={cn('group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm transition-shadow hover:shadow-md', className)}>
      <div className={cn('pointer-events-none absolute -right-6 -top-6 size-24 rounded-full transition-transform duration-500 group-hover:scale-125', GLOWS[glow])} />
      <div className="relative flex items-start justify-between gap-2">
        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">{label}</span>
        {Icon && (
          <span className={cn('rounded-lg bg-surface-container p-2', iconTone === 'secondary' ? 'text-secondary' : 'text-primary')}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="relative mt-4 flex items-baseline gap-2">
        <span className="font-headline-lg text-headline-lg text-on-surface">{value}</span>
        {unit && <span className="font-body-sm text-body-sm font-semibold text-secondary">{unit}</span>}
        {accent && <span className="font-label-sm text-label-sm font-semibold text-secondary">{accent}</span>}
      </div>
      {footer && <div className="relative mt-3 font-body-sm text-body-sm text-on-surface-variant">{footer}</div>}
    </div>
  );
}

/**
 * Responsive data table: a real <table> from md up, stacked cards on mobile
 * (DESIGN.md: tables become cards or scroll on small screens).
 * columns: [{ key, header, render(row), className, mobileLabel }] — mobileLabel: false hides the label on mobile cards.
 */
export function DataTable({ columns, rows, rowKey = 'id', empty, caption }) {
  if (!rows.length) return empty ?? null;
  return (
    <>
      <div className="relative hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn('px-4 pb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant', column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[rowKey]} className="bg-surface-container-low transition-colors hover:bg-surface-container">
                {columns.map((column, index) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3 align-middle font-body-sm text-body-sm text-on-surface',
                      index === 0 && 'rounded-l-lg',
                      index === columns.length - 1 && 'rounded-r-lg',
                      column.className,
                    )}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-space-sm md:hidden">
        {rows.map((row) => (
          <li key={row[rowKey]} className="space-y-2 rounded-xl bg-surface-container-low p-space-sm">
            {columns.map((column) => (
              <div key={column.key} className="flex items-start justify-between gap-3">
                {column.header && column.mobileLabel !== false && (
                  <span className="shrink-0 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{column.mobileLabel ?? column.header}</span>
                )}
                <div className={cn('min-w-0 text-right font-body-sm text-body-sm text-on-surface', (!column.header || column.mobileLabel === false) && 'w-full text-left')}>
                  {column.render ? column.render(row) : row[column.key]}
                </div>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Simple horizontal bar (rating breakdown, capacity SLA, status mix). */
export function ProgressBar({ value, max = 100, tone = 'primary', className, label }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high', className)}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cn('h-full rounded-full', tone === 'secondary' ? 'bg-secondary' : tone === 'error' ? 'bg-error' : 'bg-primary')} style={{ width: `${percent}%` }} />
    </div>
  );
}
