import { Container, Overline } from '@/components/common/Layout';

/** Booking step workspace: 7-column content + 5-column sticky summary (Stitch 12-column layout). */
export function BookingWorkspace({ overline, title, description, aside, children }) {
  return (
    <Container as="section" className="py-space-xl">
      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-space-lg lg:col-span-7">
          {(overline || title) && (
            <div className="space-y-1">
              {overline && <Overline className="font-label-md text-label-md font-semibold">{overline}</Overline>}
              <h1 className="font-headline-lg text-headline-md text-on-surface sm:text-headline-lg">{title}</h1>
              {description && <p className="font-body-md text-body-md text-on-surface-variant">{description}</p>}
            </div>
          )}
          {children}
        </div>
        <aside className="lg:sticky lg:top-28 lg:col-span-5" aria-label="Booking summary">
          {aside}
        </aside>
      </div>
    </Container>
  );
}
