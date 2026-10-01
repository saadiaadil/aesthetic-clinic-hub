import { cn } from '@/utils/cn';

/**
 * Pill and tag badges used across Stitch:
 * gold (accreditation / "Doctor Performed"), goldSolid ("Lead Consultant"),
 * plum, plumSolid, rose ("Award Winner"), blush, neutral, surface (signature
 * procedure chips), glass (on imagery), dark (on imagery), success, danger,
 * muted, confirmed.
 */
const TONES = {
  gold: 'bg-secondary-fixed/40 text-secondary',
  goldSolid: 'bg-secondary-fixed text-on-secondary-fixed',
  plum: 'bg-primary/10 text-primary',
  plumSolid: 'bg-primary text-on-primary',
  rose: 'bg-primary-fixed text-on-primary-fixed-variant',
  blush: 'bg-tertiary-fixed text-on-tertiary-fixed',
  neutral: 'bg-surface-container-high text-on-surface-variant',
  surface: 'bg-surface text-on-surface-variant',
  glass: 'bg-surface/85 text-on-surface backdrop-blur-md',
  dark: 'bg-on-background/70 text-surface backdrop-blur-md',
  success: 'bg-emerald-50 text-emerald-800',
  danger: 'bg-error-container text-on-error-container',
  muted: 'bg-surface-container-high text-outline',
  confirmed: 'bg-surface-container-high text-on-surface-variant',
};

const SIZES = {
  sm: 'px-2 py-0.5 font-label-sm text-label-sm',
  md: 'px-3 py-1 font-label-sm text-label-sm',
  lg: 'px-3.5 py-1.5 font-label-md text-label-md',
};

export function Badge({ tone = 'neutral', size = 'sm', shape = 'pill', uppercase = false, icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap',
        shape === 'pill' ? 'rounded-full' : 'rounded-md',
        TONES[tone] ?? TONES.neutral,
        SIZES[size],
        uppercase && 'uppercase tracking-wider',
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}
