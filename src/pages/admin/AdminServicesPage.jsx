import { useState } from 'react';
import { Layers, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { FilterChip } from '@/components/common/Navigation';
import { ConfirmationModal } from '@/components/common/Overlay';
import { EmptyState, ErrorState } from '@/components/common/States';
import { DataTable, PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { specialties } from '@/data/treatments';
import { useAsync } from '@/hooks/useAsync';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQueryState } from '@/hooks/useQueryState';
import { useToast } from '@/hooks/useToast';
import { deleteTreatment, getAdminTreatments } from '@/services/treatmentService';
import { cn } from '@/utils/cn';
import { formatPrice, pluralize } from '@/utils/format';
import { AdminPills, ChipRow, EntityCell, FilterBar, ListSkeleton, MetaDot, PolicyNote, SearchField, StackedCell, Thumb } from './components/AdminUI';
import { TreatmentFormModal } from './components/TreatmentFormModal';
import { useUrlSearch } from './components/useUrlSearch';

const SPECIALTY_LABELS = Object.fromEntries(specialties.map((item) => [item.id, item.shortLabel]));

/** Global treatment catalog (FR-9): the services every clinic lists its prices against. */
export default function AdminServicesPage() {
  useDocumentTitle('Service Catalog');
  const toast = useToast();
  const [filters, setFilters] = useQueryState({ specialty: 'all', q: '' });
  const [keyword, setKeyword] = useUrlSearch(filters.q, (q) => setFilters({ q }));
  const form = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: treatments, isLoading, error, reload, setData } = useAsync(
    () => getAdminTreatments({ q: filters.q, specialty: filters.specialty }),
    [filters.q, filters.specialty],
    { keepPreviousData: true },
  );

  const openCreate = () => {
    setEditing(null);
    form.open();
  };
  const openEdit = (treatment) => {
    setEditing(treatment);
    form.open();
  };

  const handleSaved = (saved, isEdit) => {
    form.close();
    toast.success(isEdit ? 'Treatment updated' : 'Treatment added', `${saved?.name ?? 'The treatment'} ${isEdit ? 'has been updated' : 'is now in the catalog'}.`);
    reload();
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleting(true);
    try {
      await deleteTreatment(target.id);
      setData((list) => list.filter((item) => item.id !== target.id));
      toast.success('Treatment deleted', `${target.name} was removed from the catalog.`);
    } catch (err) {
      toast.error('Treatment not deleted', err.message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      key: 'treatment',
      header: 'Treatment',
      render: (treatment) => (
        <EntityCell className="max-w-72" media={<Thumb src={treatment.image} icon={Sparkles} />} title={treatment.name} subtitle={treatment.shortDescription} />
      ),
    },
    { key: 'specialty', header: 'Specialty', render: (treatment) => <span className="block max-w-40">{SPECIALTY_LABELS[treatment.specialtyId] ?? '—'}</span> },
    {
      key: 'category',
      header: 'Category',
      render: (treatment) => (
        <Badge tone="neutral" uppercase>
          {treatment.category}
        </Badge>
      ),
    },
    {
      key: 'clinics',
      header: 'Listed by',
      className: 'whitespace-nowrap',
      render: (treatment) => (
        <StackedCell primary={pluralize(treatment.listingCount, 'clinic')} secondary={treatment.clinicCount !== treatment.listingCount ? `${treatment.clinicCount} public` : null} />
      ),
    },
    {
      key: 'price',
      header: 'Price from',
      className: 'whitespace-nowrap',
      render: (treatment) => (treatment.priceFrom ? formatPrice(treatment.priceFrom) : <span className="text-on-surface-variant">Not offered</span>),
    },
    { key: 'duration', header: 'Duration', className: 'whitespace-nowrap', render: (treatment) => `${treatment.durationMinutes} min` },
    {
      key: 'action',
      header: <span className="sr-only">Actions</span>,
      className: 'relative text-right [&_svg]:shrink-0',
      render: (treatment) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton icon={Pencil} label={`Edit ${treatment.name}`} size="sm" onClick={() => openEdit(treatment)} iconClassName="size-4" />
          <IconButton icon={Trash2} label={`Delete ${treatment.name}`} size="sm" onClick={() => setDeleteTarget(treatment)} className="hover:text-error" iconClassName="size-4" />
        </div>
      ),
    },
  ];

  const activeSpecialty = specialties.find((item) => item.id === filters.specialty);

  return (
    <>
      <PageHeader
        pills={<AdminPills />}
        title="Service Catalog"
        meta={
          <>
            <Layers className="size-4 text-secondary" aria-hidden="true" />
            <span>Global treatment catalog</span>
            <MetaDot />
            <span>Clinics list their own prices against these entries</span>
          </>
        }
        actions={
          <Button leftIcon={Plus} onClick={openCreate}>
            Add Treatment
          </Button>
        }
      />

      <Panel title={activeSpecialty ? activeSpecialty.name : 'All Treatments'} subtitle={treatments ? pluralize(treatments.length, 'treatment') : 'Loading catalog…'}>
        <FilterBar>
          <ChipRow label="Filter by specialty">
            <FilterChip active={filters.specialty === 'all'} onClick={() => setFilters({ specialty: 'all' })}>
              All specialties
            </FilterChip>
            {specialties.map((item) => (
              <FilterChip key={item.id} active={filters.specialty === item.id} onClick={() => setFilters({ specialty: item.id })}>
                {item.shortLabel}
              </FilterChip>
            ))}
          </ChipRow>
          <SearchField value={keyword} onChange={setKeyword} label="Search treatments" placeholder="Search treatments" />
        </FilterBar>

        {error && !treatments ? (
          <ErrorState compact error={error} onRetry={reload} />
        ) : !treatments ? (
          <ListSkeleton label="Loading treatments" />
        ) : (
          <div className={cn('transition-opacity', isLoading && 'opacity-60')}>
            <DataTable
              caption="Treatment catalog"
              columns={columns}
              rows={treatments}
              empty={
                <EmptyState
                  compact
                  icon={Sparkles}
                  title={filters.q ? `No treatments match “${filters.q}”` : 'No treatments in this specialty'}
                  description="Add a treatment to make it available for clinics to list."
                  action={
                    <Button size="sm" leftIcon={Plus} onClick={openCreate}>
                      Add Treatment
                    </Button>
                  }
                />
              }
            />
          </div>
        )}
      </Panel>

      <PolicyNote icon={Layers}>Treatments listed by any clinic cannot be deleted — clinics must remove their listing first.</PolicyNote>

      <TreatmentFormModal isOpen={form.isOpen} treatment={editing} onClose={form.close} onSaved={handleSaved} />

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget?.name ?? 'treatment'}?`}
        description={
          deleteTarget?.listingCount
            ? `This treatment is currently listed by ${pluralize(deleteTarget.listingCount, 'clinic')}, so the catalog will refuse the deletion.`
            : 'It will be removed from the global catalog. This cannot be undone.'
        }
        confirmLabel="Delete treatment"
        cancelLabel="Cancel"
        tone="danger"
        loading={deleting}
      />
    </>
  );
}
