import { useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, Lock, MessageCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { SelectInput } from '@/components/common/Form';
import { Skeleton } from '@/components/common/Skeleton';
import { BRAND } from '@/constants/brand';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { getSlots } from '@/services/appointmentService';
import { useBookingStore } from '@/store/bookingStore';
import { cn } from '@/utils/cn';
import { getUpcomingOpenDays, includedVat } from '@/utils/clinic';
import { fromDateKey } from '@/utils/date';
import { formatPrice, formatSlot } from '@/utils/format';

/**
 * Sticky "Reserve Your Visit" panel from the Stitch clinic profile. Picks
 * practitioner, treatment, date and slot, then hands the selection to the
 * booking flow (bookingStore) for intake and confirmation.
 */
export function BookingDock({ clinic, services, doctors, serviceId, onServiceChange, doctorId, onDoctorChange, id }) {
  const navigate = useNavigate();
  const startBooking = useBookingStore((state) => state.start);
  const days = useMemo(() => getUpcomingOpenDays(clinic.openingHours, 3), [clinic.openingHours]);
  const [dateKey, setDateKey] = useState(days[0]?.key);
  const [slot, setSlot] = useState(null);

  const service = services.find((item) => item.id === serviceId) ?? services[0];
  const eligibleDoctors = doctors.filter((doctor) => service?.doctorIds.includes(doctor.id));
  const { data: slots, isLoading } = useAsync(
    () => (service && dateKey ? getSlots({ clinicId: clinic.id, clinicServiceId: service.id, doctorId, dateKey }) : Promise.resolve([])),
    [clinic.id, service?.id, doctorId, dateKey],
  );
  const available = (slots ?? []).filter((item) => item.status === 'available').slice(0, 6);
  const selectedSlot = available.find((item) => item.slot === slot);

  const proceed = () => {
    startBooking({
      clinicId: clinic.id,
      clinicServiceId: service?.id ?? null,
      doctorId: doctorId === 'any' && selectedSlot?.doctorId ? selectedSlot.doctorId : doctorId,
      dateKey: selectedSlot ? dateKey : null,
      slot: selectedSlot?.slot ?? null,
    });
    navigate(service ? (doctorId ? ROUTES.booking.dateTime : ROUTES.booking.doctor) : ROUTES.booking.service);
  };

  if (!service) {
    return (
      <div id={id} className="rounded-xl bg-surface-container-low p-6 shadow-md">
        <p className="font-body-md text-body-md text-on-surface-variant">This clinic has no bookable treatments listed right now.</p>
      </div>
    );
  }

  return (
    <div id={id} className="scroll-mt-28 space-y-4">
      <div className="space-y-6 rounded-xl bg-surface-container-low p-6 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Reserve Your Visit</h2>
            {clinic.features.instantConfirmation && (
              <Badge tone="gold" shape="tag" className="font-semibold">
                Instant MOH Confirmation
              </Badge>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Select doctor and treatment or schedule preliminary skin assessment.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="dock-doctor" className="block font-label-md text-label-md uppercase tracking-wide text-on-surface">
            Select Practitioner
          </label>
          <SelectInput
            id="dock-doctor"
            surface="surface"
            value={doctorId}
            onChange={(event) => {
              onDoctorChange(event.target.value);
              setSlot(null);
            }}
          >
            {eligibleDoctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} ({doctor.specialization})
              </option>
            ))}
            <option value="any">Next Available Senior Consultant</option>
          </SelectInput>
        </div>

        <div className="space-y-2">
          <label htmlFor="dock-service" className="block font-label-md text-label-md uppercase tracking-wide text-on-surface">
            Selected Treatment
          </label>
          <div className="rounded-lg bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <select
                  id="dock-service"
                  value={service.id}
                  onChange={(event) => {
                    onServiceChange(event.target.value);
                    setSlot(null);
                  }}
                  className="w-full cursor-pointer appearance-none truncate border-0 bg-transparent p-0 font-title-md text-title-md text-on-surface outline-none"
                >
                  {services.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.shortTitle}
                    </option>
                  ))}
                </select>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Duration: {service.durationMinutes} mins</p>
              </div>
              <span className="shrink-0 font-title-lg text-title-lg font-bold text-primary">{formatPrice(service.priceMin)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md uppercase tracking-wide text-on-surface" id="dock-date-label">
              Preferred Date
            </span>
            <span className="font-label-sm text-label-sm text-primary">Riyadh (GMT+3)</span>
          </div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="dock-date-label">
            {days.map((day) => {
              const active = day.key === dateKey;
              return (
                <button
                  key={day.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setDateKey(day.key);
                    setSlot(null);
                  }}
                  className={cn(
                    'rounded-lg p-2.5 text-center font-label-md text-label-md transition-all',
                    active ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-surface-container',
                  )}
                >
                  <span className={cn('block text-[11px]', active ? 'opacity-80' : 'text-on-surface-variant')}>{day.label}</span>
                  <span className="font-bold">{fromDateKey(day.key).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <span className="block font-label-md text-label-md uppercase tracking-wide text-on-surface" id="dock-slot-label">
            Available Slots
          </span>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-9 rounded" />
              ))}
            </div>
          ) : available.length ? (
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="dock-slot-label">
              {available.map((item) => (
                <button
                  key={item.slot}
                  type="button"
                  role="radio"
                  aria-checked={slot === item.slot}
                  onClick={() => setSlot(item.slot)}
                  className={cn(
                    'rounded py-2 text-center font-label-md text-label-md transition-colors',
                    slot === item.slot ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-surface-container',
                  )}
                >
                  {formatSlot(item.slot)}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-surface px-3 py-3 font-body-sm text-body-sm text-on-surface-variant">
              Fully booked on this day — choose another date or “Next Available Senior Consultant”.
            </p>
          )}
        </div>

        <div className="space-y-4 pt-4">
          <dl className="space-y-2 font-body-sm text-body-sm text-on-surface-variant">
            <div className="flex justify-between">
              <dt>Treatment Subtotal</dt>
              <dd className="font-semibold text-on-surface">{formatPrice(service.priceMin)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Consultation Assessment</dt>
              <dd className="text-right font-semibold text-emerald-700">Complimentary with Procedure</dd>
            </div>
            <div className="flex justify-between">
              <dt>VAT (15%)</dt>
              <dd className="font-semibold text-on-surface">Included ({formatPrice(includedVat(service.priceMin))})</dd>
            </div>
            <div className="flex justify-between pt-2 font-title-lg text-title-lg text-on-surface">
              <dt>Total Due at Clinic</dt>
              <dd className="font-bold text-primary">{formatPrice(service.priceMin)}</dd>
            </div>
          </dl>
          <Button onClick={proceed} rightIcon={ArrowRight} fullWidth size="lg" className="py-3.5 hover:bg-primary-container">
            {selectedSlot ? 'Proceed to Instant Booking' : 'Continue to Booking'}
          </Button>
          <p className="flex items-center justify-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
            <Lock className="size-4 text-emerald-700" aria-hidden="true" />
            Zero cancellation fee up to 24 hours prior
          </p>
        </div>

        <a
          href={`https://wa.me/${clinic.whatsapp ?? BRAND.whatsappHref.split('/').pop()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-between rounded-lg bg-surface px-4 py-3 text-on-surface transition-colors hover:bg-surface-container"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <MessageCircle className="size-[18px]" aria-hidden="true" />
            </span>
            <span className="text-left">
              <span className="block font-label-md text-label-md font-bold">WhatsApp Concierge</span>
              <span className="block font-label-sm text-label-sm text-on-surface-variant">Private coordinator response &lt;5 mins</span>
            </span>
          </span>
          <ChevronRight className="size-[18px] text-on-surface-variant" aria-hidden="true" />
        </a>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-surface-container-low p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed/50 text-secondary">
          <Shield className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-label-md text-label-md font-bold text-on-surface">Confidential Care Guarantee</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Protected health records adhering strictly to Saudi Health Information Exchange regulations.</p>
        </div>
      </div>
    </div>
  );
}
