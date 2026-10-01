import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useOutletContext } from 'react-router';
import { z } from 'zod';
import { BookingCalendar } from '@/components/appointment/BookingCalendar';
import { BookingSummary } from '@/components/appointment/BookingSummary';
import { BookingWorkspace } from '@/components/appointment/BookingWorkspace';
import { TimeSlotGrid } from '@/components/appointment/TimeSlotGrid';
import { Button } from '@/components/common/Button';
import { Field, Switch, Textarea } from '@/components/common/Form';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, FormAlert } from '@/components/common/States';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getSlots } from '@/services/appointmentService';
import { useBookingStore } from '@/store/bookingStore';
import { canAccessStep, firstIncompleteStep } from '@/utils/booking';
import { getUpcomingOpenDays } from '@/utils/clinic';

const schema = z.object({
  privateSuite: z.boolean(),
  femaleStaff: z.boolean(),
  patientNotes: z
    .string()
    .trim()
    .min(3, 'Please share your treatment history, or write “None”.')
    .max(1000, 'Please keep your notes under 1,000 characters.'),
});

function PreferenceToggle({ title, description, ...props }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-space-md rounded-lg bg-surface-container p-space-sm transition-colors hover:bg-surface-container-high">
      <span className="space-y-1">
        <span className="block font-title-md text-title-md text-on-surface">{title}</span>
        <span className="block font-body-sm text-body-sm text-on-surface-variant">{description}</span>
      </span>
      <Switch className="mt-1" srLabel={title} {...props} />
    </label>
  );
}

/** Step 4 — Stitch "Select Date & Preferred Sanctuary Slot" with discretion preferences and medical intake. */
export default function BookingDateTimePage() {
  useDocumentTitle('Book · Date & Time');
  const { booking, clinic, service, doctor, clinicLoading } = useOutletContext();
  const { user } = useAuth();
  const selectDate = useBookingStore((state) => state.selectDate);
  const selectSlot = useBookingStore((state) => state.selectSlot);
  const setDetails = useBookingStore((state) => state.setDetails);
  const navigate = useNavigate();
  const [slotError, setSlotError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      privateSuite: booking.preferences.privateSuite,
      femaleStaff: booking.preferences.femaleStaff || Boolean(user?.preferences?.femaleStaff),
      patientNotes: booking.patientNotes,
    },
  });

  // Default to the next day the clinic is open.
  useEffect(() => {
    if (!booking.dateKey && clinic) selectDate(getUpcomingOpenDays(clinic.openingHours, 1)[0]?.key ?? null);
  }, [booking.dateKey, clinic, selectDate]);

  const accessible = canAccessStep(booking, 'dateTime');
  const { data: slots = [], isLoading: slotsLoading } = useAsync(
    () =>
      accessible && booking.dateKey
        ? getSlots({ clinicId: booking.clinicId, clinicServiceId: booking.clinicServiceId, doctorId: booking.doctorId, dateKey: booking.dateKey })
        : Promise.resolve([]),
    [accessible, booking.clinicId, booking.clinicServiceId, booking.doctorId, booking.dateKey],
  );

  if (!accessible) return <Navigate to={firstIncompleteStep(booking).path} replace />;

  const onSubmit = (values) => {
    if (!booking.slot) {
      setSlotError('Please choose an available time slot.');
      document.getElementById('time-slots')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setDetails({ preferences: { privateSuite: values.privateSuite, femaleStaff: values.femaleStaff }, patientNotes: values.patientNotes });
    navigate(ROUTES.booking.confirmation);
  };

  const doctorName = doctor?.name ?? 'your specialist';
  const availableCount = slots.filter((slot) => slot.status === 'available').length;

  return (
    <BookingWorkspace
      overline="Schedule Consultation"
      title="Select Date & Preferred Sanctuary Slot"
      description={`Appointments with ${doctorName} include a comprehensive 3D skin density imaging review prior to treatment administration.`}
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
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <Button variant="soft" leftIcon={ArrowLeft} onClick={() => navigate(ROUTES.booking.doctor)}>
                Back
              </Button>
              <Button type="submit" form="booking-details-form" className="flex-1 py-4" rightIcon={ArrowRight}>
                Review & Confirm
              </Button>
            </div>
            <p className="text-center font-label-sm text-label-sm text-on-surface-variant">Nothing is reserved until you confirm on the next step.</p>
          </div>
        </BookingSummary>
      }
    >
      {booking.dateKey ? (
        // Mounted once the default date exists so the calendar opens on the right month.
        <BookingCalendar
          clinicId={booking.clinicId}
          clinicServiceId={booking.clinicServiceId}
          doctorId={booking.doctorId}
          value={booking.dateKey}
          onChange={(dateKey) => {
            setSlotError('');
            selectDate(dateKey);
          }}
        />
      ) : (
        <Skeleton className="h-[420px] w-full rounded-xl" />
      )}

      <div className="space-y-space-md" id="time-slots">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Available Time Slots</h2>
          <span className="font-label-md text-label-md text-secondary">Riyadh Time (AST • UTC+3)</span>
        </div>
        <FormAlert>{slotError}</FormAlert>
        {!slotsLoading && availableCount === 0 ? (
          <EmptyState compact title="No slots left on this day" description="Choose another highlighted date, or pick “Next Available Senior Consultant” for more options." />
        ) : (
          <TimeSlotGrid
            slots={slots}
            value={booking.slot}
            loading={slotsLoading}
            onChange={(item) => {
              setSlotError('');
              selectSlot(item.slot);
            }}
          />
        )}
      </div>

      <form id="booking-details-form" onSubmit={handleSubmit(onSubmit)} className="space-y-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm" noValidate>
        <div className="flex items-center gap-2">
          <Shield className="size-[22px] text-secondary" aria-hidden="true" />
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Arabian Discretion & Comfort Preferences</h3>
        </div>
        <div className="space-y-space-sm">
          <PreferenceToggle
            title="Private VIP Room & Direct Underground Garage Escort"
            description="Seamless arrival with a dedicated private elevator straight to your suite. Absolute public avoidance."
            {...register('privateSuite')}
          />
          <PreferenceToggle
            title="Female Practitioner & Female Staff Only"
            description="Guaranteed all-female attendance from reception, assisting dermatological nurses to medical concierge."
            {...register('femaleStaff')}
          />
        </div>
        <Field
          label="Confidential Medical Intake & Treatment History"
          required
          labelStyle="title"
          hint="Please declare any prior hyaluronic injections within the last 6 months, active topical retinoids, or local anesthetic allergies."
          error={errors.patientNotes?.message}
          className="pt-2"
        >
          <Textarea
            surface="white"
            rows={3}
            placeholder="e.g. Previous Profhilo treatment completed in April. No lidocaine allergies. Skin tends towards mild erythema."
            {...register('patientNotes')}
          />
        </Field>
        <p className="font-label-sm text-label-sm text-on-surface-variant">Shared only with your treating clinic, in line with Saudi PDPL and MOH confidentiality rules.</p>
      </form>
    </BookingWorkspace>
  );
}
