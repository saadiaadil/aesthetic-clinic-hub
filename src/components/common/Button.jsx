import { forwardRef } from 'react';
import { Link } from 'react-router';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Button variants extracted from the Stitch screens:
 * - primary   plum CTA (Search Clinics, Book, Confirm & Reserve) → hover burgundy
 * - tonal     warm stone (View Profile, Export MOH Report)
 * - soft      light stone (List Clinic, Save Clinic, Propose Time)
 * - plum      plum-container (View Clinic on featured cards)
 * - outline   hairline border (DESIGN.md secondary)
 * - ghost     text-only icon/utility actions
 * - light     ivory on dark/plum surfaces (CTA banners)
 * - gold      champagne (Request VIP Advisor)
 * - luxury    charcoal with champagne hairline (VIP / instant booking)
 * - danger    destructive actions
 */
const VARIANTS = {
  primary: 'bg-primary text-on-primary shadow-md hover:bg-tertiary hover:shadow-lg',
  tonal: 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
  soft: 'bg-surface-container text-on-surface hover:bg-surface-container-high',
  plum: 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary',
  outline: 'border border-outline-variant bg-transparent text-on-surface hover:border-primary-container hover:bg-surface-container',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  light: 'bg-surface text-on-surface shadow-md hover:bg-surface-container',
  gold: 'bg-secondary-fixed text-on-secondary-fixed shadow-md hover:bg-secondary-fixed-dim',
  luxury: 'border border-brand-champagne bg-inverse-surface text-inverse-on-surface hover:bg-on-background',
  danger: 'bg-error text-on-error shadow-md hover:bg-on-error-container',
  'danger-soft': 'bg-error-container text-on-error-container hover:bg-error hover:text-on-error',
};

const SIZES = {
  xs: 'gap-1 rounded-md px-2.5 py-1 font-label-md text-label-md',
  sm: 'gap-1.5 rounded-lg px-3 py-1.5 font-label-md text-label-md',
  md: 'gap-2 rounded-lg px-4 py-2.5 font-title-md text-title-md',
  lg: 'gap-2 rounded-lg px-6 py-3 font-title-md text-title-md',
  xl: 'gap-2 rounded-lg px-8 py-3.5 font-title-md text-title-md',
};

const ICON_SIZES = { xs: 'size-3.5', sm: 'size-4', md: 'size-[18px]', lg: 'size-5', xl: 'size-5' };

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    to,
    href,
    type = 'button',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className,
    children,
    ...props
  },
  ref,
) {
  const classes = cn(
    'group inline-flex items-center justify-center whitespace-nowrap text-center transition-all duration-200',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );
  const iconClass = cn('shrink-0', ICON_SIZES[size]);
  const content = (
    <>
      {loading ? (
        <LoaderCircle className={cn(iconClass, 'animate-spin')} aria-hidden="true" />
      ) : (
        LeftIcon && <LeftIcon className={iconClass} aria-hidden="true" />
      )}
      {children}
      {RightIcon && !loading && (
        <RightIcon className={cn(iconClass, 'transition-transform group-hover:translate-x-0.5')} aria-hidden="true" />
      )}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} aria-disabled={disabled || undefined} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
});
