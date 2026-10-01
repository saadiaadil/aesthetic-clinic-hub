import { useState } from 'react';
import { ArrowRight, CalendarDays, CalendarPlus, CirclePlus, Download, Info, Sparkles, SlidersHorizontal, Star, Stethoscope, TrendingDown, TrendingUp, Armchair, Banknote } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { images } from '@/assets/images';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Navigation';
import { RowSkeleton, Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { QueueRow } from '@/components/appointment/AppointmentCards';
import { PageHeader, Panel, StatCard } from '@/components/dashboard/DashboardUI';
import { UtilizationHeatmap } from '@/components/dashboard/UtilizationHeatmap';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { getClinicAppointments } from '@/services/appointmentService';
import { getClinicById, getClinicDashboard } from '@/services/clinicService';
import { replyToReview } from '@/services/reviewService';
import { cn } from '@/utils/cn';
import { fromDateKey } from '@/utils/date';
import { formatLongDate, formatNumber, formatRating, formatRelative, formatShortDate, formatSlot } from '@/utils/format';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { QueueActions } from './components/QueueActions';
import { useQueueActions } from './components/useQueueActions';

const QUEUE_TABS = [
  { value: 'today', label: "Today's" },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'pending', label: 'Waitlist' },
  { value: 'completed', label: 'Completed' },
];

