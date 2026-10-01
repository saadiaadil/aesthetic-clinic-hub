import { useState } from 'react';
import { CalendarCheck, CalendarClock, CalendarDays, CalendarX2, ClipboardCheck, Inbox, Search, SearchX, X } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Field, TextInput } from '@/components/common/Form';
import { IconButton } from '@/components/common/IconButton';
import { Tabs } from '@/components/common/Navigation';
import { RowSkeleton, Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { QueueRow } from '@/components/appointment/AppointmentCards';
import { PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQueryState } from '@/hooks/useQueryState';
import { getDoctorAppointments } from '@/services/appointmentService';
import { cn } from '@/utils/cn';
import { fromDateKey, todayKey } from '@/utils/date';
import { formatLongDate } from '@/utils/format';
import { replaceAppointment } from './components/appointmentWorkflow';
import { AppointmentActions, AppointmentWorkflowDialogs } from './components/AppointmentWorkflowUI';
import { useAppointmentWorkflow } from './components/useAppointmentWorkflow';

const TABS = [
  {
    value: 'today',
    label: 'Today',
    title: 'Today’s Patients',
    subtitle: 'Everyone booked with you today, in appointment order',
    empty: { icon: CalendarX2, title: 'No patients scheduled today', description: 'New bookings for today will appear here instantly.' },
  },
  {
    value: 'upcoming',
    label: 'Upcoming',
    title: 'Upcoming Visits',
    subtitle: 'Confirmed and rescheduled appointments ahead',
    empty: { icon: CalendarDays, title: 'No upcoming visits', description: 'Confirmed bookings for the coming days will be listed here.' },
  },
  {
    value: 'pending',
    label: 'Pending',
    title: 'Booking Requests',
    subtitle: 'Accept, decline or propose another time — patients are notified instantly',
    empty: { icon: Inbox, title: 'You’re all caught up', description: 'No booking requests are waiting for your approval.' },
  },
  {
    value: 'completed',
    label: 'Completed',
    title: 'Completed Visits',
    subtitle: 'Finished treatments and missed appointments, most recent first',
    empty: { icon: ClipboardCheck, title: 'No completed visits yet', description: 'Treatments you finish will be recorded here.' },
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    title: 'Cancelled & Declined',
    subtitle: 'Bookings cancelled by patients or declined by you',
    empty: { icon: CalendarCheck, title: 'No cancellations', description: 'Cancelled and declined bookings will appear here.' },
  },
];

function ListSkeleton() {
  return (
    <div className="space-y-space-sm" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <RowSkeleton key={index} />
      ))}
    </div>
  );
}

/** Doctor appointments — Stitch queue rows with status tabs, search and per-status actions. */
export default function DoctorAppointmentsPage() {
  useDocumentTitle('My Appointments');
  const { user } = useAuth();
  const doctorId = user.doctorId;
  const [query, setQuery] = useQueryState({ tab: 'today' });
  const activeTab = TABS.find((tab) => tab.value === query.tab) ?? TABS[0];
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  const appointments = useAsync(() => getDoctorAppointments(doctorId, { tab: activeTab.value, q: debouncedSearch }), [doctorId, activeTab.value, debouncedSearch], {
    keepPreviousData: true,
  });
  const { data, error, isLoading, reload, setData } = appointments;

  const workflow = useAppointmentWorkflow({
    onChange: (appointment) => setData((previous) => previous && { ...previous, items: replaceAppointment(previous.items, appointment) }),
    // Status changes move bookings between tabs and change the counts.
    onSettled: () => reload(),
  });

  const counts = data?.counts;
  const items = data?.items ?? [];
  const tabs = TABS.map((tab) => ({ value: tab.value, label: tab.label, count: counts?.[tab.value] }));

  const renderList = () => {
    if (!data && error) return <ErrorState compact title="We couldn’t load your appointments" error={error} onRetry={reload} />;
    if (!data) return <ListSkeleton />;
    if (!items.length) {
      return debouncedSearch ? (
        <EmptyState
          compact
          icon={SearchX}
          title={`No matches for “${debouncedSearch}”`}
          description={`Try another patient name or treatment in ${activeTab.label.toLowerCase()} appointments.`}
          action={
            <Button variant="soft" size="sm" leftIcon={X} onClick={() => setSearch('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <EmptyState compact {...activeTab.empty} />
      );
    }
    return (
      <ul className={cn('space-y-space-sm transition-opacity', isLoading && 'opacity-60')} aria-busy={isLoading || undefined}>
        {items.map((appointment) => (
          <li key={appointment.id}>
            <QueueRow appointment={appointment} showDate={activeTab.value !== 'today'} showDoctor={false} actions={<AppointmentActions appointment={appointment} workflow={workflow} allowPropose />} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <PageHeader
        pills={
          counts ? (
            <>
              <Badge tone="gold" size="md" uppercase className="gap-1.5 text-on-secondary-fixed">
                <span className={cn('size-1.5 rounded-full bg-secondary', counts.pending > 0 && 'animate-pulse')} aria-hidden="true" />
                {counts.pending} awaiting approval
              </Badge>
              <Badge tone="neutral" size="md">
                {counts.today} today • {counts.upcoming} upcoming
              </Badge>
            </>
          ) : (
            <Skeleton className="h-6 w-56 rounded-full" />
          )
        }
        title="My Appointments"
        meta={
          <>
            <CalendarDays className="size-4 text-secondary" aria-hidden="true" />
            <span>{formatLongDate(fromDateKey(todayKey()))}</span>
            <span className="text-outline-variant">•</span>
            <span>Riyadh (GMT+3)</span>
          </>
        }
        actions={
          <Button to={ROUTES.doctorPortal.schedule} variant="tonal" leftIcon={CalendarClock}>
            Manage availability
          </Button>
        }
      />

      <Panel title={activeTab.title} subtitle={activeTab.subtitle}>
        <div className="mb-space-md flex flex-col gap-space-sm lg:flex-row lg:items-end lg:justify-between">
          <Tabs tabs={tabs} value={activeTab.value} onChange={(tab) => setQuery({ tab })} label="Appointment status" className="self-start lg:self-auto" />
          <Field label="Search" className="w-full lg:max-w-xs">
            <TextInput
              inputMode="search"
              enterKeyHint="search"
              leftIcon={Search}
              placeholder="Patient or treatment"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoComplete="off"
              rightSlot={search && <IconButton icon={X} label="Clear search" size="sm" onClick={() => setSearch('')} />}
            />
          </Field>
        </div>
        {renderList()}
      </Panel>

      <AppointmentWorkflowDialogs workflow={workflow} />
    </>
  );
}
