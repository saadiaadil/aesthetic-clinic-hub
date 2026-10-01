import { useState } from 'react';
import { Ban, BadgeCheck, ExternalLink, RotateCcw, Stethoscope } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { FilterChip } from '@/components/common/Navigation';
import { ConfirmationModal } from '@/components/common/Overlay';
import { EmptyState, ErrorState } from '@/components/common/States';
import { DataTable, PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQueryState } from '@/hooks/useQueryState';
import { useToast } from '@/hooks/useToast';
import { getAdminDoctors, setDoctorStatus } from '@/services/doctorService';
import { cn } from '@/utils/cn';
import { pluralize } from '@/utils/format';
import { AdminPills, ChipRow, EntityCell, FilterBar, ListSkeleton, RatingCell, SearchField, StackedCell } from './components/AdminUI';
import { DOCTOR_STATUS_META } from './components/adminMeta';
import { useUrlSearch } from './components/useUrlSearch';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const STATUS_TOASTS = {
  approve: { title: 'Doctor approved', text: (name) => `${name} is now active and bookable at their clinic.` },
  suspend: { title: 'Doctor suspended', text: (name) => `${name} is hidden from the directory and cannot receive bookings.` },
  reactivate: { title: 'Doctor reactivated', text: (name) => `${name} is active again.` },
};

function DoctorStatusBadge({ status }) {
  const meta = DOCTOR_STATUS_META[status] ?? { label: status, tone: 'neutral' };
  return (
    <Badge tone={meta.tone} icon={meta.icon} className="gap-1.5 font-semibold">
      {meta.label}
    </Badge>
  );
}