/** Downloads today's schedule as CSV (Stitch "Export MOH Report"). */
function exportReport(clinic, queue) {
  const rows = [
    ['Time', 'Patient', 'File', 'Treatment', 'Specialist', 'Suite', 'Status', 'Price (SAR)'],
    ...queue.map((apt) => [formatSlot(apt.slot), apt.patient?.name, apt.patient?.fileNo ?? '', apt.service?.title, apt.doctor?.name, apt.suite ?? '', apt.status, apt.priceCharged]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${clinic.id}-moh-daily-report.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function ReviewStreamItem({ review, onReply }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const send = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    await onReply(review.id, text);
    setSending(false);
    setText('');
  };
  return (
    <li className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-space-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-title-md text-title-md font-semibold text-on-surface">{review.author.name.split(' ')[0]} {review.author.name.split(' ').slice(-1)[0]?.[0]}.</span>
          <span className="font-label-sm text-label-sm text-secondary" aria-label={`${review.rating} stars`}>
            {'★'.repeat(review.rating)}
          </span>
        </div>
        <span className="font-label-sm text-label-sm text-outline">{formatRelative(review.createdAt)}</span>
      </div>
      <p className="font-body-sm text-body-sm italic text-on-surface-variant">“{review.description}”</p>
      {review.reply ? (
        <div className="rounded bg-surface-container p-2 font-body-sm text-body-sm text-on-surface-variant">
          <span className="font-label-sm text-label-sm font-semibold uppercase text-primary">Replied by Manager:</span>
          <p className="mt-0.5">“{review.reply.text}”</p>
        </div>
      ) : (
        <form onSubmit={send} className="mt-1 flex items-center gap-2">
          <label htmlFor={`reply-${review.id}`} className="sr-only">
            Reply to {review.author.name}
          </label>
          <input
            id={`reply-${review.id}`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Reply as Clinic Manager…"
            className="min-w-0 flex-1 rounded-lg bg-surface-container px-3 py-1.5 font-body-sm text-body-sm text-on-surface outline-none placeholder:text-outline focus:bg-surface-container-high focus:ring-2 focus:ring-primary/20"
          />
          <Button type="submit" size="xs" loading={sending} disabled={!text.trim()} className="shadow-none">
            Send
          </Button>
        </form>
      )}
    </li>
  );
}

/** Clinic management dashboard — Stitch "Clinic Management Dashboard (DermaArt)". */
export default function ClinicDashboardPage() {
  useDocumentTitle('Clinic Dashboard');
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('today');
  const [showNew, setShowNew] = useState(false);

  const dashboard = useAsync(() => getClinicDashboard(user.clinicId), [user.clinicId]);
  const clinicDetail = useAsync(() => getClinicById(user.clinicId, { includeUnverified: true }), [user.clinicId]);
  const tabList = useAsync(() => (tab === 'today' ? Promise.resolve(null) : getClinicAppointments(user.clinicId, { tab })), [user.clinicId, tab]);
  const refresh = () => {
    dashboard.reload();
    if (tab !== 'today') tabList.reload();
  };
  const { handle, dialogs } = useQueueActions(refresh);

  if (dashboard.error) return <ErrorState error={dashboard.error} onRetry={dashboard.reload} />;
  const data = dashboard.data;
  const loading = dashboard.isLoading && !data;
  const queue = tab === 'today' ? data?.queue ?? [] : tabList.data?.items ?? [];
  const queueLoading = tab === 'today' ? loading : tabList.isLoading;
  const metrics = data?.metrics;
  const revenueDelta = metrics && metrics.revenue.yesterday ? Math.round(((metrics.revenue.today - metrics.revenue.yesterday) / metrics.revenue.yesterday) * 100) : 0;

  const onReply = async (reviewId, text) => {
    try {
      await replyToReview(reviewId, { text, authorName: `${data.clinic.name} Manager` });
      toast.success('Reply published');
      dashboard.reload();
    } catch (error) {
      toast.error('Reply not sent', error.message);
    }
  };

  return (
    <>
      <PageHeader
        pills={
          <>
            <Badge tone="gold" size="md" uppercase className="text-on-secondary-fixed">
              <span className="size-1.5 animate-pulse rounded-full bg-secondary" aria-hidden="true" />
              {data?.clinic.features.vipLounge ? 'Accepting VIP Patients' : 'Accepting Patients'}
            </Badge>
            <Badge tone="neutral" size="md">
              {data ? `${clinicDetail.data?.suites?.length ?? 4} Suites Active • ${data.clinic.districtLabel}` : '—'}
            </Badge>
            <Badge tone="confirmed" size="md" className="hidden bg-surface-container text-outline sm:inline-flex">
              MOH License #{data?.clinic.licenseNumber.replace(/^MOH-/, '')}
            </Badge>
          </>
        }
        title={loading ? <Skeleton className="h-10 w-72" /> : data.clinic.name}
        meta={
          <>
            <CalendarDays className="size-4 text-secondary" aria-hidden="true" />
            <span>{data ? formatLongDate(fromDateKey(data.date)) : ''}</span>
            <span className="text-outline-variant">•</span>
            <span>Riyadh, Kingdom of Saudi Arabia (GMT+3)</span>
          </>
        }
        actions={
          <>
            <Button variant="tonal" leftIcon={Download} disabled={!data} onClick={() => exportReport(data.clinic, data.queue)} className="shadow-sm">
              Export MOH Report
            </Button>
            <Button variant="soft" leftIcon={CirclePlus} onClick={() => navigate(`${ROUTES.clinicPortal.services}?new=1`)} className="text-primary shadow-sm">
              Add Treatment
            </Button>
            <Button leftIcon={CalendarPlus} onClick={() => setShowNew(true)} disabled={!clinicDetail.data} className="hover:bg-primary-container">
              New Appointment
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4" aria-label="Key performance metrics">
        {loading ? (
          Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-40 rounded-xl" />)
        ) : (
          <>
            <StatCard
              label="Today's Appointments"
              value={metrics.todaysAppointments.total}
              accent={`${metrics.occupancy.percent}% Slot Target`}
              icon={Armchair}
              glow="gold"
              footer={
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-secondary" /> {metrics.todaysAppointments.confirmed} Confirmed</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> {metrics.todaysAppointments.active} Active</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-surface-dim" /> {metrics.todaysAppointments.done} Done</span>
                </span>
              }
            />
            <StatCard
              label="Daily Revenue Estimate"
              value={formatNumber(metrics.revenue.today)}
              unit="SAR"
              icon={Banknote}
              iconTone="secondary"
              glow="plum"
              footer={
                <span className="flex items-center gap-2 text-secondary">
                  {revenueDelta >= 0 ? <TrendingUp className="size-4" aria-hidden="true" /> : <TrendingDown className="size-4" aria-hidden="true" />}
                  <span className="font-semibold">{revenueDelta >= 0 ? '+' : ''}{revenueDelta}%</span>
                  <span className="text-on-surface-variant">vs. yesterday ({formatNumber(metrics.revenue.yesterday)} SAR)</span>
                </span>
              }
            />
            <StatCard
              label="Doctor Occupancy"
              value={`${metrics.occupancy.percent}%`}
              accent={metrics.occupancy.percent >= 85 ? 'Peak Efficiency' : 'Capacity Available'}
              icon={Stethoscope}
              glow="champagne"
              footer={
                <span className="flex items-center justify-between gap-2">
                  <span>{metrics.occupancy.activeDoctors} Specialist Doctors Active</span>
                  <span className="font-semibold text-primary">{metrics.occupancy.totalDoctors - metrics.occupancy.activeDoctors} Off</span>
                </span>
              }
            />
            <StatCard
              label="Patient Satisfaction"
              value={formatRating(metrics.satisfaction.rating)}
              accent="★★★★★"
              icon={Star}
              iconTone="secondary"
              glow="blush"
              footer={
                <span>
                  <span className="font-semibold text-primary">+{metrics.satisfaction.newReviews} New verified reviews</span> this week
                </span>
              }
            />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-space-lg xl:col-span-8">
          <Panel
            title={
              <>
                Real-Time Patient Schedule & Queue
                <span className="size-2.5 rounded-full bg-secondary" aria-hidden="true" />
              </>
            }
            subtitle="Dynamic room routing for VIP suites and specialized laser chambers"
            action={
              <Tabs
                label="Queue view"
                value={tab}
                onChange={setTab}
                tabs={QUEUE_TABS.map((item) => ({
                  ...item,
                  count: item.value === 'today' ? data?.queue.length : item.value === 'pending' ? data?.incoming.length : undefined,
                }))}
              />
            }
          >
            {queueLoading ? (
              <div className="space-y-space-sm">
                {Array.from({ length: 4 }, (_, index) => (
                  <RowSkeleton key={index} />
                ))}
              </div>
            ) : queue.length === 0 ? (
              <EmptyState compact icon={CalendarDays} title="Nothing scheduled here" description="New bookings appear in real time as patients reserve slots." />
            ) : (
              <div className="space-y-space-sm">
                {queue.map((appointment) => (
                  <QueueRow key={appointment.id} appointment={appointment} showDate={tab !== 'today'} actions={<QueueActions appointment={appointment} onAction={handle} />} />
                ))}
              </div>
            )}
            <div className="mt-space-md flex flex-col items-center justify-between gap-space-sm pt-space-sm font-body-sm text-body-sm text-on-surface-variant sm:flex-row">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-secondary" aria-hidden="true" />
                Next available walk-in slot:{' '}
                <strong className="text-on-surface">
                  {data?.nextAvailable ? `${data.nextAvailable.dayOffset === 0 ? '' : `${formatShortDate(fromDateKey(data.nextAvailable.dateKey))}, `}${formatSlot(data.nextAvailable.slot)}` : '—'}
                </strong>
              </span>
              <Link to={ROUTES.clinicPortal.schedule} className="inline-flex items-center gap-1 font-title-md text-title-md text-primary hover:text-primary-container">
                View full 7-day schedule grid
                <ArrowRight className="size-[18px]" aria-hidden="true" />
              </Link>
            </div>
          </Panel>

          <Panel
            title="Weekly Suite Capacity & Category Utilization"
            subtitle="Aggregate room demand and cosmetic device load (last 6 working days)"
            action={
              <div className="flex flex-wrap items-center gap-2 font-label-sm text-label-sm">
                <span className="text-on-surface-variant">Utilization:</span>
                <span className="flex items-center gap-1 text-outline"><span className="size-3 rounded-sm bg-surface-container-high" /> &lt;65%</span>
                <span className="flex items-center gap-1 text-secondary"><span className="size-3 rounded-sm bg-secondary-fixed" /> 80%</span>
                <span className="flex items-center gap-1 text-primary"><span className="size-3 rounded-sm bg-primary" /> 95%+</span>
              </div>
            }
          >
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <>
                <UtilizationHeatmap days={data.utilization.days} rows={data.utilization.rows} />
                <div className="mt-space-md flex flex-col items-center justify-between gap-space-xs rounded-lg bg-surface-container-low p-space-sm font-body-sm text-body-sm sm:flex-row">
                  <span className="flex items-center gap-2 text-on-surface-variant">
                    <Info className="size-[18px] text-secondary" aria-hidden="true" />
                    {data.utilization.insight}
                  </span>
                  <button
                    type="button"
                    onClick={() => toast.info('Suite rotation suggestions', 'Move laser follow-ups to morning sessions to balance afternoon demand.')}
                    className="shrink-0 font-label-md text-label-md font-semibold uppercase tracking-wider text-primary hover:text-primary-container"
                  >
                    Optimize Suite Rotations
                  </button>
                </div>
              </>
            )}
          </Panel>

          <section className="flex flex-col items-center gap-space-lg rounded-xl bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg lg:flex-row">
            <div className="relative h-56 w-full overflow-hidden rounded-lg shadow-inner lg:w-1/2">
              <img src={images.clinics.executiveSuite} alt="Executive treatment suite with travertine arches" className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-surface">
                <span className="rounded-full bg-surface-container-lowest/20 px-2 py-0.5 font-label-sm text-label-sm uppercase tracking-wider text-surface backdrop-blur-md">Suite 3 • Executive Suite</span>
                <p className="mt-1 font-title-md text-title-md font-medium text-surface">Inspected & Sanitized (Ready)</p>
              </div>
            </div>
            <div className="flex w-full flex-col justify-between lg:w-1/2">
              <div>
                <span className="font-label-md text-label-md font-semibold uppercase tracking-wider text-secondary">Suite Hygiene & Ambience Control</span>
                <h3 className="mt-1 font-headline-sm text-headline-sm text-on-surface">Smart Room Atmosphere Automation</h3>
                <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
                  Controlled air ionization (99.9% HEPA), ambient lighting preset to 2700K warmth, and private acoustic isolation active for all scheduled procedures.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3">
                <div className="flex flex-wrap items-center gap-3 font-body-sm text-body-sm text-on-surface">
                  <span>Temp: <strong>21.5°C</strong></span>
                  <span className="text-outline-variant">•</span>
                  <span>Aroma: <strong>Oud & White Amber</strong></span>
                </div>
                <button
                  type="button"
                  aria-label="Adjust suite ambience"
                  onClick={() => toast.info('Ambience controls', 'Suite IoT controls connect in a future release.')}
                  className="rounded-lg bg-surface-container p-2 text-primary hover:bg-surface-container-high"
                >
                  <SlidersHorizontal className="size-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-space-lg xl:col-span-4">
          <Panel
            titleSize="title"
            title="Specialists On Duty"
            subtitle="Live medical availability"
            action={<Badge tone="gold">{metrics ? `${metrics.occupancy.activeDoctors} In Branch` : '—'}</Badge>}
          >
            {loading ? (
              <RowSkeleton />
            ) : (
              <ul className="space-y-space-sm">
                {data.specialists.map((doctor) => (
                  <li key={doctor.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar src={doctor.headshot} name={doctor.name} size="md" status={doctor.state.tone} />
                      <div className="min-w-0">
                        <p className="truncate font-title-md text-title-md text-on-surface">{doctor.name}</p>
                        <p className={cn('truncate font-body-sm text-body-sm font-medium', doctor.state.tone === 'primary' ? 'text-primary' : doctor.state.tone === 'secondary' ? 'text-secondary' : 'text-on-surface-variant')}>
                          {doctor.state.label}
                        </p>
                      </div>
                    </div>
                    <Button to={doctor.state.action === 'Queue' ? ROUTES.clinicPortal.appointments : ROUTES.clinicPortal.doctors} variant="soft" size="xs">
                      {doctor.state.action}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            titleSize="title"
            title="Incoming App Bookings"
            subtitle="Instant booking approvals"
            action={
              <span className="flex size-6 items-center justify-center rounded-full bg-primary-fixed font-label-sm text-label-sm font-bold text-on-primary-fixed">{data?.incoming.length ?? 0}</span>
            }
          >
            {loading ? (
              <RowSkeleton />
            ) : data.incoming.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">No requests awaiting approval.</p>
            ) : (
              <ul className="space-y-space-sm">
                {data.incoming.map((appointment) => (
                  <li key={appointment.id} className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-space-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-title-md text-title-md text-on-surface">{appointment.patient?.name}</h4>
                        <p className="font-body-sm text-body-sm font-medium text-primary">{appointment.service?.shortTitle}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-secondary-fixed/40 px-2 py-0.5 font-label-sm text-label-sm font-semibold text-secondary">
                        {formatShortDate(fromDateKey(appointment.dateKey))}, {formatSlot(appointment.slot)}
                      </span>
                    </div>
                    {appointment.patientNotes && <p className="font-body-sm text-body-sm text-on-surface-variant">{appointment.patientNotes}</p>}
                    <div className="mt-1 flex items-center gap-2">
                      <Button size="sm" className="flex-1 shadow-none" onClick={() => handle('accept', appointment)}>
                        {appointment.patient?.tier?.includes('VIP') ? 'Accept VIP Slot' : 'Accept Slot'}
                      </Button>
                      <Button variant="soft" size="sm" onClick={() => handle('propose', appointment)}>
                        Propose Time
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            titleSize="title"
            title="Patient Experience Stream"
            subtitle="Real-time post-procedure feedback"
            action={<Sparkles className="size-[22px] text-secondary" aria-hidden="true" />}
          >
            {loading ? (
              <RowSkeleton />
            ) : data.reviews.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">No published reviews yet.</p>
            ) : (
              <ul className="space-y-space-md">
                {data.reviews.map((review) => (
                  <ReviewStreamItem key={review.id} review={review} onReply={onReply} />
                ))}
              </ul>
            )}
            <Link to={ROUTES.clinicPortal.reviews} className="mt-space-sm inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
              All patient reviews <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Panel>
        </div>
      </div>

      {dialogs}
      {clinicDetail.data && (
        <NewAppointmentModal
          key={clinicDetail.data.id}
          clinic={clinicDetail.data}
          isOpen={showNew}
          onClose={() => setShowNew(false)}
          onCreated={(appointment) => {
            toast.success('Appointment created', `${appointment.patient?.name} • ${formatSlot(appointment.slot)}`);
            refresh();
          }}
        />
      )}
    </>
  );
}
