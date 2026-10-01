import { BadgeCheck, Building2, CalendarCheck, Headset, MapPin, UsersRound } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { BRAND } from '@/constants/brand';
import { includedVat } from '@/utils/clinic';
import { formatLongDate, formatPrice, formatSlot } from '@/utils/format';
import { fromDateKey } from '@/utils/date';

/**
 * Sticky order summary — Stitch booking screen right column: clinic header,
 * specialist card, procedure detail, reserved date badge, VAT-inclusive
 * price matrix, then the step's action area (`children`).
 */
export function BookingSummary({ clinic, service, doctor, anySpecialist, dateKey, slot, preferences, loading, children }) {
  if (loading) {
    return (
      <div className="space-y-space-md rounded-xl bg-surface-container-low p-space-md shadow-xl" aria-hidden="true">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="space-y-space-sm rounded-xl bg-surface-container-low p-space-md shadow-xl">
        <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">Your Booking</span>
        <p className="font-headline-sm text-headline-sm text-on-surface">Choose a verified clinic to begin</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Your treatment, specialist, time and transparent price appear here as you go. Nothing is reserved until you confirm.
        </p>
        {children}
      </div>
    );
  }

  const price = service?.priceMin ?? 0;
  return (
    <div className="space-y-space-md">
      <div className="space-y-space-md rounded-xl bg-surface-container-low p-space-md shadow-xl">
        <div className="flex items-center justify-between gap-3 pb-space-xs">
          <div className="min-w-0">
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">Premier Clinic</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{clinic.name}</h3>
            <p className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
              <MapPin className="size-[15px] shrink-0 text-secondary" aria-hidden="true" />
              {clinic.address}
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed/30">
            <Building2 className="size-[22px] text-secondary" aria-hidden="true" />
          </span>
        </div>

        {doctor ? (
          <div className="flex items-center gap-space-md rounded-xl bg-surface-container p-space-sm">
            <Avatar src={doctor.headshot ?? doctor.photo} name={doctor.name} size="xl" ring />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="truncate font-title-lg text-title-lg text-on-surface">{doctor.name}</h4>
                <BadgeCheck className="size-4 shrink-0 text-secondary" aria-label="Verified specialist" />
              </div>
              <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{doctor.headline ?? doctor.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {doctor.badges?.includes('Saudi Board') && <Badge tone="rose">Saudi Board</Badge>}
                {doctor.rating > 0 && (
                  <span className="font-label-sm text-label-sm font-semibold text-secondary">
                    ★ {doctor.rating} ({doctor.reviewCount}+ Reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : anySpecialist ? (
          <div className="flex items-center gap-space-md rounded-xl bg-surface-container p-space-sm">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <UsersRound className="size-7" aria-hidden="true" />
            </span>
            <div>
              <h4 className="font-title-lg text-title-lg text-on-surface">Next Available Specialist</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">The clinic assigns a senior consultant for your slot.</p>
            </div>
          </div>
        ) : null}

        {service && (
          <div className="space-y-1 rounded-lg bg-surface-container p-space-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-title-md text-title-md text-on-surface">{service.shortTitle}</span>
              <span className="shrink-0 font-title-md text-title-md font-bold text-primary">{formatPrice(price)}</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{service.description}</p>
          </div>
        )}

        {dateKey && slot && (
          <div className="flex items-center gap-space-sm rounded-lg bg-secondary-fixed/30 p-3 text-on-secondary-fixed">
            <CalendarCheck className="size-5 text-secondary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-title-md text-body-sm font-semibold">{formatLongDate(fromDateKey(dateKey))}</p>
              <p className="font-body-sm text-label-sm text-on-secondary-fixed-variant">
                {formatSlot(slot)} AST{preferences?.privateSuite ? ' • Private VIP Suite' : ''}
              </p>
            </div>
          </div>
        )}

        {service && (
          <dl className="space-y-2 pt-2">
            <div className="flex justify-between gap-3 font-body-sm text-body-sm text-on-surface-variant">
              <dt>Treatment Procedure</dt>
              <dd className="font-medium text-on-surface">{formatPrice(price)}</dd>
            </div>
            <div className="flex justify-between gap-3 font-body-sm text-body-sm text-on-surface-variant">
              <dt>Consultant Evaluation & 3D Imaging</dt>
              <dd className="text-[12px] font-semibold uppercase text-secondary">Complimentary</dd>
            </div>
            <div className="flex justify-between gap-3 font-body-sm text-body-sm text-on-surface-variant">
              <dt>Saudi VAT (15%, included)</dt>
              <dd className="font-medium text-on-surface">{formatPrice(includedVat(price))}</dd>
            </div>
            <div className="flex items-baseline justify-between pt-3 font-title-lg text-title-lg text-on-surface">
              <dt>Total Payable</dt>
              <dd className="text-right">
                <span className="font-headline-md text-headline-md font-semibold text-primary">{price.toLocaleString('en-US')}</span>
                <span className="ml-1 font-label-md text-label-md text-secondary">SAR</span>
              </dd>
            </div>
          </dl>
        )}

        {children}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container p-space-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-secondary-fixed/50 text-secondary">
            <Headset className="size-[18px]" aria-hidden="true" />
          </span>
          <div>
            <p className="font-title-md text-body-sm text-on-surface">Need Private Concierge Help?</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Instant WhatsApp assistance available 24/7</p>
          </div>
        </div>
        <a
          href={BRAND.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-surface px-3 py-1.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
        >
          Chat Now
        </a>
      </div>
    </div>
  );
}
