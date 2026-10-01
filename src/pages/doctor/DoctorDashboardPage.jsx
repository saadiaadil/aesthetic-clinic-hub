import { Armchair, ArrowRight, CalendarClock, CalendarDays, CalendarX2, Check, ExternalLink, FolderOpen, Hourglass, ListChecks, MessageSquareHeart, Star } from 'lucide-react';
import { Link } from 'react-router';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Stars } from '@/components/common/Rating';
import { RowSkeleton, Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueueRow } from '@/components/appointment/AppointmentCards';
import { DataTable, PageHeader, Panel, StatCard } from '@/components/dashboard/DashboardUI';
import { ReviewCard } from '@/components/review/ReviewCards';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getDoctorAppointments } from '@/services/appointmentService';
import { getDoctorDashboard, getDoctorSchedule } from '@/services/doctorService';
import { cn } from '@/utils/cn';
import { dayOfWeek, fromDateKey, todayKey } from '@/utils/date';
import { formatLongDate, formatNumber, formatRating, formatSlot } from '@/utils/format';
import { relativeDayLabel, replaceAppointment, whenLabel } from './components/appointmentWorkflow';
import { AppointmentActions, AppointmentWorkflowDialogs } from './components/AppointmentWorkflowUI';
import { useAppointmentWorkflow } from './components/useAppointmentWorkflow';

const WAITING = ['confirmed', 'rescheduled', 'pending'];
const ACTIVE = ['checked_in', 'in_session'];
const DONE = ['completed', 'no_show'];
// The 8-column queue panel is too narrow for QueueRow's side-by-side layout until very wide screens.
const STACKED_ROW = 'lg:flex-col lg:items-stretch min-[1800px]:flex-row min-[1800px]:items-center';

/** First patient still to be seen (booked or waiting in the lounge). */
const findNextPatient = (queue) => queue.find((item) => WAITING.includes(item.status) || item.status === 'checked_in');

/** Today's working hours at the doctor's clinic and whether a leave covers today. */
function getDutyStatus(schedule, clinicId) {
  if (!schedule) return null;
  const today = todayKey();
  const blocks = (schedule.schedules.find((row) => row.clinicId === clinicId) ?? schedule.schedules[0])?.blocks ?? [];
  const block = blocks.find((item) => item.dayOfWeek === dayOfWeek(today));
  if (schedule.leaves.some((leave) => leave.startDate <= today && leave.endDate >= today)) return { label: 'On Leave Today', block: null };
  return block ? { label: 'On Duty Today', block } : { label: 'Off Duty Today', block: null };
}

function DutyPill({ duty, loading }) {
  if (loading) return <Skeleton className="h-6 w-32 rounded-full" />;
  if (!duty) return null;
  const onDuty = Boolean(duty.block);
  return (
    <Badge tone={onDuty ? 'gold' : 'neutral'} size="md" uppercase className={onDuty ? 'gap-1.5 text-on-secondary-fixed' : 'gap-1.5'}>
      <span className={cn('size-1.5 rounded-full', onDuty ? 'animate-pulse bg-secondary' : 'bg-outline')} aria-hidden="true" />
      {duty.label}
    </Badge>
  );
}

function LegendDot({ tone, children }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', tone)} aria-hidden="true" />
      {children}
    </span>
  );
}

