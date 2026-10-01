import { useEffect } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Outlet, useLocation } from 'react-router';
import { BookingStepper } from '@/components/appointment/BookingStepper';
import { Container } from '@/components/common/Layout';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { getClinicById } from '@/services/clinicService';
import { useBookingStore } from '@/store/bookingStore';
import { BOOKING_STEPS } from '@/utils/booking';
import { fromDateKey } from '@/utils/date';
import { formatShortDate, formatSlot } from '@/utils/format';

/**
 * Booking flow shell — Stitch "Top Stepper Banner" (VIP CONCIERGE • CLINIC •
 * CONFIDENTIAL INTAKE, MOH license pill, 5-step stepper). Loads the selected
 * clinic once and shares it with every step through the outlet context.
 */
export default function BookingLayout() {
  const booking = useBookingStore();
  const { pathname } = useLocation();
  const isSuccess = pathname === ROUTES.booking.success;

  // A finished booking is cleared as soon as the patient starts browsing steps again.
  useEffect(() => {
    const keep = [ROUTES.booking.root, ROUTES.booking.confirmation, ROUTES.booking.success];
    if (booking.confirmedAppointmentId && !keep.includes(pathname)) useBookingStore.getState().reset();
  }, [booking.confirmedAppointmentId, pathname]);
  const { data: clinic, isLoading, error, reload } = useAsync(
    () => (booking.clinicId ? getClinicById(booking.clinicId) : Promise.resolve(null)),
    [booking.clinicId],
  );

  const service = clinic?.services.find((item) => item.id === booking.clinicServiceId) ?? null;
  const doctor = booking.doctorId && booking.doctorId !== 'any' ? clinic?.doctors.find((item) => item.id === booking.doctorId) ?? null : null;
  const activeKey = isSuccess ? 'confirmation' : BOOKING_STEPS.find((step) => pathname === step.path)?.key ?? 'clinic';

  const values = {
    clinic: clinic?.name,
    service: service?.shortTitle,
    doctor: doctor?.name ?? (booking.doctorId === 'any' ? 'Next available' : null),
    dateTime: booking.dateKey && booking.slot ? `${formatShortDate(fromDateKey(booking.dateKey))} · ${formatSlot(booking.slot)}` : null,
  };
  const steps = BOOKING_STEPS.map((step) => ({ ...step, complete: step.isComplete(booking), value: values[step.key] }));

  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-surface-container-low py-space-md">
        <Container>
          <div className="flex items-center justify-between gap-3 pb-space-sm">
            <div className="flex min-w-0 flex-wrap items-center gap-space-xs font-label-md text-label-md uppercase text-on-surface-variant">
              <span className="font-semibold text-secondary">VIP Concierge</span>
              <span aria-hidden="true">•</span>
              <span className="truncate">{clinic?.name ?? 'Verified Riyadh Clinics'}</span>
              <span aria-hidden="true">•</span>
              <span className="font-semibold text-primary">Confidential Intake</span>
            </div>
            {clinic && (
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-secondary-fixed/50 px-3 py-1 font-label-sm text-label-sm text-on-secondary-fixed sm:flex">
                <BadgeCheck className="size-3.5 text-secondary" aria-hidden="true" />
                MOH License #{clinic.licenseNumber.replace(/^MOH-/, '')}
              </span>
            )}
          </div>
          <BookingStepper steps={steps} activeKey={activeKey} />
        </Container>
      </section>
      <Outlet context={{ booking, clinic, service, doctor, clinicLoading: isLoading, clinicError: error, reloadClinic: reload }} />
    </div>
  );
}
