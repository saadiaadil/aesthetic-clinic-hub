import { CalendarPlus, CircleCheck, Hourglass, MapPin, MessageCircle } from 'lucide-react';
import { Navigate } from 'react-router';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Layout';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getAppointmentById } from '@/services/appointmentService';
import { useBookingStore } from '@/store/bookingStore';
import { downloadIcs } from '@/utils/calendar';
import { fromDateKey } from '@/utils/date';
import { formatLongDate, formatPrice, formatSlot } from '@/utils/format';

/** Booking success — confirmation of the created appointment with next steps. */
export default function BookingSuccessPage() {
  useDocumentTitle('Appointment Reserved');
  const { user } = useAuth();
  const appointmentId = useBookingStore((state) => state.confirmedAppointmentId);
  const { data: appointment, isLoading, error, reload } = useAsync(
    () => (appointmentId ? getAppointmentById(appointmentId, { userId: user.id }) : Promise.resolve(null)),
    [appointmentId],
  );

  if (!appointmentId) return <Navigate to={ROUTES.booking.root} replace />;

  if (isLoading) {
    return (
      <Container className="max-w-3xl space-y-4 py-space-xl" aria-hidden="true">
        <Skeleton className="mx-auto size-16 rounded-full" />
        <Skeleton className="mx-auto h-10 w-2/3" />
        <Skeleton className="h-56 w-full" />
      </Container>
    );
  }
  if (error) return <Container className="py-space-xl"><ErrorState error={error} onRetry={reload} /></Container>;

  const confirmed = appointment.status === 'confirmed';
  const addToCalendar = () =>
    downloadIcs({
      id: appointment.id,
      title: `${appointment.service.shortTitle} — ${appointment.clinic.name}`,
      description: `With ${appointment.doctor?.name}. Booked via Aesthetic Clinic Hub.`,
      location: appointment.clinic.address,
      start: appointment.scheduledAt,
      durationMinutes: appointment.durationMinutes,
    });

  return (
    <Container as="section" className="max-w-3xl py-space-xl">
      <div className="flex flex-col items-center text-center">
        <span className={confirmed ? 'flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700' : 'flex size-16 items-center justify-center rounded-full bg-secondary-fixed/50 text-secondary'}>
          {confirmed ? <CircleCheck className="size-8" aria-hidden="true" /> : <Hourglass className="size-8" aria-hidden="true" />}
        </span>
        <p className="mt-space-md font-label-sm text-label-sm uppercase tracking-widest text-secondary">{confirmed ? 'Instant Confirmation' : 'Request Received'}</p>
        <h1 className="mt-1 font-display-md text-display-md-mobile text-on-surface md:text-display-md">
          {confirmed ? 'Your sanctuary slot is reserved.' : 'Your request is with the clinic.'}
        </h1>
        <p className="mt-2 max-w-xl font-body-lg text-body-lg text-on-surface-variant">
          {confirmed
            ? `${appointment.clinic.name} has confirmed your appointment. A WhatsApp confirmation with prep instructions is on its way.`
            : `${appointment.clinic.name} will confirm your requested time shortly. We will notify you by WhatsApp and in your dashboard.`}
        </p>
      </div>

      <div className="mt-space-lg space-y-space-md rounded-2xl bg-surface-container-low p-space-md shadow-md sm:p-space-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Reference</p>
            <p className="font-title-lg text-title-lg text-on-surface">{appointment.id.toUpperCase()}</p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>
        <div className="flex items-center gap-space-md rounded-xl bg-surface p-space-sm">
          <Avatar src={appointment.doctor?.headshot} name={appointment.doctor?.name ?? ''} size="lg" />
          <div className="min-w-0">
            <p className="font-title-md text-title-md text-on-surface">{appointment.service.title}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {appointment.doctor?.name} • {formatPrice(appointment.priceCharged)} (VAT incl.)
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
          <div className="rounded-lg bg-secondary-fixed/30 p-3 text-on-secondary-fixed">
            <p className="font-title-md text-body-sm font-semibold">{formatLongDate(fromDateKey(appointment.dateKey))}</p>
            <p className="font-body-sm text-label-sm text-on-secondary-fixed-variant">{formatSlot(appointment.slot)} AST • {appointment.durationMinutes} mins</p>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-surface p-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              <span className="block font-semibold text-on-surface">{appointment.clinic.name}</span>
              {appointment.clinic.address}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-space-sm sm:flex-row">
          <Button to={ROUTES.patient.appointment(appointment.id)} className="flex-1">
            View appointment
          </Button>
          <Button variant="soft" leftIcon={CalendarPlus} onClick={addToCalendar} className="flex-1">
            Add to calendar
          </Button>
          <Button variant="soft" leftIcon={MessageCircle} href={`https://wa.me/${appointment.clinic.contactNo.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="flex-1">
            WhatsApp clinic
          </Button>
        </div>
      </div>

      <div className="mt-space-lg flex flex-wrap justify-center gap-space-sm">
        <Button to={ROUTES.clinics} variant="ghost">
          Explore more clinics
        </Button>
        <Button to={ROUTES.patient.appointments} variant="ghost">
          All my appointments
        </Button>
      </div>
    </Container>
  );
}
