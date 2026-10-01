import { Check } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/utils/cn';

/**
 * Stitch 5-step booking stepper. Completed steps show a check and the chosen
 * value ("Profhilo 2ml", "Dr. Reem Al-Saud") and link back for editing;
 * the active step is plum; upcoming steps are muted.
 */
export function BookingStepper({ steps, activeKey }) {
  const activeIndex = steps.findIndex((step) => step.key === activeKey);
  return (
    <nav aria-label="Booking progress">
      <ol className="grid grid-cols-2 gap-space-xs pt-1 sm:grid-cols-3 md:grid-cols-5">
        {steps.map((step, index) => {
          const active = index === activeIndex;
          const done = index < activeIndex && step.complete;
          const content = (
            <>
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full font-label-sm text-label-sm',
                  active && 'bg-on-primary font-bold text-primary',
                  done && 'bg-primary-container text-on-primary-container',
                  !active && !done && 'bg-surface-container-highest text-on-surface-variant',
                )}
              >
                {done ? <Check className="size-4" aria-hidden="true" /> : String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className={cn('block font-label-sm text-label-sm uppercase tracking-wider', active ? 'text-primary-fixed' : 'text-on-surface-variant')}>
                  {active ? 'Active' : `Step ${String(index + 1).padStart(2, '0')}`}
                </span>
                <span className={cn('block truncate font-title-md text-body-sm', active ? 'font-semibold text-on-primary' : 'font-medium text-on-surface')}>
                  {done && step.value ? step.value : step.label}
                </span>
              </span>
            </>
          );
          const className = cn(
            'flex items-center gap-3 rounded-lg p-3 transition-all',
            active && 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20',
            done && 'bg-surface-container hover:bg-surface-container-high',
            !active && !done && 'bg-surface-container opacity-70',
            index === steps.length - 1 && !active && 'hidden md:flex',
          );
          return (
            <li key={step.key} aria-current={active ? 'step' : undefined} className="contents">
              {done ? (
                <Link to={step.path} className={className} aria-label={`Edit ${step.label}: ${step.value ?? ''}`}>
                  {content}
                </Link>
              ) : (
                <div className={className}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