function StatsRow({ queue, metrics, pendingCount, nextUpcoming }) {
  const count = (statuses) => queue.filter((item) => statuses.includes(item.status)).length;
  const nextInQueue = findNextPatient(queue);
  return (
    <section className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4" aria-label="Today at a glance">
      <StatCard
        label="Today's Patients"
        value={queue.length}
        accent={nextInQueue ? `Next ${formatSlot(nextInQueue.slot)}` : queue.length ? 'Day complete' : 'Open day'}
        icon={Armchair}
        glow="gold"
        footer={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <LegendDot tone="bg-secondary">{count(WAITING)} Upcoming</LegendDot>
            <LegendDot tone="bg-primary">{count(ACTIVE)} Active</LegendDot>
            <LegendDot tone="bg-surface-dim">{count(DONE)} Done</LegendDot>
          </div>
        }
      />
      <StatCard
        label="Next 7 Days"
        value={metrics.week}
        unit={metrics.week === 1 ? 'visit' : 'visits'}
        icon={CalendarDays}
        iconTone="secondary"
        glow="plum"
        footer={nextUpcoming ? `Next: ${whenLabel(nextUpcoming)}` : 'No visits booked this week'}
      />
      <StatCard
        label="Pending Requests"
        value={pendingCount}
        accent={pendingCount ? 'Awaiting you' : 'All clear'}
        icon={Hourglass}
        glow="champagne"
        footer={pendingCount ? 'Patients are notified the moment you respond' : 'Every booking request has an answer'}
      />
      <StatCard
        label="Patient Rating"
        value={formatRating(metrics.rating)}
        accent={<Stars value={metrics.rating} size="sm" />}
        icon={Star}
        iconTone="secondary"
        glow="blush"
        footer={`${formatNumber(metrics.reviewCount)} verified patient reviews`}
      />
    </section>
  );
}

function QueueFooter({ queue }) {
  const next = findNextPatient(queue);
  return (
    <div className="mt-space-md flex flex-col justify-between gap-space-sm pt-space-sm font-body-sm text-body-sm text-on-surface-variant sm:flex-row sm:items-center">
      <p className="flex items-center gap-2">
        <span className="size-2 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
        {next ? (
          <span>
            Next up: <strong className="text-on-surface">{formatSlot(next.slot)}</strong> — {next.patient?.name}
            {next.suite ? ` (${next.suite})` : ''}
          </span>
        ) : (
          <span>All of today’s patients have been seen.</span>
        )}
      </p>
      <Link
        to={ROUTES.doctorPortal.appointments}
        className="inline-flex items-center gap-1 font-title-md text-title-md text-primary transition-colors hover:text-primary-container"
      >
        View all appointments
        <ArrowRight className="size-[18px]" aria-hidden="true" />
      </Link>
    </div>
  );
}

function ClinicalQueue({ queue, workflow, duty }) {
  return (
    <Panel
      title={
        <>
          <span>Today’s Clinical Queue</span>
          <span className="size-2.5 rounded-full bg-secondary" aria-hidden="true" />
        </>
      }
      subtitle="Mark arrivals, run sessions and review each patient’s medical intake"
      action={
        queue.length > 0 && (
          <Badge tone="neutral" size="md">
            {queue.filter((item) => DONE.includes(item.status)).length} of {queue.length} seen
          </Badge>
        )
      }
    >
      {queue.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarX2}
          title="No patients scheduled today"
          description={duty?.block ? 'Your suite is free today — new bookings will appear here instantly.' : 'Today is outside your clinic hours. Enjoy the rest.'}
          action={
            <Button to={ROUTES.doctorPortal.appointments} variant="soft" size="sm" rightIcon={ArrowRight}>
              See upcoming visits
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-space-sm">
            {queue.map((appointment) => (
              <QueueRow
                key={appointment.id}
                appointment={appointment}
                showDoctor={false}
                className={STACKED_ROW}
                actions={<AppointmentActions appointment={appointment} workflow={workflow} />}
              />
            ))}
          </div>
          <QueueFooter queue={queue} />
        </>
      )}
    </Panel>
  );
}

const upcomingColumns = (workflow) => [
  {
    key: 'when',
    header: 'When',
    className: 'whitespace-nowrap',
    render: (row) => (
      <span className="block">
        <span className="block font-semibold text-on-surface">{relativeDayLabel(row.dateKey)}</span>
        <span className="block text-on-surface-variant">{formatSlot(row.slot)}</span>
      </span>
    ),
  },
  {
    key: 'patient',
    header: 'Patient & treatment',
    render: (row) => (
      <span className="inline-flex min-w-0 items-center gap-space-sm">
        <Avatar src={row.patient?.avatar} name={row.patient?.name ?? 'Patient'} size="sm" className="hidden md:inline-flex" />
        <span className="min-w-0">
          <span className="block font-semibold text-on-surface">{row.patient?.name}</span>
          <span className="block font-medium text-primary">{row.service?.shortTitle}</span>
        </span>
      </span>
    ),
  },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} size="sm" /> },
  {
    key: 'intake',
    header: '',
    className: 'text-right',
    render: (row) => (
      <Button
        variant="soft"
        size="xs"
        leftIcon={FolderOpen}
        className="text-primary"
        aria-label={`Intake for ${row.patient?.name}`}
        onClick={() => workflow.openIntake(row)}
      >
        Intake
      </Button>
    ),
  },
];

