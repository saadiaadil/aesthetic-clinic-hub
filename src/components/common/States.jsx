import { CircleAlert, LoaderCircle, RefreshCw, SearchX } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GENERIC_ERROR_MESSAGE } from '@/services/apiClient';
import { Button } from './Button';

/**
 * Loading / empty / error foundations in the Stitch visual language:
 * soft surface-container panel, circular tinted icon, Playfair title.
 */

export function Spinner({ className, label = 'Loading' }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-primary', className)}>
      <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-3 py-space-xl text-center', className)}>
      <LoaderCircle className="size-7 animate-spin text-primary" aria-hidden="true" />
      <p className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = SearchX, title, titleAs: Title = 'h3', description, action, compact = false, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl bg-surface-container-low text-center',
        compact ? 'gap-2 px-space-md py-space-lg' : 'gap-3 px-space-lg py-space-xl',
        className,
      )}
    >
      <span className={cn('flex items-center justify-center rounded-full bg-surface-container text-primary', compact ? 'size-11' : 'size-14')}>
        <Icon className={compact ? 'size-5' : 'size-6'} aria-hidden="true" />
      </span>
      <Title className={cn('text-on-surface', compact ? 'font-title-lg text-title-lg' : 'font-headline-sm text-headline-sm')}>{title}</Title>
      {description && <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'We couldn’t load this', titleAs: Title = 'h3', error, onRetry, compact = false, className }) {
  const message = error?.message || GENERIC_ERROR_MESSAGE;
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl bg-surface-container-low text-center',
        compact ? 'gap-2 px-space-md py-space-lg' : 'gap-3 px-space-lg py-space-xl',
        className,
      )}
    >
      <span className={cn('flex items-center justify-center rounded-full bg-error-container text-on-error-container', compact ? 'size-11' : 'size-14')}>
        <CircleAlert className={compact ? 'size-5' : 'size-6'} aria-hidden="true" />
      </span>
      <Title className={cn('text-on-surface', compact ? 'font-title-lg text-title-lg' : 'font-headline-sm text-headline-sm')}>{title}</Title>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{message}</p>
      {onRetry && (
        <div className="pt-2">
          <Button variant="soft" size="sm" leftIcon={RefreshCw} onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

/** Inline form-level error banner (e.g. "Invalid email or password"). */
export function FormAlert({ tone = 'error', children, className }) {
  if (!children) return null;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-lg px-4 py-3 font-body-sm text-body-sm',
        tone === 'error' ? 'bg-error-container/70 text-on-error-container' : 'bg-secondary-fixed/40 text-on-secondary-fixed',
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-4" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
