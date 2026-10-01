import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CalendarRange,
  Clock,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Stethoscope,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RowSkeleton, Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, PageHeader, Panel, ProgressBar, StatCard } from '@/components/dashboard/DashboardUI';
import { ReviewCard } from '@/components/review/ReviewCards';
import { ROLE_LABELS } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { APPOINTMENT_STATUS_META } from '@/constants/status';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { moderateReview } from '@/services/reviewService';
import { getAdminOverview } from '@/services/userService';
import { fromDateKey, monthLabel, todayKey } from '@/utils/date';
import { formatLongDate, formatNumber, formatPrice, formatRelative, pluralize } from '@/utils/format';
import { AdminPills, EntityCell, MetaDot, PolicyNote, RatingCell, ReviewDecisionActions, Thumb } from './components/AdminUI';
import { REVIEW_DECISION_TOASTS, reviewProvenance, ROLE_TONES } from './components/adminMeta';

const STATUS_BAR_TONES = { pending: 'secondary', confirmed: 'primary', completed: 'primary', cancelled: 'error', no_show: 'error' };
const MODERATION_PREVIEW = 3;

const reviewQueueLink = (clinicId) => `${ROUTES.admin.clinics}?status=pending&review=${clinicId}`;

function OverviewSkeleton() {
  return (
    <>
      <section className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className={index === 6 ? 'h-36 rounded-xl sm:col-span-2' : 'h-36 rounded-xl'} />
        ))}
      </section>
      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12" role="status">
        <span className="sr-only">Loading platform overview</span>
        <div className="flex flex-col gap-space-lg xl:col-span-8">
          <Panel title="Pending Clinic Verifications">
            <div className="space-y-space-sm">
              <RowSkeleton />
              <RowSkeleton />
            </div>
          </Panel>
          <Panel title="Moderation Queue">
            <Skeleton className="h-40 w-full rounded-xl" />
          </Panel>
        </div>
        <div className="flex flex-col gap-space-lg xl:col-span-4">
          <Panel title="Appointment Status Mix" titleSize="title">
            <div className="space-y-space-md">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function PendingClinicRow({ clinic }) {
  return (
    <li className="relative flex flex-col gap-space-sm overflow-hidden rounded-xl bg-surface-container-low p-space-md transition-colors hover:bg-surface-container sm:flex-row sm:items-center sm:justify-between">
      <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-secondary" aria-hidden="true" />
      <div className="flex min-w-0 items-start gap-space-md pl-1 sm:items-center">
        <Thumb src={clinic.coverImage} className="size-14" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-title-md text-title-md text-on-surface">{clinic.name}</span>
            <StatusBadge type="clinic" status={clinic.verificationStatus} size="sm" />
          </div>
          <p className="mt-0.5 font-body-sm text-body-sm font-medium text-primary">
            {clinic.districtLabel} • {clinic.licenseNumber}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Clock className="size-[15px] text-outline" aria-hidden="true" />
              Submitted {formatRelative(clinic.submittedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="size-[15px] text-outline" aria-hidden="true" />
              {pluralize(clinic.documents.length, 'document')}
            </span>
          </p>
        </div>
      </div>
      <Button to={reviewQueueLink(clinic.id)} size="sm" rightIcon={ArrowRight} className="self-start shadow-none sm:self-auto" aria-label={`Review ${clinic.name}`}>
        Review
      </Button>
    </li>
  );
}

function StatusMix({ breakdown }) {
  const total = breakdown.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="space-y-space-md">
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        <span className="font-headline-sm text-headline-sm text-on-surface">{formatNumber(total)}</span> bookings on record
      </p>
      <ul className="space-y-space-sm">
        {breakdown.map(({ status, count }) => {
          const label = APPOINTMENT_STATUS_META[status]?.label ?? status;
          const percent = total ? Math.round((count / total) * 100) : 0;
          return (
            <li key={status} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 font-label-md text-label-md text-on-surface">
                <span>{label}</span>
                <span className="text-on-surface-variant">
                  <span className="font-bold text-on-surface">{formatNumber(count)}</span> · {percent}%
                </span>
              </div>
              <ProgressBar value={count} max={total || 1} tone={STATUS_BAR_TONES[status]} label={`${label}: ${count} of ${total} bookings`} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const TOP_CLINIC_COLUMNS = [
  {
    key: 'clinic',
    header: 'Clinic',
    render: (clinic) => (
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-6 shrink-0 font-headline-sm text-title-md text-secondary">{String(clinic.rank).padStart(2, '0')}</span>
        <EntityCell
          media={<Thumb src={clinic.coverImage} className="size-10" />}
          title={
            <Link to={ROUTES.clinic(clinic.id)} className="transition-colors hover:text-primary">
              {clinic.name}
            </Link>
          }
          subtitle={clinic.districtLabel}
        />
      </div>
    ),
  },
  {
    key: 'rating',
    header: 'Rating',
    className: 'whitespace-nowrap',
    render: (clinic) => <RatingCell value={clinic.rating} count={clinic.reviewCount} />,
  },
  { key: 'bookings', header: 'Bookings', className: 'whitespace-nowrap', render: (clinic) => formatNumber(clinic.bookings) },
  {
    key: 'from',
    header: 'Treatments from',
    className: 'whitespace-nowrap',
    render: (clinic) => formatPrice(clinic.lowestServicePrice ?? clinic.startingPrice),
  },
];

/** Admin home: platform KPIs, verification & moderation queues, booking mix, top clinics, new accounts. */
export default function AdminDashboardPage() {
  useDocumentTitle('Admin Overview');
  const toast = useToast();
  const { data, isLoading, error, reload, setData } = useAsync(getAdminOverview, []);

  const today = todayKey();
  const [year, month] = today.split('-').map(Number);
  const metrics = data?.metrics;

  const moderate = async (review, status) => {
    // Optimistic: drop the card straight away, put it back if the call fails.
    setData((prev) => ({
      ...prev,
      moderationQueue: prev.moderationQueue.filter((item) => item.id !== review.id),
      metrics: { ...prev.metrics, pendingReviews: Math.max(0, prev.metrics.pendingReviews - 1) },
    }));
    try {
      await moderateReview(review.id, status);
      const copy = REVIEW_DECISION_TOASTS[`pending>${status}`];
      toast.success(copy.title, copy.text(review.clinic?.name ?? 'the clinic profile'));
    } catch (err) {
      setData((prev) => ({
        ...prev,
        moderationQueue: [review, ...prev.moderationQueue],
        metrics: { ...prev.metrics, pendingReviews: prev.metrics.pendingReviews + 1 },
      }));
      toast.error('Moderation not saved', err.message);
    }
  };

  return (
    <>
      <PageHeader
        pills={<AdminPills />}
        title="Platform Overview"
        meta={
          <>
            <CalendarDays className="size-4 text-secondary" aria-hidden="true" />
            <span>{formatLongDate(fromDateKey(today))}</span>
            <MetaDot />
            <span>Riyadh, Kingdom of Saudi Arabia (GMT+3)</span>
          </>
        }
        actions={
          <>
            <Button to={ROUTES.admin.reviews} variant="tonal" leftIcon={MessageSquareText}>
              Review Moderation{metrics?.pendingReviews ? ` (${metrics.pendingReviews})` : ''}
            </Button>
            <Button to={`${ROUTES.admin.clinics}?status=pending`} leftIcon={ShieldCheck}>
              Clinic Verification{metrics?.pendingClinics ? ` (${metrics.pendingClinics})` : ''}
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState title="We couldn’t load the platform overview" error={error} onRetry={reload} />
      ) : isLoading || !data ? (
        <OverviewSkeleton />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4" aria-label="Platform metrics">
            <StatCard label="Verified Clinics" value={formatNumber(metrics.verifiedClinics)} icon={BadgeCheck} glow="gold" footer="Listed in public search" />
            <StatCard
              label="Pending Verifications"
              value={formatNumber(metrics.pendingClinics)}
              accent={metrics.pendingClinics ? 'Action needed' : 'Queue clear'}
              icon={ShieldCheck}
              iconTone="secondary"
              glow="plum"
              footer={
                <Link to={`${ROUTES.admin.clinics}?status=pending`} className="text-primary hover:underline">
                  Open verification queue
                </Link>
              }
            />
            <StatCard label="Patients" value={formatNumber(metrics.patients)} icon={Users} glow="champagne" footer="Registered patient accounts" />
            <StatCard label="Active Doctors" value={formatNumber(metrics.doctors)} icon={Stethoscope} iconTone="secondary" glow="blush" footer="SCFHS-licensed specialists" />
            <StatCard label="Appointments This Month" value={formatNumber(metrics.appointmentsThisMonth)} icon={CalendarRange} glow="gold" footer={monthLabel(year, month - 1)} />
            <StatCard
              label="Reviews in Moderation"
              value={formatNumber(metrics.pendingReviews)}
              icon={MessageSquareText}
              iconTone="secondary"
              glow="plum"
              footer={
                <Link to={ROUTES.admin.reviews} className="text-primary hover:underline">
                  Moderate reviews
                </Link>
              }
            />
            <StatCard
              label="Completed Booking Value"
              value={formatNumber(metrics.completedValue)}
              unit="SAR"
              icon={Wallet}
              glow="champagne"
              footer="Completed visits across verified clinics"
              className="sm:col-span-2"
            />
          </section>

          <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
            <div className="flex min-w-0 flex-col gap-space-lg xl:col-span-8">
              <Panel
                title="Pending Clinic Verifications"
                subtitle="MOH license and document checks before a clinic goes live"
                action={
                  <Button to={`${ROUTES.admin.clinics}?status=pending`} variant="ghost" size="sm" rightIcon={ArrowRight} className="text-primary">
                    Verification queue
                  </Button>
                }
              >
                {data.pendingClinics.length ? (
                  <ul className="space-y-space-sm">
                    {data.pendingClinics.map((clinic) => (
                      <PendingClinicRow key={clinic.id} clinic={clinic} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState compact icon={BadgeCheck} title="No clinics awaiting verification" description="New clinic registrations will appear here for review." />
                )}
              </Panel>

              <Panel
                title="Moderation Queue"
                subtitle="Verified-patient reviews awaiting publication"
                action={
                  <Button to={ROUTES.admin.reviews} variant="ghost" size="sm" rightIcon={ArrowRight} className="text-primary">
                    All reviews{metrics.pendingReviews > MODERATION_PREVIEW ? ` (${metrics.pendingReviews})` : ''}
                  </Button>
                }
              >
                {data.moderationQueue.length ? (
                  <div className="space-y-space-sm">
                    {data.moderationQueue.slice(0, MODERATION_PREVIEW).map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        showClinic
                        className="bg-surface-container-low p-space-md"
                        actions={<ReviewDecisionActions review={review} onDecide={moderate} note={reviewProvenance(review)} />}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState compact icon={MessageSquareText} title="Moderation queue is clear" description="New patient reviews will appear here before they are published." />
                )}
              </Panel>

              <Panel title="Top Rated Clinics" subtitle="Verified clinics by patient rating">
                <DataTable
                  caption="Top rated verified clinics"
                  columns={TOP_CLINIC_COLUMNS}
                  rows={data.topClinics.map((clinic, index) => ({ ...clinic, rank: index + 1 }))}
                  empty={<EmptyState compact title="No verified clinics yet" description="Approved clinics will be ranked here." />}
                />
              </Panel>
            </div>

            <div className="flex min-w-0 flex-col gap-space-lg xl:col-span-4">
              <Panel title="Appointment Status Mix" subtitle="All bookings across the platform" titleSize="title">
                <StatusMix breakdown={data.statusBreakdown} />
              </Panel>

              <Panel
                title="Newest Accounts"
                titleSize="title"
                action={
                  <Button to={ROUTES.admin.users} variant="ghost" size="xs" className="text-primary">
                    All users
                  </Button>
                }
              >
                <ul className="space-y-space-xs">
                  {data.recentUsers.map((account) => (
                    <li key={account.id} className="flex items-center gap-3 rounded-lg bg-surface-container-low p-2.5">
                      <Avatar src={account.avatar} name={account.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-title-md text-title-md text-on-surface">{account.name}</p>
                        <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{account.email}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge tone={ROLE_TONES[account.role]}>{ROLE_LABELS[account.role]}</Badge>
                          <span className="font-label-sm text-label-sm text-outline">Joined {formatRelative(account.createdAt)}</span>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              <PolicyNote>
                Only clinics verified by the committee appear in public search and can accept bookings. Suspending a clinic hides it immediately.
              </PolicyNote>
            </div>
          </div>
        </>
      )}
    </>
  );
}
