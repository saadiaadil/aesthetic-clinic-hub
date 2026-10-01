import { Link } from 'react-router';
import { BRAND } from '@/constants/brand';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

/** Circular emblem from the Stitch brand mark (dotted plum ring, champagne ring, plum petal). */
export function BrandEmblem({ className }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn('size-8', className)} aria-hidden="true">
      <circle cx="24" cy="24" r="23" stroke="#7E5A65" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
      <circle cx="24" cy="24" r="19" stroke="#C5A059" strokeWidth="1.2" />
      <path d="M24 10 C24 18 16 24 16 24 C16 24 24 30 24 38 C24 30 32 24 32 24 C32 24 24 18 24 10 Z" fill="#7E5A65" />
      <circle cx="24" cy="24" r="2.5" fill="#FAF8F5" />
    </svg>
  );
}

/**
 * Brand lockup: emblem + "Aesthetic Clinic / HUB • RIYADH" wordmark, as in
 * the Stitch brand mark. `inverse` renders on dark surfaces.
 */
export function BrandLogo({ to = ROUTES.home, compact = false, inverse = false, className }) {
  const content = (
    <>
      <BrandEmblem className={compact ? 'size-8' : 'size-9'} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-headline-sm text-[19px] font-semibold leading-[22px] tracking-tight',
            inverse ? 'text-inverse-on-surface' : 'text-primary',
          )}
        >
          {BRAND.wordmarkTop}
        </span>
        <span
          className={cn(
            'font-label-sm text-[9px] uppercase leading-3 tracking-[0.32em]',
            inverse ? 'text-secondary-fixed' : 'text-primary-container',
          )}
        >
          {BRAND.wordmarkBottom}
        </span>
      </span>
    </>
  );
  if (!to) return <span className={cn('inline-flex items-center gap-space-sm', className)}>{content}</span>;
  return (
    <Link to={to} className={cn('inline-flex shrink-0 items-center gap-space-sm', className)} aria-label={`${BRAND.name} home`}>
      {content}
    </Link>
  );
}
