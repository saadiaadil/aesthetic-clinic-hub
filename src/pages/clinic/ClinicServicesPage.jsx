import { useMemo, useState } from 'react';
import { CirclePlus, ListChecks, PauseCircle, Pencil, Sparkles, Tags, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { Switch } from '@/components/common/Form';
import { IconButton } from '@/components/common/IconButton';
import { Tabs } from '@/components/common/Navigation';
import { ConfirmationModal } from '@/components/common/Overlay';
import { RowSkeleton, Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { PageHeader, Panel, StatCard } from '@/components/dashboard/DashboardUI';
import { specialties } from '@/data/treatments';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { deleteClinicService, getClinicServices, saveClinicService, setClinicServiceAvailability } from '@/services/clinicService';
import { getClinicDoctors } from '@/services/doctorService';
import { getTreatments } from '@/services/treatmentService';
import { cn } from '@/utils/cn';
import { formatNumber, formatPriceRange } from '@/utils/format';
import { ServiceFormModal } from './components/ServiceFormModal';

/** Clinic treatment catalog — manage services and pricing (clinic_service). */
export default function ClinicServicesPage() {
  useDocumentTitle('Treatment Catalog');
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState(params.get('new') ? 'new' : null);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const services = useAsync(() => getClinicServices(user.clinicId, { includeUnavailable: true }), [user.clinicId]);
  const doctors = useAsync(() => getClinicDoctors(user.clinicId), [user.clinicId]);
  const catalog = useAsync(() => getTreatments({ pageSize: 100, sort: 'name' }), []);

  const items = services.data ?? [];
  const categories = useMemo(() => {
    const ids = [...new Set(items.map((service) => service.treatment?.specialtyId))];
    return [{ value: 'all', label: 'All', count: items.length }, ...specialties.filter((item) => ids.includes(item.id)).map((item) => ({ value: item.id, label: item.shortLabel }))];
  }, [items]);
  const visible = items.filter((service) => category === 'all' || service.treatment?.specialtyId === category);
  const active = items.filter((service) => service.isAvailable);
  const averagePrice = active.length ? Math.round(active.reduce((sum, service) => sum + service.priceMin, 0) / active.length) : 0;

  const closeEditor = () => {
    setEditing(null);
    if (params.get('new')) setParams({}, { replace: true });
  };

  const save = async (values) => {
    await saveClinicService(user.clinicId, values);
    toast.success(values.id ? 'Treatment updated' : 'Treatment added', values.title);
    services.reload();
  };

  const toggle = async (service) => {
    services.setData((current) => current.map((item) => (item.id === service.id ? { ...item, isAvailable: !item.isAvailable } : item)));
    try {
      await setClinicServiceAvailability(service.id, !service.isAvailable);
      toast.success(service.isAvailable ? 'Treatment paused' : 'Treatment is bookable again', service.shortTitle);
    } catch (error) {
      toast.error('Could not update availability', error.message);
      services.reload();
    }
  };

  const confirmDelete = async () => {
    setDeletingBusy(true);
    try {
      await deleteClinicService(deleting.id);
      toast.success('Treatment removed', deleting.shortTitle);
      setDeleting(null);
      services.reload();
    } catch (error) {
      toast.error('Cannot delete treatment', error.message);
    } finally {
      setDeletingBusy(false);
    }
  };

  const editingService = editing && editing !== 'new' ? items.find((item) => item.id === editing) : null;
  const editorReady = catalog.data && doctors.data;

  return (
    <>
      <PageHeader
        title="Treatment Catalog"
        meta={<span>Your published menu and transparent pricing. Changes appear on your public profile instantly.</span>}
        actions={
          <Button leftIcon={CirclePlus} onClick={() => setEditing('new')} disabled={!editorReady}>
            Add Treatment
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-space-md sm:grid-cols-3" aria-label="Catalog summary">
        {services.isLoading ? (
          Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Listed Treatments" value={items.length} icon={ListChecks} glow="gold" footer={`${categories.length - 1} specialties`} />
            <StatCard label="Bookable Now" value={active.length} icon={Sparkles} iconTone="secondary" glow="plum" footer={`${items.length - active.length} paused`} />
            <StatCard label="Average Starting Price" value={formatNumber(averagePrice)} unit="SAR" icon={Tags} glow="champagne" footer="VAT inclusive" />
          </>
        )}
      </section>

      <Panel title="Menu & Pricing" action={<Tabs variant="chips" label="Specialties" value={category} onChange={setCategory} tabs={categories} />}>
        {services.error ? (
          <ErrorState error={services.error} onRetry={services.reload} />
        ) : services.isLoading ? (
          <div className="space-y-space-sm">
            {Array.from({ length: 4 }, (_, index) => (
              <RowSkeleton key={index} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            compact
            title="No treatments listed"
            description="Add your first treatment so patients can book it."
            action={<Button onClick={() => setEditing('new')}>Add Treatment</Button>}
          />
        ) : (
          <ul className="space-y-space-sm">
            {visible.map((service) => (
              <li
                key={service.id}
                className={cn(
                  'flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md transition-colors hover:bg-surface-container lg:flex-row lg:items-center lg:justify-between',
                  !service.isAvailable && 'opacity-70',
                )}
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-title-lg text-title-lg text-on-surface">{service.title}</h3>
                    {service.tag && <Badge tone="gold">{service.tag}</Badge>}
                    {!service.isAvailable && (
                      <Badge tone="muted" icon={PauseCircle}>
                        Paused
                      </Badge>
                    )}
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{service.description}</p>
                  <div className="flex flex-wrap items-center gap-4 font-label-sm text-label-sm text-on-surface-variant">
                    {service.highlights?.map((item) => (
                      <span key={item.label} className="flex items-center gap-1">
                        <DynamicIcon name={item.icon} className="size-[15px] text-primary" />
                        {item.label}
                      </span>
                    ))}
                    <span>Specialists: {service.doctors.map((doctor) => doctor.name.replace('Dr. ', '')).join(', ') || '—'}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-space-md lg:justify-end">
                  <div className="text-right">
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">{formatPriceRange(service.priceMin, service.priceMax)}</span>
                    <span className="block font-label-sm text-label-sm text-on-surface-variant">{service.priceNote}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch srLabel={`${service.shortTitle} bookable`} checked={service.isAvailable} onChange={() => toggle(service)} />
                    <IconButton icon={Pencil} label={`Edit ${service.shortTitle}`} size="md" onClick={() => setEditing(service.id)} disabled={!editorReady} />
                    <IconButton icon={Trash2} label={`Delete ${service.shortTitle}`} size="md" onClick={() => setDeleting(service)} className="hover:text-error" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {editing && editorReady && (
        <ServiceFormModal
          key={editing}
          isOpen
          onClose={closeEditor}
          onSave={save}
          service={editingService}
          treatments={catalog.data.items}
          doctors={(doctors.data ?? []).filter((doctor) => doctor.status === 'active')}
        />
      )}
      <ConfirmationModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deletingBusy}
        tone="danger"
        title="Remove this treatment?"
        description={deleting ? `${deleting.title} will disappear from your public menu. Treatments with upcoming bookings must be paused instead.` : ''}
        confirmLabel="Remove treatment"
      />
    </>
  );
}
