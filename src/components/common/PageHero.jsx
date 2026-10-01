import { BadgeCheck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Container } from './Layout';

/**
 * Editorial page header used by list pages (Stitch discovery header:
 * alabaster band, warm ambient glows, champagne pill, Playfair display title).
 */
export function PageHero({ pill, title, description, aside, children, className }) {
  return (
    <section className={cn('relative w-full overflow-hidden bg-surface-container-low', className)}>
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
        <div className="absolute -top-32 right-10 size-96 rounded-full bg-secondary-fixed/30 blur-3xl" />
        <div className="absolute -left-20 top-1/2 size-80 rounded-full bg-primary-fixed/25 blur-2xl" />
      </div>
      <Container className="relative z-10 pb-space-lg pt-space-lg">
        <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            {pill && (
              <span className="mb-space-sm inline-flex items-center gap-space-xs rounded-full bg-secondary-fixed/40 px-3 py-1 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                <BadgeCheck className="size-[15px]" aria-hidden="true" />
                {pill}
              </span>
            )}
            <h1 className="mb-space-xs font-display-lg text-display-lg-mobile leading-none tracking-tight text-on-surface md:text-display-lg">{title}</h1>
            {description && <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{description}</p>}
          </div>
          {aside}
        </div>
        {children}
      </Container>
    </section>
  );
}
