import { useState } from 'react';
import { Ban, RotateCcw, UserRound, Users } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { FilterChip, Pagination, Tabs } from '@/components/common/Navigation';
import { ConfirmationModal } from '@/components/common/Overlay';
import { EmptyState, ErrorState } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { PAGE_SIZE } from '@/constants/config';
import { ROLE_LABELS, ROLES } from '@/constants/roles';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQueryState } from '@/hooks/useQueryState';
import { useToast } from '@/hooks/useToast';
import { getUsers, setUserStatus } from '@/services/userService';
import { cn } from '@/utils/cn';
import { formatDate, formatNumber, formatRelative, formatSaudiPhone } from '@/utils/format';
import { AdminPills, ChipRow, EntityCell, FilterBar, ListSkeleton, MetaDot, SearchField, StackedCell } from './components/AdminUI';
import { ROLE_TONES } from './components/adminMeta';
import { useUrlSearch } from './components/useUrlSearch';

const ROLE_TABS = [
  { value: 'all', label: 'All' },
  { value: ROLES.PATIENT, label: 'Patients' },
  { value: ROLES.CLINIC, label: 'Clinic' },
  { value: ROLES.DOCTOR, label: 'Doctors' },
  { value: ROLES.ADMIN, label: 'Admins' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

/** Platform accounts (FR-9): role tabs, status filter, search and suspend / reactivate. */
export default function AdminUsersPage() {
  useDocumentTitle('Users');
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [filters, setFilters] = useQueryState({ role: 'all', status: 'all', q: '', page: '1' });
  const [keyword, setKeyword] = useUrlSearch(filters.q, (q) => setFilters({ q }));
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, error, reload, setData } = useAsync(
    () => getUsers({ role: filters.role, status: filters.status, q: filters.q, page: Number(filters.page), pageSize: PAGE_SIZE.table }),
    [filters.role, filters.status, filters.q, filters.page],
    { keepPreviousData: true },
  );

  const suspending = target?.status === 'active';

  const confirmStatus = async () => {
    // Admins can never lock themselves out.
    if (!target || target.id === currentUser?.id) return;
    const nextStatus = suspending ? 'suspended' : 'active';
    setSaving(true);
    try {
      await setUserStatus(target.id, nextStatus);
      setData((prev) => ({ ...prev, items: prev.items.map((item) => (item.id === target.id ? { ...item, status: nextStatus } : item)) }));
      // A status filter may now exclude this row — refetch so the page stays consistent.
      if (filters.status !== 'all') reload();
      toast.success(
        nextStatus === 'suspended' ? 'Account suspended' : 'Account reactivated',
        nextStatus === 'suspended' ? `${target.name} can no longer sign in or book.` : `${target.name} can sign in again.`,
      );
      setTarget(null);
    } catch (err) {
      toast.error('Status not updated', err.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'user',
      header: 'User & contact',
      render: (account) => (
        <EntityCell
          className="max-w-64"
          media={<Avatar src={account.avatar} name={account.name} size="md" />}
          title={account.name}
          subtitle={account.email}
          meta={account.phone ? formatSaudiPhone(account.phone) : null}
        />
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (account) => (
        <div className="flex flex-col items-end gap-1 md:items-start">
          <Badge tone={ROLE_TONES[account.role]}>{ROLE_LABELS[account.role] ?? account.role}</Badge>
          {account.clinicName && <span className="max-w-40 truncate font-body-sm text-body-sm text-on-surface-variant">{account.clinicName}</span>}
        </div>
      ),
    },
    {
      key: 'activity',
      header: 'Joined',
      className: 'whitespace-nowrap',
      render: (account) => (
        <StackedCell primary={formatDate(account.createdAt)} secondary={account.lastLoginAt ? `Last login ${formatRelative(account.lastLoginAt)}` : 'Never signed in'} />
      ),
    },
    { key: 'appointments', header: 'Bookings', className: 'whitespace-nowrap', render: (account) => formatNumber(account.appointmentCount) },
    { key: 'status', header: 'Status', render: (account) => <StatusBadge type="user" status={account.status} size="sm" /> },
    {
      key: 'action',
      header: <span className="sr-only">Actions</span>,
      className: 'relative text-right [&_svg]:shrink-0',
      render: (account) => {
        if (account.id === currentUser?.id) {
          return (
            <Badge tone="plum" icon={UserRound}>
              You
            </Badge>
          );
        }
        return account.status === 'active' ? (
          <Button size="xs" variant="danger-soft" leftIcon={Ban} onClick={() => setTarget(account)} aria-label={`Suspend ${account.name}`}>
            Suspend
          </Button>
        ) : (
          <Button size="xs" variant="soft" leftIcon={RotateCcw} onClick={() => setTarget(account)} aria-label={`Reactivate ${account.name}`}>
            Reactivate
          </Button>
        );
      },
    },
  ];

  const counts = data?.counts;
  const activeRole = ROLE_TABS.find((tab) => tab.value === filters.role) ?? ROLE_TABS[0];

  return (
    <>
      <PageHeader
        pills={<AdminPills />}
        title="User Management"
        meta={
          <>
            <Users className="size-4 text-secondary" aria-hidden="true" />
            <span>{counts ? `${formatNumber(counts.all)} accounts` : 'Platform accounts'}</span>
            <MetaDot />
            <span>Patients, clinic staff, specialists and administrators</span>
          </>
        }
      />

      <Panel title={activeRole.value === 'all' ? 'All Accounts' : `${activeRole.label} Accounts`} subtitle={data ? `${formatNumber(data.total)} matching accounts` : 'Loading accounts…'}>
        <FilterBar>
          <Tabs
            label="Filter by role"
            value={activeRole.value}
            onChange={(role) => setFilters({ role })}
            tabs={ROLE_TABS.map((tab) => ({ ...tab, count: counts?.[tab.value] }))}
          />
          <SearchField value={keyword} onChange={setKeyword} label="Search users" placeholder="Search name, email or phone" />
        </FilterBar>
        <ChipRow label="Filter by account status" className="mb-space-md">
          {STATUS_FILTERS.map((option) => (
            <FilterChip key={option.value} active={filters.status === option.value} onClick={() => setFilters({ status: option.value })}>
              {option.label}
            </FilterChip>
          ))}
        </ChipRow>

        {error && !data ? (
          <ErrorState compact error={error} onRetry={reload} />
        ) : !data ? (
          <ListSkeleton label="Loading accounts" />
        ) : (
          <div className={cn('space-y-space-md transition-opacity', isLoading && 'opacity-60')}>
            <DataTable
              caption="Platform accounts"
              columns={columns}
              rows={data.items}
              empty={
                <EmptyState
                  compact
                  icon={Users}
                  title={filters.q ? `No accounts match “${filters.q}”` : 'No accounts found'}
                  description="Try another role, status or search term."
                />
              }
            />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              itemLabel="accounts"
              onChange={(page) => setFilters({ page: String(page) })}
            />
          </div>
        )}
      </Panel>

      <ConfirmationModal
        isOpen={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={confirmStatus}
        title={suspending ? `Suspend ${target?.name}?` : `Reactivate ${target?.name ?? 'account'}?`}
        description={
          suspending
            ? 'They will be signed out on their next request and cannot sign in or book until the account is reactivated. Existing appointments stay on record.'
            : 'They will be able to sign in and use the platform again.'
        }
        confirmLabel={suspending ? 'Suspend account' : 'Reactivate account'}
        cancelLabel="Cancel"
        tone={suspending ? 'danger' : 'primary'}
        loading={saving}
      />
    </>
  );
}
