import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock, CalendarPlus, ClipboardList, CreditCard, MapPin, MessageCircle, Navigation, PhoneCall, ShieldCheck, Stethoscope, XCircle } from 'lucide-react';
import { useLocation, useParams } from 'react-router';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Breadcrumb } from '@/components/common/Navigation';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CancelAppointmentDialog, RescheduleDialog } from '@/components/appointment/AppointmentDialogs';
import { Panel } from '@/components/dashboard/DashboardUI';
import { ReviewForm } from '@/components/review/ReviewForm';
import { ROUTES } from '@/constants/routes';
import { PAYMENT_METHODS } from '@/constants/status';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { cancelAppointment, getAppointmentById, rescheduleAppointment } from '@/services/appointmentService';
import { createReview } from '@/services/reviewService';
import { downloadIcs } from '@/utils/calendar';
import { includedVat, mapsUrl } from '@/utils/clinic';
import { fromDateKey } from '@/utils/date';
import { formatDate, formatLongDate, formatPrice, formatSaudiPhone, formatSlot } from '@/utils/format';

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</p>
        <div className="font-body-md text-body-md text-on-surface">{children}</div>
      </div>
    </div>
  );
}

export default function PatientAppointmentDetailPage() {
  const { appointmentId } = useParams();
  const { hash } = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const { data: appointment, isLoading, error, reload } = useAsync(() => getAppointmentById(appointmentId, { userId: user.id }), [appointmentId, user.id]);
  useDocumentTitle(appointment?.service?.shortTitle ?? 'Appointment');
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    if (hash === '#review' && appointment) {
      const timer = setTimeout(() => document.getElementById('review')?.scrollIntoView({ behavior: 'smooth' }), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [hash, appointment]);

  if (isLoading) {
    return (
      <div className="space-y-space-md" aria-hidden="true">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-12 w-2/3" />
        <div className="grid gap-space-md lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }
  if (error) {
    return error.status === 404 || error.status === 403 ? (
      <EmptyState title="Appointment not found" description="It may belong to another account or have been removed." action={<Button to={ROUTES.patient.appointments}>Back to my appointments</Button>} />
    ) : (
      <ErrorState error={error} onRetry={reload} />
    );
  }

  const upcoming = ['pending', 'confirmed', 'rescheduled'].includes(appointment.status) && appointment.scheduledAt >= new Date().toISOString();
  const canReview = appointment.status === 'completed' && !appointment.review;
  const payment = PAYMENT_METHODS.find((method) => method.id === appointment.paymentMethod);

  const submitReview = async (values) => {
    await createReview({ userId: user.id, appointmentId: appointment.id, ...values });
    toast.success('Thank you for your review', 'It will be published after moderation.');
    reload();
  };

  return (
    <>
      <Breadcrumb items={[{ label: 'Overview', to: ROUTES.patient.dashboard }, { label: 'My Appointments', to: ROUTES.patient.appointments }, { label: appointment.service.shortTitle }]} />

      <section className="flex flex-col justify-between gap-space-md xl:flex-row xl:items-end">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={appointment.status} />
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Ref. {appointment.id.toUpperCase()}</span>
          </div>
          <h1 className="font-headline-lg text-headline-md text-primary sm:text-headline-lg">{appointment.service.title}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {formatLongDate(fromDateKey(appointment.dateKey))} • {formatSlot(appointment.slot)} Riyadh time • {appointment.durationMinutes} mins
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button to={ROUTES.patient.appointments} variant="ghost" leftIcon={ArrowLeft}>
            Back
          </Button>
          {upcoming && (
            <>
              <Button variant="soft" leftIcon={CalendarClock} onClick={() => setDialog('reschedule')}>
                Reschedule
              </Button>
              <Button variant="danger-soft" leftIcon={XCircle} onClick={() => setDialog('cancel')}>
                Cancel
              </Button>
              <Button
                leftIcon={CalendarPlus}
                onClick={() =>
                  downloadIcs({
                    id: appointment.id,
                    title: `${appointment.service.shortTitle} — ${appointment.clinic.name}`,
                    description: `With ${appointment.doctor.name}`,
                    location: appointment.clinic.address,
                    start: appointment.scheduledAt,
                    durationMinutes: appointment.durationMinutes,
                  })
                }
              >
                Add to calendar
              </Button>
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-space-lg xl:col-span-8">
          <Panel title="Visit Details">
            <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2">
              <Detail icon={Stethoscope} label="Specialist">
                <span className="flex items-center gap-2">
                  <Avatar src={appointment.doctor.headshot} name={appointment.doctor.name} size="sm" />
                  <span>
                    <span className="block font-title-md text-title-md">{appointment.doctor.name}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{appointment.doctor.title}</span>
                  </span>
                </span>
              </Detail>
              <Detail icon={MapPin} label="Clinic">
                <span className="block font-title-md text-title-md">{appointment.clinic.name}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{appointment.clinic.address}</span>
              </Detail>
              <Detail icon={ShieldCheck} label="Discretion Preferences">
                {[appointment.preferences?.privateSuite && 'Private VIP suite & escort', appointment.preferences?.femaleStaff && 'Female practitioner & staff only'].filter(Boolean).join(' • ') || 'Standard arrival'}
              </Detail>
              <Detail icon={CreditCard} label="Settlement">
                {formatPrice(appointment.priceCharged)} • {payment?.label ?? 'Pay at Clinic'}
                <span className="block font-body-sm text-body-sm text-on-surface-variant">VAT (15%) included: {formatPrice(includedVat(appointment.priceCharged))}</span>
              </Detail>
            </div>
            <div className="mt-space-sm">
              <Detail icon={ClipboardList} label="Confidential Medical Intake">
                {appointment.patientNotes || 'No notes provided.'}
              </Detail>
            </div>
            {appointment.status === 'cancelled' && (
              <p className="mt-space-sm rounded-lg bg-error-container/60 px-4 py-3 font-body-sm text-body-sm text-on-error-container">
                Cancelled on {formatDate(appointment.cancelledAt)}
                {appointment.cancellationReason ? ` — ${appointment.cancellationReason}` : ''}.
              </p>
            )}
          </Panel>

          {(canReview || appointment.review) && (
            <Panel title="Your Verified Review" subtitle="Only patients with a completed visit can review — reviews are moderated before publishing.">
              <div id="review" className="scroll-mt-24">
                {appointment.review ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-container-low p-space-sm">
                    <StatusBadge type="review" status={appointment.review.status} />
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      You rated this visit {appointment.review.rating}/5.{' '}
                      {appointment.review.status === 'pending' ? 'It will be published after moderation.' : ''}
                    </p>
                    <Button to={ROUTES.patient.reviews} variant="ghost" size="sm" className="text-primary">
                      My reviews
                    </Button>
                  </div>
                ) : (
                  <ReviewForm onSubmit={submitReview} />
                )}
              </div>
            </Panel>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-space-lg xl:col-span-4">
          <Panel titleSize="title" title="Clinic Contact">
            <img src={appointment.clinic.coverImage} alt="" className="mb-space-sm h-36 w-full rounded-lg object-cover" />
            <div className="space-y-2">
              <Button href={`tel:${appointment.clinic.contactNo}`} variant="soft" fullWidth leftIcon={PhoneCall}>
                {formatSaudiPhone(appointment.clinic.contactNo)}
              </Button>
              <Button href={`https://wa.me/${appointment.clinic.contactNo.replace('+', '')}`} target="_blank" rel="noopener noreferrer" variant="soft" fullWidth leftIcon={MessageCircle}>
                WhatsApp Concierge
              </Button>
              <Button href={mapsUrl(appointment.clinic)} target="_blank" rel="noopener noreferrer" variant="soft" fullWidth leftIcon={Navigation}>
                Get directions
              </Button>
              <Button to={ROUTES.clinic(appointment.clinic.id)} variant="ghost" fullWidth className="text-primary">
                View clinic profile
              </Button>
            </div>
          </Panel>
          <Panel titleSize="title" title={upcoming ? 'Before Your Visit' : 'Aftercare Notes'}>
            <ul className="list-disc space-y-1.5 pl-5 font-body-sm text-body-sm text-on-surface-variant">
              {(upcoming
                ? [
                    'Arrive 10 minutes early with clean, make-up free skin.',
                    'Avoid retinoids and exfoliating acids for 48 hours.',
                    'Bring your National ID / Iqama for MOH record verification.',
                    'Cancel or reschedule free of charge up to 24 hours before.',
                  ]
                : [
                    'Follow the aftercare instructions sent by your clinic on WhatsApp.',
                    'Use SPF 50 daily and avoid saunas for 24–48 hours after skin treatments.',
                    'Contact the clinic directly if you notice unexpected swelling or redness.',
                    'Book your follow-up or maintenance session from the clinic profile.',
                  ]
              ).map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <CancelAppointmentDialog
        appointment={appointment}
        isOpen={dialog === 'cancel'}
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          await cancelAppointment(appointment.id, { userId: user.id, reason });
          toast.success('Appointment cancelled', 'The clinic has been notified.');
          reload();
        }}
      />
      <RescheduleDialog
        appointment={appointment}
        isOpen={dialog === 'reschedule'}
        onClose={() => setDialog(null)}
        onConfirm={async ({ dateKey, slot }) => {
          await rescheduleAppointment(appointment.id, { dateKey, slot, userId: user.id });
          toast.success('Appointment rescheduled', 'The clinic will confirm your new time.');
          reload();
        }}
      />
    </>
  );
}
