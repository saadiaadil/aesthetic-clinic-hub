import { cn } from '@/utils/cn';

/**
 * Page-width container: Stitch uses a 1280px canvas with 3rem desktop and
 * 1.25rem mobile margins (DESIGN.md "Layout & Spacing").
 */
export function Container({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag className={cn('mx-auto w-full max-w-page px-margin-mobile md:px-margin', className)} {...props}>
      {children}
    </Tag>
  );
}

/** Uppercase champagne overline used above section titles. */
export function Overline({ className, withRule = false, children }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-widest text-secondary', className)}>
      {children}
      {withRule && <span className="h-px w-8 bg-secondary" aria-hidden="true" />}
    </span>
  );
}

/**
 * Section heading: overline + Playfair title + optional description and
 * right-aligned action (Stitch "Curated Aesthetic Specialties", "Premier
 * Medical Aesthetic Centers" …).
 */
export function SectionHeading({
  overline,
  title,
  description,
  action,
  as: Tag = 'h2',
  size = 'lg',
  align = 'left',
  withRule = false,
  className,
}) {
  const titleClass = {
    display: 'font-display-md text-display-md-mobile md:text-display-md',
    lg: 'font-headline-lg text-headline-md md:text-headline-lg',
    md: 'font-headline-md text-headline-md',
    sm: 'font-headline-sm text-headline-sm',
  }[size];
  return (
    <div
      className={cn(
        'flex gap-space-md',
        align === 'center' ? 'mx-auto max-w-2xl flex-col items-center text-center' : 'flex-col md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn(align === 'center' && 'flex flex-col items-center')}>
        {overline && (
          <Overline withRule={withRule} className="mb-2">
            {overline}
          </Overline>
        )}
        <Tag className={cn(titleClass, 'text-on-surface')}>{title}</Tag>
        {description && <p className="mt-2 max-w-xl font-body-md text-body-md text-on-surface-variant">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