/** Specialist registry: SCFHS credentials, approval of new doctors, suspension and reactivation. */
export default function AdminDoctorsPage() {
  useDocumentTitle('Doctors');
  const toast = useToast();
  const [filters, setFilters] = useQueryState({ status: 'all', q: '' });
  const [keyword, setKeyword] = useUrlSearch(filters.q, (q) => setFilters({ q }));
  const [busyId, setBusyId] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);

  // Status chips filter locally so their counts always reflect the current search.
  const { data: doctors, isLoading, error, reload, setData } = useAsync(() => getAdminDoctors({ q: filters.q }), [filters.q], { keepPreviousData: true });

  const all = doctors ?? [];
  const counts = all.reduce((acc, doctor) => ({ ...acc, [doctor.status]: (acc[doctor.status] ?? 0) + 1 }), { all: all.length });
  const status = STATUS_FILTERS.some((option) => option.value === filters.status) ? filters.status : 'all';
  const rows = status === 'all' ? all : all.filter((doctor) => doctor.status === status);

  const changeStatus = async (doctor, nextStatus, action) => {
    setBusyId(doctor.id);
    try {
      const updated = await setDoctorStatus(doctor.id, nextStatus);
      setData((list) => list.map((item) => (item.id === doctor.id ? { ...item, status: updated?.status ?? nextStatus } : item)));
      toast.success(STATUS_TOASTS[action].title, STATUS_TOASTS[action].text(doctor.name));
      return true;
    } catch (err) {
      toast.error('Status not updated', err.message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const confirmSuspend = async () => {
    const ok = await changeStatus(suspendTarget, 'suspended', 'suspend');
    if (ok) setSuspendTarget(null);
  };

  const columns = [
    {
      key: 'doctor',
      header: 'Doctor',
      render: (doctor) => (
        <EntityCell
          className="max-w-64"
          media={<Avatar src={doctor.headshot} name={doctor.name} size="md" />}
          title={
            doctor.status === 'active' ? (
              <a
                href={ROUTES.doctor(doctor.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-primary"
                aria-label={`${doctor.name} — open public profile (new tab)`}
              >
                {doctor.name}
                <ExternalLink className="ml-1 inline size-3.5 align-middle text-outline" aria-hidden="true" />
              </a>
            ) : (
              doctor.name
            )
          }
          subtitle={doctor.title}
        />
      ),
    },
    {
      key: 'specialization',
      header: 'Specialty & license',
      render: (doctor) => (
        <div className="min-w-0 max-w-48">
          <p className="font-body-sm text-body-sm font-medium text-on-surface">{doctor.specialization}</p>
          <p className="whitespace-nowrap font-label-sm text-label-sm text-on-surface-variant">{doctor.scfhsLicense ?? 'No SCFHS license'}</p>
        </div>
      ),
    },
    {
      key: 'clinic',
      header: 'Clinic',
      render: (doctor) => (doctor.clinic ? <StackedCell className="max-w-40" primary={doctor.clinic.name} secondary={doctor.clinic.districtLabel} /> : '—'),
    },
    {
      key: 'rating',
      header: 'Rating',
      className: 'whitespace-nowrap',
      render: (doctor) =>
        doctor.reviewCount ? <RatingCell value={doctor.rating} count={doctor.reviewCount} /> : <span className="text-on-surface-variant">New</span>,
    },
    { key: 'status', header: 'Status', render: (doctor) => <DoctorStatusBadge status={doctor.status} /> },
    {
      key: 'action',
      header: <span className="sr-only">Actions</span>,
      className: 'relative text-right [&_svg]:shrink-0',
      render: (doctor) => {
        const busy = busyId === doctor.id;
        return (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {doctor.status === 'pending' && (
              <Button size="xs" leftIcon={BadgeCheck} loading={busy} onClick={() => changeStatus(doctor, 'active', 'approve')} aria-label={`Approve ${doctor.name}`} className="shadow-none">
                Approve
              </Button>
            )}
            {doctor.status === 'active' && (
              <Button size="xs" variant="danger-soft" leftIcon={Ban} disabled={busy} onClick={() => setSuspendTarget(doctor)} aria-label={`Suspend ${doctor.name}`}>
                Suspend
              </Button>
            )}
            {(doctor.status === 'suspended' || doctor.status === 'inactive') && (
              <Button size="xs" variant="soft" leftIcon={RotateCcw} loading={busy} onClick={() => changeStatus(doctor, 'active', 'reactivate')} aria-label={`Reactivate ${doctor.name}`}>
                Reactivate
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        pills={
          <AdminPills>
            {counts.pending > 0 && (
              <Badge tone="neutral" size="md">
                {pluralize(counts.pending, 'doctor')} pending approval
              </Badge>
            )}
          </AdminPills>
        }
        title="Doctors & Credentials"
        meta={
          <>
            <Stethoscope className="size-4 text-secondary" aria-hidden="true" />
            <span>SCFHS-licensed specialists across partner clinics</span>
          </>
        }
      />

      <Panel title="Specialist Registry" subtitle={doctors ? pluralize(rows.length, 'doctor') : 'Loading doctors…'}>
        <FilterBar>
          <ChipRow label="Filter by doctor status">
            {STATUS_FILTERS.map((option) => (
              <FilterChip key={option.value} active={status === option.value} onClick={() => setFilters({ status: option.value })}>
                {option.label}
                {doctors && <span className="opacity-80">({counts[option.value] ?? 0})</span>}
              </FilterChip>
            ))}
          </ChipRow>
          <SearchField value={keyword} onChange={setKeyword} label="Search doctors" placeholder="Search name or license" />
        </FilterBar>

        {error && !doctors ? (
          <ErrorState compact error={error} onRetry={reload} />
        ) : !doctors ? (
          <ListSkeleton label="Loading doctors" />
        ) : (
          <div className={cn('transition-opacity', isLoading && 'opacity-60')}>
            <DataTable
              caption="Doctors"
              columns={columns}
              rows={rows}
              empty={
                <EmptyState
                  compact
                  icon={Stethoscope}
                  title={filters.q ? `No doctors match “${filters.q}”` : 'No doctors in this status'}
                  description="Try another status or search term."
                />
              }
            />
          </div>
        )}
      </Panel>

      <ConfirmationModal
        isOpen={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        onConfirm={confirmSuspend}
        title={`Suspend ${suspendTarget?.name ?? 'doctor'}?`}
        description="They are removed from the public directory and booking flow until reactivated. Existing appointments stay on record."
        confirmLabel="Suspend doctor"
        cancelLabel="Cancel"
        tone="danger"
        loading={busyId === suspendTarget?.id}
      />
    </>
  );
}