function PendingRequestCard({ appointment, workflow }) {
  const busy = workflow.isBusy(appointment.id);
  return (
    <li className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-space-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-[10rem] flex-1">
          <h4 className="font-title-md text-title-md text-on-surface">{appointment.patient?.name}</h4>
          <p className="font-body-sm text-body-sm font-medium text-primary">{appointment.service?.title}</p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary-fixed/40 px-2 py-0.5 font-label-sm text-label-sm font-semibold text-secondary">{whenLabel(appointment)}</span>
      </div>
      {appointment.patientNotes && <p className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{appointment.patientNotes}</p>}
      <div className="mt-1 flex items-center gap-2">
        <Button
          size="sm"
          leftIcon={Check}
          loading={busy}
          className="flex-1 shadow-none"
          aria-label={`Accept request from ${appointment.patient?.name}`}
          onClick={() => workflow.accept(appointment)}
        >
          Accept
        </Button>
        <Button variant="soft" size="sm" disabled={busy} aria-label={`Decline request from ${appointment.patient?.name}`} onClick={() => workflow.openDecline(appointment)}>
          Decline
        </Button>
      </div>
    </li>
  );
}

function PendingRequests({ requests, isLoading, workflow }) {
  return (
    <Panel
      title="Pending Requests"
      titleSize="title"
      subtitle="New bookings awaiting your approval"
      action={
        requests.length > 0 && (
          <span className="flex size-6 items-center justify-center rounded-full bg-primary-fixed font-label-sm text-label-sm font-bold text-on-primary-fixed">
            {requests.length}
          </span>
        )
      }
    >
      {isLoading ? (
        <Skeleton className="h-36 w-full" />
      ) : requests.length ? (
        <>
          <ul className="space-y-space-sm">
            {requests.slice(0, 4).map((appointment) => (
              <PendingRequestCard key={appointment.id} appointment={appointment} workflow={workflow} />
            ))}
          </ul>
          {requests.length > 4 && (
            <Button to={`${ROUTES.doctorPortal.appointments}?tab=pending`} variant="ghost" size="sm" rightIcon={ArrowRight} className="mt-space-sm text-primary">
              View all {requests.length} requests
            </Button>
          )}
        </>
      ) : (
        <p className="rounded-lg bg-surface-container-low p-space-sm font-body-sm text-body-sm text-on-surface-variant">
          You’re all caught up — no booking requests are waiting for you.
        </p>
      )}
    </Panel>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-space-lg" aria-hidden="true">
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[150px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        <div className="space-y-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg xl:col-span-8">
          <Skeleton className="mb-space-sm h-7 w-64" />
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
        <div className="space-y-space-lg xl:col-span-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Specialist overview — Stitch clinic dashboard adapted to one doctor's clinical day. */
export default function DoctorDashboardPage() {
  useDocumentTitle('Specialist Overview');
  const { user } = useAuth();
  const doctorId = user.doctorId;
  const dashboard = useAsync(() => getDoctorDashboard(doctorId), [doctorId], { keepPreviousData: true });
  const pending = useAsync(() => getDoctorAppointments(doctorId, { tab: 'pending' }), [doctorId], { keepPreviousData: true });
  const schedule = useAsync(() => getDoctorSchedule(doctorId), [doctorId]);

  const workflow = useAppointmentWorkflow({
    onChange: (appointment) => {
      dashboard.setData((previous) =>
        previous && { ...previous, queue: replaceAppointment(previous.queue, appointment), upcoming: replaceAppointment(previous.upcoming, appointment) },
      );
      pending.setData((previous) => previous && { ...previous, items: replaceAppointment(previous.items, appointment) });
    },
    // Accepting or declining changes the weekly totals, so refresh them quietly.
    onSettled: (_appointment, action) => {
      if (action === 'accept' || action === 'decline') dashboard.reload();
    },
  });

  const data = dashboard.data;
  const doctor = data?.doctor;
  const duty = getDutyStatus(schedule.data, user.clinicId ?? doctor?.primaryClinicId);
  const requests = (pending.data?.items ?? []).filter((item) => item.status === 'pending');
  const today = todayKey();

  return (
    <>
      <PageHeader
        pills={
          <>
            <DutyPill duty={duty} loading={schedule.isLoading} />
            {doctor?.clinic && (
              <Badge tone="neutral" size="md">
                {doctor.clinic.name} • {doctor.clinic.districtLabel}
              </Badge>
            )}
            {doctor?.specialization && (
              <Badge tone="muted" size="md" className="hidden bg-surface-container sm:inline-flex">
                {doctor.specialization}
              </Badge>
            )}
          </>
        }
        title={doctor?.name ?? user.name}
        meta={
          <>
            <CalendarDays className="size-4 text-secondary" aria-hidden="true" />
            <span>{formatLongDate(fromDateKey(today))}</span>
            <span className="text-outline-variant">•</span>
            <span>Riyadh (GMT+3)</span>
            {duty?.block && (
              <>
                <span className="text-outline-variant">•</span>
                <span>
                  Clinic hours {formatSlot(duty.block.start)} – {formatSlot(duty.block.end)}
                </span>
              </>
            )}
          </>
        }
        actions={
          <>
            <Button to={ROUTES.doctorPortal.schedule} variant="tonal" leftIcon={CalendarClock}>
              View schedule
            </Button>
            <Button to={ROUTES.doctorPortal.appointments} leftIcon={ListChecks}>
              All appointments
            </Button>
          </>
        }
      />

      {!data && dashboard.error ? (
        <ErrorState title="We couldn’t load your clinical day" error={dashboard.error} onRetry={dashboard.reload} />
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <StatsRow queue={data.queue} metrics={data.metrics} pendingCount={pending.data ? requests.length : data.metrics.pending} nextUpcoming={data.upcoming[0]} />

          <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
            <div className="flex min-w-0 flex-col gap-space-lg xl:col-span-8">
              <ClinicalQueue queue={data.queue} workflow={workflow} duty={duty} />

              <Panel title="Upcoming This Week" subtitle="Confirmed and requested visits over the next 7 days">
                <DataTable
                  caption="Upcoming appointments this week"
                  columns={upcomingColumns(workflow)}
                  rows={data.upcoming}
                  empty={
                    <EmptyState compact icon={CalendarDays} title="No visits booked this week" description="New bookings from patients will appear here as soon as they are made." />
                  }
                />
              </Panel>
            </div>

            <div className="flex min-w-0 flex-col gap-space-lg xl:col-span-4">
              <PendingRequests requests={requests} isLoading={!pending.data && pending.isLoading} workflow={workflow} />

              <Panel title="Patient Feedback" titleSize="title" subtitle="Latest verified reviews of your treatments">
                {data.reviews.length ? (
                  <div className="space-y-space-sm">
                    {data.reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} className="bg-surface-container-low p-space-md" />
                    ))}
                  </div>
                ) : (
                  <EmptyState compact icon={MessageSquareHeart} title="No reviews yet" description="Verified reviews appear here after patients complete their visit." />
                )}
                {doctor && (
                  <Button to={ROUTES.doctor(doctor.id)} variant="ghost" size="sm" rightIcon={ExternalLink} className="mt-space-sm text-primary">
                    View public profile
                  </Button>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}

      <AppointmentWorkflowDialogs workflow={workflow} />
    </>
  );
}
