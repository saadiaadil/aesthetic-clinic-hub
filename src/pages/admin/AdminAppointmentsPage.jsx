import { useState } from 'react';
import { CalendarDays, Eye, Stethoscope } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { SelectInput } from '@/components/common/Form';
import { FilterChip, Pagination } from '@/components/common/Navigation';
import { EmptyState, ErrorState } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { APPOINTMENT_STATUS_META } from '@/constants/status';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQueryState } from '@/hooks/useQueryState';
import { getAdminAppointments } from '@/services/appointmentService';
import { getAdminClinics } from '@/services/clinicService';
import { cn } from '@/utils/cn';
import { fromDateKey } from '@/utils/date';
import { formatDate, formatNumber, formatPrice, formatSlot } from '@/utils/format';
import { AdminPills, ChipRow, EntityCell, FilterBar, ListSkeleton, MetaDot, SearchField, StackedCell } from './components/AdminUI';
import { AppointmentDetailModal } from './components/AppointmentDetailModal';
import { formatReference } from './components/adminMeta';
import { useUrlSearch } from './components/useUrlSearch';

const PAGE_SIZE = 10;
const STATUS_ORDER = ['pending', 'confirmed', 'rescheduled', 'checked_in', 'in_session', 'completed', 'cancelled', 'no_show'];

/** Platform-wide booking oversight: status mix, clinic filter, search and full booking records. */
export default function AdminAppointmentsPage() {
  useDocumentTitle('Appointments');
  const [filters, setFilters] = useQueryState({ status: 'all', clinicId: 'all', q: '', page: '1' });
  const [keyword, setKeyword] = useUrlSearch(filters.q, (q) => setFilters({ q }));
  const [selected, setSelected] = useState(null);

  const { data, isLoading, error, reload } = useAsync(
    () => getAdminAppointments({ status: filters.status, clinicId: filters.clinicId, q: filters.q, page: Number(filters.page), pageSize: PAGE_SIZE }),
    [filters.status, filters.clinicId, filters.q, filters.page],
    { keepPreviousData: true },
  );
  const { data: clinics = [] } = useAsync(() => getAdminClinics(), []);

  const counts = data?.counts ?? {};
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const statusChips = [{ value: 'all', label: 'All', count: total }, ...STATUS_ORDER.map((status) => ({ value: status, label: APPOINTMENT_STATUS_META[status].label, count: counts[status] ?? 0 }))];

  const columns = [
    {
      key: 'patient',
      header: 'Patient & reference',
      render: (apt) => (
        <EntityCell
          className="max-w-52"
          media={<Avatar src={apt.patient?.avatar} name={apt.patient?.name ?? 'Patient'} size="sm" />}
          title={apt.patient?.name ?? 'Unknown patient'}
          subtitle={formatReference(apt.id)}
        />
      ),
    },
    {
      key: 'treatment',
      header: 'Treatment & price',
      render: (apt) => (
        <StackedCell
          className="max-w-44"
          primary={apt.service?.title ?? apt.treatment?.name ?? '—'}
          secondary={formatPrice(apt.priceCharged, { currency: apt.currency ?? 'SAR' })}
        />
      ),
    },
    {
      key: 'clinic',
      header: 'Clinic & doctor',
      render: (apt) => (
        <div className="min-w-0 max-w-44">
          <p className="truncate font-body-sm text-body-sm font-medium text-on-surface">{apt.clinic?.name ?? '—'}</p>
          {apt.doctor && (
            <p className="flex items-center justify-end gap-1 font-body-sm text-body-sm text-on-surface-variant md:justify-start">
              <Stethoscope className="size-3.5 shrink-0 text-outline" aria-hidden="true" />
              <span className="truncate">{apt.doctor.name}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date & time',
      className: 'whitespace-nowrap',
      render: (apt) => <StackedCell primary={formatDate(fromDateKey(apt.dateKey))} secondary={`${formatSlot(apt.slot)} AST`} />,
    },
    { key: 'status', header: 'Status', className: 'whitespace-nowrap', render: (apt) => <StatusBadge status={apt.status} size="sm" /> },
    {
      key: 'action',
      header: <span className="sr-only">Actions</span>,
      className: 'relative text-right [&_svg]:shrink-0',
      render: (apt) => (
        <Button size="xs" variant="soft" leftIcon={Eye} onClick={() => setSelected(apt)} aria-label={`View booking ${formatReference(apt.id)}`}>
          View
        </Button>
      ),
    },
  ];

  const activeStatus = statusChips.find((chip) => chip.value === filters.status) ?? statusChips[0];

  return (
    <>
      <PageHeader
        pills={<AdminPills />}
        title="Platform Appointments"
        meta={
          <>
            <CalendarDays className="size-4 text-secondary" aria-hidden="true" />
            <span>{data ? `${formatNumber(total)} bookings across all clinics` : 'Bookings across all clinics'}</span>
            <MetaDot />
            <span>Riyadh time (GMT+3)</span>
          </>
        }
      />

      <Panel
        title={activeStatus.value === 'all' ? 'All Bookings' : activeStatus.label}
        subtitle={data ? `${formatNumber(data.total)} matching bookings` : 'Loading bookings…'}
      >
        <ChipRow label="Filter by appointment status" className="mb-space-sm">
          {statusChips.map((chip) => (
            <FilterChip key={chip.value} active={filters.status === chip.value} onClick={() => setFilters({ status: chip.value })}>
              {chip.label}
              {data && <span className="opacity-80">({chip.count})</span>}
            </FilterChip>
          ))}
        </ChipRow>
        <FilterBar>
          <SelectInput
            aria-label="Filter by clinic"
            value={filters.clinicId}
            onChange={(event) => setFilters({ clinicId: event.target.value })}
            className="w-full lg:w-72"
          >
            <option value="all">All clinics</option>
            {[...clinics]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
          </SelectInput>
          <SearchField value={keyword} onChange={setKeyword} label="Search appointments" placeholder="Search patient, clinic or doctor" />
        </FilterBar>

        {error && !data ? (
          <ErrorState compact error={error} onRetry={reload} />
        ) : !data ? (
          <ListSkeleton label="Loading appointments" />
        ) : (
          <div className={cn('space-y-space-md transition-opacity', isLoading && 'opacity-60')}>
            <DataTable
              caption="Appointments"
              columns={columns}
              rows={data.items}
              empty={
                <EmptyState
                  compact
                  icon={CalendarDays}
                  title={filters.q ? `No bookings match “${filters.q}”` : 'No bookings in this view'}
                  description="Try another status, clinic or search term."
                />
              }
            />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              itemLabel="bookings"
              onChange={(page) => setFilters({ page: String(page) })}
            />
          </div>
        )}
      </Panel>

      <AppointmentDetailModal appointment={selected} onClose={() => setSelected(null)} />
    </>
  );
}
