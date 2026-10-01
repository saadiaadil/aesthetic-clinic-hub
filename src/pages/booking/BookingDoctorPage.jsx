import { ArrowLeft, ArrowRight, Check, UsersRound } from 'lucide-react';
import { Navigate, useNavigate, useOutletContext } from 'react-router';
import { BookingSummary } from '@/components/appointment/BookingSummary';
import { BookingWorkspace } from '@/components/appointment/BookingWorkspace';
import { Button } from '@/components/common/Button';
import { DoctorCardSkeleton, DoctorCard } from '@/components/doctor/DoctorCard';
import { ErrorState } from '@/components/common/States';
import { ROUTES } from '@/constants/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useBookingStore } from '@/store/bookingStore';
import { canAccessStep, firstIncompleteStep } from '@/utils/booking';
import { cn } from '@/utils/cn';

/** Step 3 — choose the specialist who performs the selected treatment. */
export default function BookingDoctorPage() {
  useDocumentTitle('Book · Choose Specialist');
  const { booking, clinic, service, doctor, clinicLoading, clinicError, reloadClinic } = useOutletContext();
  const selectDoctor = useBookingStore((state) => state.selectDoctor);
  const navigate = useNavigate();

  if (!canAccessStep(booking, 'doctor')) return <Navigate to={firstIncompleteStep(booking).path} replace />;

  const doctors = (clinic?.doctors ?? []).filter((item) => service?.doctorIds.includes(item.id));
  const choose = (doctorId) => {
    selectDoctor(doctorId);
    navigate(ROUTES.booking.dateTime);
  };
  const anySelected = booking.doctorId === 'any';

  return (
    <BookingWorkspace
      overline="Step 03 · Choose Specialist"
      title="Select Your Consulting Specialist"
      description={service ? `Specialists at ${clinic?.name} who perform ${service.shortTitle}.` : undefined}
      aside={
        <BookingSummary clinic={clinic} service={service} doctor={doctor} anySpecialist={anySelected} loading={clinicLoading}>
          <div className="flex gap-2">
            <Button variant="soft" leftIcon={ArrowLeft} onClick={() => navigate(ROUTES.booking.service)}>
              Back
            </Button>
            <Button className="flex-1" rightIcon={ArrowRight} disabled={!booking.doctorId} onClick={() => navigate(ROUTES.booking.dateTime)}>
              Continue to Date & Time
            </Button>
          </div>
        </BookingSummary>
      }
    >
      {clinicError ? (
        <ErrorState error={clinicError} onRetry={reloadClinic} />
      ) : (
        <>
          <button
            type="button"
            onClick={() => choose('any')}
            aria-pressed={anySelected}
            className={cn(
              'flex w-full items-center gap-space-md rounded-xl bg-surface-container-low p-space-md text-left transition-all hover:bg-surface-container',
              anySelected && 'bg-surface-container ring-2 ring-primary',
            )}
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <UsersRound className="size-6" aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block font-title-lg text-title-lg text-on-surface">Next Available Senior Consultant</span>
              <span className="block font-body-sm text-body-sm text-on-surface-variant">See the widest choice of times — the clinic assigns a board-certified specialist.</span>
            </span>
            {anySelected && <Check className="size-6 text-primary" aria-hidden="true" />}
          </button>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {clinicLoading || !clinic
              ? Array.from({ length: 2 }, (_, index) => <DoctorCardSkeleton key={index} />)
              : doctors.map((item) => {
                  const selected = item.id === booking.doctorId;
                  return (
                    <DoctorCard
                      key={item.id}
                      doctor={item}
                      selected={selected}
                      action={
                        <Button
                          variant={selected ? 'primary' : 'soft'}
                          size="sm"
                          fullWidth
                          className="py-2.5 shadow-none hover:bg-primary hover:text-on-primary"
                          aria-pressed={selected}
                          onClick={() => choose(item.id)}
                        >
                          {selected ? 'Selected Specialist' : 'Select Specialist'}
                        </Button>
                      }
                    />
                  );
                })}
          </div>
        </>
      )}
    </BookingWorkspace>
  );
}
