import { useState } from 'react';
import { CalendarClock, CalendarPlus, CalendarX, PenLine, XCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Navigation';
import { RowSkeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { AppointmentCard } from '@/components/appointment/AppointmentCards';
import { CancelAppointmentDialog, RescheduleDialog } from '@/components/appointment/AppointmentDialogs';
import { PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQueryState } from '@/hooks/useQueryState';
import { useToast } from '@/hooks/useToast';
import { cancelAppointment, getPatientAppointments, rescheduleAppointment } from '@/services/appointmentService';

const EMPTY = {
  upcoming: { icon: CalendarPlus, title: 'No upcoming appointments', description: 'Book a verified clinic — your next visit will appear here.' },
  past: { icon: CalendarClock, title: 'No past visits yet', description: 'Completed treatments and your review history will appear here.' },
  cancelled: { icon: CalendarX, title: 'No cancelled appointments', description: 'Appointments you cancel remain visible here for your records.' },
};

/** Patient appointment management (requirements: "Appointment management (view/cancel)"). */
export default function PatientAppointmentsPage() {
  useDocumentTitle('My Appointments');
  const { user } = useAuth();
  const toast = useToast();
  const [filters, setFilters] = useQueryState({ tab: 'upcoming' });
  const [cancelling, setCancelling] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);

  const all = useAsync(() => getPatientAppointments(user.id, { scope: 'all' }), [user.id]);
  const { data, isLoading, error, reload } = useAsync(() => getPatientAppointments(user.id, { scope: filters.tab }), [user.id, filters.tab], {
    keepPreviousData: true,
  });

  const now = new Date().toISOString();
  const counts = {
    upcoming: all.data?.filter((item) => ['pending', 'confirmed', 'rescheduled'].includes(item.status) && item.scheduledAt >= now).length,
    past: all.data?.filter((item) => ['completed', 'no_show'].includes(item.status) || (item.scheduledAt < now && item.status !== 'cancelled')).length,
    cancelled: all.data?.filter((item) => item.status === 'cancelled').length,
  };
  const refresh = () => {
    reload();
    all.reload();
  };

  const onCancel = async (reason) => {
    await cancelAppointment(cancelling.id, { userId: user.id, reason });
    toast.success('Appointment cancelled', 'The clinic has been notified.');
    refresh();
  };

  const onReschedule = async ({ dateKey, slot }) => {
    await rescheduleAppointment(rescheduling.id, { dateKey, slot, userId: user.id });
    toast.success('Appointment rescheduled', 'The clinic will confirm your new time.');
    refresh();
  };

  const empty = EMPTY[filters.tab];

  return (
    <>
      <PageHeader
        title="My Appointments"
        meta={<span>View, reschedule or cancel your visits. Complimentary cancellation up to 24 hours before.</span>}
        actions={
          <Button to={ROUTES.booking.root} leftIcon={CalendarPlus}>
            Book Appointment
          </Button>
        }
      />
      <Panel
        title={<span className="sr-only">Appointments</span>}
        action={
          <Tabs
            label="Appointment status"
            value={filters.tab}
            onChange={(tab) => setFilters({ tab })}
            tabs={[
              { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
              { value: 'past', label: 'Past', count: counts.past },
              { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
            ]}
          />
        }
      >
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : isLoading && !data ? (
          <div className="space-y-space-sm">
            {Array.from({ length: 3 }, (_, index) => (
              <RowSkeleton key={index} />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={empty.icon}
            title={empty.title}
            description={empty.description}
            action={filters.tab === 'upcoming' ? <Button to={ROUTES.clinics}>Find a clinic</Button> : null}
          />
        ) : (
          <div className="space-y-space-sm">
            {data.map((appointment) => {
              const upcoming = ['pending', 'confirmed', 'rescheduled'].includes(appointment.status) && appointment.scheduledAt >= now;
              const canReview = appointment.status === 'completed' && !appointment.review;
              return (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  actions={
                    <>
                      <Button to={ROUTES.patient.appointment(appointment.id)} variant="tonal" size="sm">
                        Details
                      </Button>
                      {upcoming && (
                        <>
                          <Button variant="soft" size="sm" leftIcon={CalendarClock} onClick={() => setRescheduling(appointment)}>
                            Reschedule
                          </Button>
                          <Button variant="danger-soft" size="sm" leftIcon={XCircle} onClick={() => setCancelling(appointment)}>
                            Cancel
                          </Button>
                        </>
                      )}
                      {canReview && (
                        <Button to={`${ROUTES.patient.appointment(appointment.id)}#review`} size="sm" leftIcon={PenLine} className="shadow-none">
                          Review
                        </Button>
                      )}
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </Panel>

      <CancelAppointmentDialog key={cancelling?.id} appointment={cancelling} isOpen={Boolean(cancelling)} onClose={() => setCancelling(null)} onConfirm={onCancel} />
      <RescheduleDialog key={rescheduling?.id} appointment={rescheduling} isOpen={Boolean(rescheduling)} onClose={() => setRescheduling(null)} onConfirm={onReschedule} />
    </>
  );
}
