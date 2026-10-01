import { forwardRef } from 'react';
import { Link } from 'react-router';
import { cn } from '@/utils/cn';

/**
 * Round icon-only button (Stitch header search / saved / notifications,
 * carousel arrows, favourite hearts on images). `label` is required and
 * becomes the accessible name.
 */
const VARIANTS = {
  ghost: 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  soft: 'bg-surface-container text-on-surface hover:bg-surface-container-high',
  glass: 'bg-surface/80 text-on-surface-variant shadow-sm backdrop-blur-md hover:text-primary',
  primary: 'bg-primary text-on-primary hover:bg-tertiary',
};

const SIZES = { sm: 'size-8', md: 'size-9', lg: 'size-10' };

export const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 'lg', badge, dot = false, to, className, iconClassName, ...props },
  ref,
) {
  const classes = cn(
    'relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
  const content = (
    <>
      <Icon className={cn('size-5', iconClassName)} aria-hidden="true" />
      {badge ? (
        <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary font-label-sm text-[9px] text-on-primary">
          {badge}
        </span>
      ) : null}
      {dot && <span className="absolute right-2 top-2 size-2 rounded-full bg-secondary" />}
    </>
  );
  if (to) {
    return (
      <Link ref={ref} to={to} aria-label={label} title={label} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} type="button" aria-label={label} title={label} className={classes} {...props}>
      {content}
    </button>
  );
});
