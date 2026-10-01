import { useState } from 'react';
import { Building2, ExternalLink, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Navigation';
import { ConfirmationModal } from '@/components/common/Overlay';
import { EmptyState, ErrorState } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQueryState } from '@/hooks/useQueryState';
import { useToast } from '@/hooks/useToast';
import { getAdminClinics, setClinicStatus } from '@/services/clinicService';
import { cn } from '@/utils/cn';
import { formatDate, formatRelative, pluralize } from '@/utils/format';
import { AdminPills, EntityCell, FilterBar, ListSkeleton, MetaDot, PolicyNote, SearchField, StackedCell, Thumb } from './components/AdminUI';
import { ClinicReviewModal } from './components/ClinicReviewModal';
import { useUrlSearch } from './components/useUrlSearch';

const STATUS_TABS = [
  { value: 'pending', label: 'Pending', title: 'Awaiting Verification', empty: 'No applications are waiting for review.' },
  { value: 'verified', label: 'Verified', title: 'Verified Clinics', empty: 'No verified clinics match your search.' },
  { value: 'rejected', label: 'Rejected', title: 'Rejected Applications', empty: 'No rejected applications.' },
  { value: 'suspended', label: 'Suspended', title: 'Suspended Clinics', empty: 'No clinics are suspended.' },
  { value: 'all', label: 'All', title: 'All Clinics', empty: 'No clinics match your search.' },
];

const DECISION_TOASTS = {
  verified: { title: 'Clinic verified', text: (name) => `${name} is now listed in public search and can accept bookings.` },
  rejected: { title: 'Application rejected', text: (name) => `${name} stays hidden. The reason is saved on the application.` },
  suspended: { title: 'Clinic suspended', text: (name) => `${name} has been removed from public search.` },
};
const REINSTATE_TOAST = { title: 'Clinic reinstated', text: (name) => `${name} is visible in public search again.` };

