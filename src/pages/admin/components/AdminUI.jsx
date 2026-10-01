import { Building2, Check, Database, EyeOff, RotateCcw, Search, ShieldCheck, X } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { TextInput } from '@/components/common/Form';
import { RatingValue } from '@/components/common/Rating';
import { RowSkeleton } from '@/components/common/Skeleton';
import { USE_MOCK_API } from '@/constants/config';
import { cn } from '@/utils/cn';

/**
 * Admin console building blocks layered on the shared dashboard UI
 * (PageHeader, Panel, DataTable) — Stitch clinic dashboard language:
 * champagne status pills, uppercase tracking labels, warm stone rows.
 */

/** PageHeader pills: committee pill with live dot, optional extras and the data-source indicator. */
export function AdminPills({ children }) {
  return (
    <>
      <Badge tone="gold" size="md" uppercase className="gap-1.5 bg-secondary-fixed/40 text-on-secondary-fixed">
        <span className="size-1.5 animate-pulse rounded-full bg-secondary" aria-hidden="true" />
        Riyadh Verification Committee
      </Badge>
      {children}
      <Badge tone="neutral" size="md" icon={Database} className="bg-surface-container text-outline">
        {USE_MOCK_API ? 'Demo data · Mock API' : 'Live API'}
      </Badge>
    </>
  );
}

/** Toolbar row above a table: filters on the left, search on the right; stacks on mobile. */
export function FilterBar({ children, className }) {
  return (
    <div className={cn('mb-space-md flex flex-col gap-space-sm lg:flex-row lg:items-center lg:justify-between', className)}>{children}</div>
  );
}

/** Horizontal chip strip that scrolls instead of wrapping on small screens. */
export function ChipRow({ label, children, className }) {
  return (
    <div role="group" aria-label={label} className={cn('no-scrollbar flex max-w-full gap-2 overflow-x-auto pb-0.5 lg:flex-wrap lg:overflow-visible', className)}>
      {children}
    </div>
  );
}

export function SearchField({ value, onChange, label, placeholder, className }) {
  return (
    <TextInput
      type="search"
      leftIcon={Search}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
      autoComplete="off"
      className={cn('w-full shrink-0 lg:w-72', className)}
      inputClassName="py-2.5"
    />
  );
}

/** Stacked row placeholders while a table loads. */
export function ListSkeleton({ rows = 4, label = 'Loading' }) {
  return (
    <div className="space-y-space-sm" role="status">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <RowSkeleton key={index} />
      ))}
    </div>
  );
}

/** Square image thumbnail with an icon fallback (clinics without a cover yet). */
export function Thumb({ src, alt = '', icon: Icon = Building2, className }) {
  if (!src) {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn('flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-outline', className)}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={cn('size-12 shrink-0 rounded-lg object-cover', className)} />;
}

/** Identity cell: media (avatar / thumbnail) + name (wraps to two lines) + secondary lines. */
export function EntityCell({ media, title, subtitle, meta, className }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3 text-left', className)}>
      {media}
      <div className="min-w-0">
        <p className="line-clamp-2 break-words font-title-md text-title-md text-on-surface">{title}</p>
        {subtitle && <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p>}
        {meta && <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{meta}</p>}
      </div>
    </div>
  );
}

/** Separator between PageHeader meta items; hidden on phones where the items wrap onto their own lines. */
export function MetaDot() {
  return (
    <span className="hidden text-outline-variant sm:inline" aria-hidden="true">
      •
    </span>
  );
}

/** Rating in a table cell; keeps the star icon from collapsing when columns are tight. */
export function RatingCell({ value, count }) {
  return (
    <span className="inline-flex whitespace-nowrap [&_svg]:shrink-0">
      <RatingValue value={value} count={count} size="sm" />
    </span>
  );
}

/** Two-line table cell (primary value + muted detail). */
export function StackedCell({ primary, secondary, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="truncate font-body-sm text-body-sm font-medium text-on-surface">{primary}</p>
      {secondary && <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{secondary}</p>}
    </div>
  );
}

/** Gold overline used for sections inside dialogs ("SUBMITTED DOCUMENTS"). */
export function SectionLabel({ children, className }) {
  return <h3 className={cn('mb-space-sm font-label-md text-label-md uppercase tracking-wider text-secondary', className)}>{children}</h3>;
}

/** Label / value tile for definition lists in dialogs. Wrap in a <dl>. */
export function DetailItem({ label, children, className }) {
  return (
    <div className={cn('min-w-0 rounded-lg bg-surface-container-low p-space-sm', className)}>
      <dt className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</dt>
      <dd className="mt-1 break-words font-body-sm text-body-sm font-medium text-on-surface">{children}</dd>
    </div>
  );
}

/** Icon row (booking review style): tinted circle icon, caps label, value and detail. */
export function DetailRow({ icon: Icon, label, value, detail, className }) {
  return (
    <div className={cn('flex min-w-0 items-start gap-space-sm rounded-lg bg-surface-container-low p-space-sm', className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</p>
        <p className="break-words font-title-md text-title-md text-on-surface">{value}</p>
        {detail && <p className="break-words font-body-sm text-body-sm text-on-surface-variant">{detail}</p>}
      </div>
    </div>
  );
}

/** Champagne policy strip stating a platform business rule. */
export function PolicyNote({ icon: Icon = ShieldCheck, children, className }) {
  return (
    <p className={cn('flex items-start gap-2 rounded-lg bg-secondary-fixed/30 px-4 py-3 font-body-sm text-body-sm text-on-secondary-fixed', className)}>
      <Icon className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

const REVIEW_ACTIONS = {
  pending: [
    { status: 'approved', label: 'Approve', icon: Check, variant: 'primary' },
    { status: 'rejected', label: 'Reject', icon: X, variant: 'danger-soft' },
  ],
  approved: [{ status: 'rejected', label: 'Unpublish', icon: EyeOff, variant: 'soft' }],
  rejected: [{ status: 'approved', label: 'Restore', icon: RotateCcw, variant: 'soft' }],
};

/** Moderation buttons for a review card, by current status. */
export function ReviewDecisionActions({ review, onDecide, note }) {
  const actions = REVIEW_ACTIONS[review.status] ?? [];
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-container-high pt-3">
      <span className="font-label-sm text-label-sm text-on-surface-variant">{note}</span>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.status}
            size="sm"
            variant={action.variant}
            leftIcon={action.icon}
            onClick={() => onDecide(review, action.status)}
            aria-label={`${action.label} review by ${review.author.name}`}
            className="shadow-none"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
