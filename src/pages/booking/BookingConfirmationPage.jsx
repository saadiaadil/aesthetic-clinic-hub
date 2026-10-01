import { useState } from 'react';
import { BadgeCheck, CalendarDays, ClipboardList, Lock, Pencil, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router';
import { BookingSummary } from '@/components/appointment/BookingSummary';
import { BookingWorkspace } from '@/components/appointment/BookingWorkspace';
import { Button } from '@/components/common/Button';
import { RadioCard } from '@/components/common/Form';
import { FormAlert } from '@/components/common/States';
import { ROUTES } from '@/constants/routes';
import { PAYMENT_METHODS } from '@/constants/status';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { createAppointment } from '@/services/appointmentService';
import { useBookingStore } from '@/store/bookingStore';
import { canAccessStep, firstIncompleteStep } from '@/utils/booking';
import { fromDateKey } from '@/utils/date';
import { formatLongDate, formatPrice, formatSlot } from '@/utils/format';

function ReviewRow({ icon: Icon, label, value, detail, editTo }) {
  return (
    <div className="flex items-start gap-space-sm rounded-lg bg-surface p-space-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</p>
        <p className="font-title-md text-title-md text-on-surface">{value}</p>
        {detail && <p className="font-body-sm text-body-sm text-on-surface-variant">{detail}</p>}
      </div>
      {editTo && (
        <Link to={editTo} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-label-md text-label-md text-primary hover:bg-surface-container">
          <Pencil className="size-3.5" aria-hidden="true" /> Edit
        </Link>
      )}
    </div>
  );
}

/** Step 5 — review, settlement preference and "Confirm & Reserve Appointment" (FR-5). */
export default function BookingConfirmationPage() {
  useDocumentTitle('Book · Confirm');
  const { booking, clinic, service, doctor, clinicLoading } = useOutletContext();
  const { user } = useAuth();
  const setPaymentMethod = useBookingStore((state) => state.setPaymentMethod);
  const markConfirmed = useBookingStore((state) => state.markConfirmed);
  const selectSlot = useBookingStore((state) => state.selectSlot);
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (booking.confirmedAppointmentId) return <Navigate to={ROUTES.booking.success} replace />;
  if (!canAccessStep(booking, 'confirmation')) return <Navigate to={firstIncompleteStep(booking).path} replace />;

  const price = service?.priceMin ?? 0;
  const installment = price / 4;

  const confirm = async () => {
    setSubmitting(true);
    setServerError('');
    try {
      const appointment = await createAppointment({
        userId: user.id,
        clinicId: booking.clinicId,
        clinicServiceId: booking.clinicServiceId,
        doctorId: booking.doctorId,
        dateKey: booking.dateKey,
        slot: booking.slot,
        preferences: booking.preferences,
        patientNotes: booking.patientNotes,
        paymentMethod: booking.paymentMethod,
        idempotencyKey: booking.idempotencyKey,
      });
      markConfirmed(appointment.id);
      navigate(ROUTES.booking.success, { replace: true });
    } catch (error) {
      setSubmitting(false);
      if (error.status === 409) {
        // Requirements §3.12: "Selected time slot is no longer available."
        selectSlot(null);
        toast.error(error.message, 'Please choose another time — your other details are saved.');
        navigate(ROUTES.booking.dateTime);
        return;
      }
      setServerError(error.message);
    }
  };

  const preferenceText = [booking.preferences.privateSuite && 'Private VIP suite & garage escort', booking.preferences.femaleStaff && 'Female practitioner & staff only']
    .filter(Boolean)
    .join(' • ');

  return (
    <BookingWorkspace
      overline="Final Review"
      title="Confirm Your Private Appointment"
      description="Please review your selections. You can edit any step before reserving."
      aside={
        <BookingSummary
          clinic={clinic}
          service={service}
          doctor={doctor}
          anySpecialist={booking.doctorId === 'any'}
          dateKey={booking.dateKey}
          slot={booking.slot}
          preferences={booking.preferences}
          loading={clinicLoading}
        >
          <fieldset className="space-y-2 pt-1">
            <legend className="mb-2 font-label-md text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">Flexible Settlement</legend>
            <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
              {PAYMENT_METHODS.map((method) => (
                <RadioCard
                  key={method.id}
                  name="payment_method"
                  value={method.id}
                  checked={booking.paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                  title={method.label}
                  description={method.id === 'installments' ? `4 x ${formatPrice(installment, { decimals: true })} / mo` : method.description}
                  className="bg-surface-container"
                />
              ))}
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Online card payment launches in Phase 2. No payment is taken now.</p>
          </fieldset>
          <div className="space-y-3 pt-2">
            <FormAlert>{serverError}</FormAlert>
            <Button size="lg" fullWidth loading={submitting} leftIcon={Lock} onClick={confirm} className="py-4">
              {submitting ? 'Reserving your suite…' : 'Confirm & Reserve Appointment'}
            </Button>
            <p className="flex items-center justify-center gap-2 text-center font-label-sm text-label-sm text-on-surface-variant">
              <BadgeCheck className="size-4 text-secondary" aria-hidden="true" />
              Complimentary cancellation up to 24h before appointment
            </p>
          </div>
        </BookingSummary>
      }
    >
      <div className="space-y-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm">
        <ReviewRow icon={Sparkles} label="Treatment" value={service?.title ?? '—'} detail={service ? `${service.durationMinutes} mins • ${formatPrice(price)} (VAT incl.)` : null} editTo={ROUTES.booking.service} />
        <ReviewRow
          icon={Stethoscope}
          label="Specialist"
          value={doctor?.name ?? 'Next Available Senior Consultant'}
          detail={doctor?.title ?? 'Assigned by the clinic for your chosen time'}
          editTo={ROUTES.booking.doctor}
        />
        <ReviewRow
          icon={CalendarDays}
          label="Date & Time"
          value={booking.dateKey ? formatLongDate(fromDateKey(booking.dateKey)) : '—'}
          detail={booking.slot ? `${formatSlot(booking.slot)} Riyadh time • ${clinic?.name ?? ''}` : null}
          editTo={ROUTES.booking.dateTime}
        />
        <ReviewRow icon={ShieldCheck} label="Discretion Preferences" value={preferenceText || 'Standard arrival'} editTo={ROUTES.booking.dateTime} />
        <ReviewRow icon={ClipboardList} label="Confidential Medical Intake" value={booking.patientNotes} editTo={ROUTES.booking.dateTime} />
      </div>

      <div className="rounded-xl bg-surface-container-low p-space-md">
        <h2 className="font-title-lg text-title-lg text-on-surface">Booking for</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          {user.name} • {user.email}
          {user.phone ? ` • ${user.phone}` : ''}
        </p>
        <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
          {clinic?.features?.instantConfirmation
            ? 'This clinic offers instant confirmation — your slot is secured as soon as you confirm.'
            : 'The clinic reviews new requests and typically confirms within 2 hours. You will be notified by WhatsApp and in-app.'}
        </p>
      </div>
    </BookingWorkspace>
  );
}