/** Clinic registration & approval (FR-3): verification queue, application review and status decisions. */
export default function AdminClinicsPage() {
  useDocumentTitle('Clinic Verification');
  const { user } = useAuth();
  const toast = useToast();
  const [filters, setFilters] = useQueryState({ status: 'pending', q: '', review: '' });
  const [keyword, setKeyword] = useUrlSearch(filters.q, (q) => setFilters({ q }));
  const [pendingAction, setPendingAction] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);

  // One request per search; tab filtering and counts are derived locally so tabs switch instantly.
  const { data: clinics, isLoading, error, reload, setData } = useAsync(() => getAdminClinics({ q: filters.q }), [filters.q], { keepPreviousData: true });

  const tab = STATUS_TABS.find((item) => item.value === filters.status) ?? STATUS_TABS[0];
  const all = clinics ?? [];
  const counts = all.reduce((acc, clinic) => ({ ...acc, [clinic.verificationStatus]: (acc[clinic.verificationStatus] ?? 0) + 1 }), { all: all.length });
  const rows = tab.value === 'all' ? all : all.filter((clinic) => clinic.verificationStatus === tab.value);
  const selected = filters.review ? (all.find((clinic) => clinic.id === filters.review) ?? null) : null;

  const openReview = (clinicId) => setFilters({ review: clinicId });
  const closeReview = () => setFilters({ review: '' });

  const decide = async (clinic, status, reason = '') => {
    const previous = clinic.verificationStatus;
    setPendingAction(status);
    try {
      const updated = await setClinicStatus(clinic.id, { status, reason, adminId: user.id });
      setData((list) =>
        list.map((item) =>
          item.id === clinic.id
            ? {
                ...item,
                verificationStatus: updated?.verificationStatus ?? status,
                rejectionReason: updated?.rejectionReason ?? (status === 'rejected' ? reason : null),
                verifiedAt: updated?.verifiedAt ?? null,
              }
            : item,
        ),
      );
      const copy = status === 'verified' && previous !== 'pending' ? REINSTATE_TOAST : DECISION_TOASTS[status];
      toast.success(copy.title, copy.text(clinic.name));
      closeReview();
      return true;
    } catch (err) {
      toast.error('Decision not saved', err.message);
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  const askSuspend = (clinic) => {
    setSuspendTarget(clinic);
    closeReview();
  };
  const cancelSuspend = () => {
    const clinicId = suspendTarget?.id;
    setSuspendTarget(null);
    if (clinicId) openReview(clinicId);
  };
  const confirmSuspend = async () => {
    const ok = await decide(suspendTarget, 'suspended');
    if (ok) setSuspendTarget(null);
  };

  const columns = [
    {
      key: 'clinic',
      header: 'Clinic',
      render: (clinic) => <EntityCell className="max-w-60" media={<Thumb src={clinic.coverImage} />} title={clinic.name} subtitle={clinic.districtLabel} />,
    },
    {
      key: 'license',
      header: 'Licensing',
      className: 'whitespace-nowrap',
      render: (clinic) => (
        <div>
          <p className="font-label-md text-label-md text-on-surface">{clinic.licenseNumber}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">CR {clinic.crNumber ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (clinic) => (clinic.owner ? <StackedCell className="max-w-48" primary={clinic.owner.name} secondary={clinic.owner.email} /> : '—'),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      className: 'whitespace-nowrap',
      render: (clinic) => <StackedCell primary={formatDate(clinic.submittedAt)} secondary={formatRelative(clinic.submittedAt)} />,
    },
    { key: 'status', header: 'Status', render: (clinic) => <StatusBadge type="clinic" status={clinic.verificationStatus} size="sm" /> },
    {
      key: 'action',
      header: <span className="sr-only">Actions</span>,
      className: 'relative text-right [&_svg]:shrink-0',
      render: (clinic) => (
        <Button
          size="xs"
          variant={clinic.verificationStatus === 'pending' ? 'primary' : 'soft'}
          onClick={() => openReview(clinic.id)}
          aria-label={`Review ${clinic.name}`}
          className="shadow-none"
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        pills={
          <AdminPills>
            {counts.pending > 0 && (
              <Badge tone="neutral" size="md">
                {pluralize(counts.pending, 'application')} awaiting review
              </Badge>
            )}
          </AdminPills>
        }
        title="Clinic Verification"
        meta={
          <>
            <ShieldCheck className="size-4 text-secondary" aria-hidden="true" />
            <span>Clinic registration & approval</span>
            <MetaDot />
            <span>MOH license, commercial registration and document checks</span>
          </>
        }
        actions={
          <Button href={ROUTES.clinics} target="_blank" rel="noopener noreferrer" variant="tonal" rightIcon={ExternalLink}>
            Public directory
          </Button>
        }
      />

      <PolicyNote>
        Only verified clinics appear in public search and can receive bookings. Pending, rejected and suspended clinics are hidden from patients.
      </PolicyNote>

      <Panel title={tab.title} subtitle={clinics ? pluralize(rows.length, 'clinic') : 'Loading clinics…'}>
        <FilterBar>
          <Tabs
            label="Verification status"
            value={tab.value}
            onChange={(status) => setFilters({ status })}
            tabs={STATUS_TABS.map((item) => ({ value: item.value, label: item.label, count: clinics ? (counts[item.value] ?? 0) : undefined }))}
          />
          <SearchField value={keyword} onChange={setKeyword} label="Search clinics" placeholder="Search clinic or license" />
        </FilterBar>

        {error && !clinics ? (
          <ErrorState compact error={error} onRetry={reload} />
        ) : !clinics ? (
          <ListSkeleton label="Loading clinics" />
        ) : (
          <div className={cn('transition-opacity', isLoading && 'opacity-60')}>
            <DataTable
              caption={tab.title}
              columns={columns}
              rows={rows}
              empty={<EmptyState compact icon={Building2} title={filters.q ? `No clinics match “${filters.q}”` : 'Nothing here'} description={tab.empty} />}
            />
          </div>
        )}
      </Panel>

      <ClinicReviewModal
        clinic={selected}
        onClose={closeReview}
        onDecision={decide}
        onSuspend={askSuspend}
        onViewDocument={(doc) => toast.info('Document preview available with the secure document store (Phase 5)', doc.fileName)}
        pendingAction={pendingAction}
      />

      <ConfirmationModal
        isOpen={Boolean(suspendTarget)}
        onClose={cancelSuspend}
        onConfirm={confirmSuspend}
        title={`Suspend ${suspendTarget?.name ?? 'clinic'}?`}
        description="The clinic is removed from public search immediately and cannot accept new bookings until it is reinstated. Existing appointments stay on record."
        confirmLabel="Suspend clinic"
        cancelLabel="Keep verified"
        tone="danger"
        loading={pendingAction === 'suspended'}
      />
    </>
  );
}
