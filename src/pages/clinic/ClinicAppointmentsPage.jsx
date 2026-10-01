import { useEffect, useState } from 'react';
import { CalendarDays, CalendarPlus, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { SelectInput } from '@/components/common/Form';
import { Tabs } from '@/components/common/Navigation';
import { RowSkeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { QueueRow } from '@/components/appointment/AppointmentCards';
import { PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQueryState } from '@/hooks/useQueryState';
import { useToast } from '@/hooks/useToast';
import { getClinicAppointments } from '@/services/appointmentService';
import { getClinicById } from '@/services/clinicService';
import { cn } from '@/utils/cn';
import { formatSlot } from '@/utils/format';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { QueueActions } from './components/QueueActions';
import { useQueueActions } from './components/useQueueActions';

const TABS = [
  { value: 'today', label: 'Today' },
  { value: 'pending', label: 'Requests' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];

const EMPTY_COPY = {
  today: 'No appointments today yet — walk-ins and phone bookings appear here instantly.',
  pending: 'All booking requests have been answered.',
  upcoming: 'No confirmed appointments beyond today.',
  completed: 'Completed visits will be listed here.',
  cancelled: 'No cancelled or declined appointments.',
  all: 'No appointments match your filters.',
};

/** Clinic bookings & consults (FR-6 Clinic Appointment Management). */
export default function ClinicAppointmentsPage() {
  useDocumentTitle('Bookings & Consults');
  const { user } = useAuth();
  const toast = useToast();
  const [filters, setFilters] = useQueryState({ tab: 'today', doctor: 'all', q: '' });
  const [keyword, setKeyword] = useState(filters.q);
  const debounced = useDebouncedValue(keyword, 300);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (debounced !== filters.q) setFilters({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const clinic = useAsync(() => getClinicById(user.clinicId, { includeUnverified: true }), [user.clinicId]);
  const { data, isLoading, error, reload } = useAsync(
    () => getClinicAppointments(user.clinicId, { tab: filters.tab, doctorId: filters.doctor, q: filters.q }),
    [user.clinicId, filters.tab, filters.doctor, filters.q],
    { keepPreviousData: true },
  );
  const { handle, dialogs } = useQueueActions(reload);

  return (
    <>
      <PageHeader
        title="Bookings & Consults"
        meta={
          <>
            <CalendarDays className="size-4 text-secondary" aria-hidden="true" />
            <span>Accept, reschedule and progress every visit. Patients are notified automatically.</span>
          </>
        }
        actions={
          <Button leftIcon={CalendarPlus} onClick={() => setShowNew(true)} disabled={!clinic.data}>
            New Appointment
          </Button>
        }
      />

      <Panel>
        <div className="flex flex-col gap-space-sm lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            label="Appointment status"
            value={filters.tab}
            onChange={(tab) => setFilters({ tab })}
            tabs={TABS.map((tab) => ({ ...tab, count: data?.counts?.[tab.value] }))}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-on-surface-variant" aria-hidden="true" />
              <label htmlFor="appointment-search" className="sr-only">
                Search appointments
              </label>
              <input
                id="appointment-search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Patient or treatment…"
                className="w-full rounded-lg bg-surface-container-low py-2.5 pl-9 pr-3 font-body-sm text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 sm:w-56"
              />
            </div>
            <SelectInput aria-label="Filter by specialist" value={filters.doctor} onChange={(event) => setFilters({ doctor: event.target.value })} className="sm:w-56 [&_select]:py-2.5">
              <option value="all">All specialists</option>
              {(clinic.data?.doctors ?? []).map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>

        <div className="mt-space-md">
          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : isLoading && !data ? (
            <div className="space-y-space-sm">
              {Array.from({ length: 4 }, (_, index) => (
                <RowSkeleton key={index} />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <EmptyState compact icon={CalendarDays} title="Nothing to show" description={EMPTY_COPY[filters.tab]} />
          ) : (
            <div className={cn('space-y-space-sm transition-opacity', isLoading && 'opacity-60')}>
              {data.items.map((appointment) => (
                <QueueRow key={appointment.id} appointment={appointment} showDate={filters.tab !== 'today'} actions={<QueueActions appointment={appointment} onAction={handle} />} />
              ))}
            </div>
          )}
        </div>
      </Panel>

      {dialogs}
      {clinic.data && (
        <NewAppointmentModal
          key={clinic.data.id}
          clinic={clinic.data}
          isOpen={showNew}
          onClose={() => setShowNew(false)}
          onCreated={(appointment) => {
            toast.success('Appointment created', `${appointment.patient?.name} • ${formatSlot(appointment.slot)}`);
            reload();
          }}
        />
      )}
    </>
  );
}
