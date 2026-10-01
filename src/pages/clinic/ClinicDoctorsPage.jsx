import { useState } from 'react';
import { CalendarDays, Pencil, UserMinus, UserPlus, UsersRound } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmationModal } from '@/components/common/Overlay';
import { EmptyState, ErrorState } from '@/components/common/States';
import { DoctorCard, DoctorCardSkeleton } from '@/components/doctor/DoctorCard';
import { PageHeader } from '@/components/dashboard/DashboardUI';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { getClinicDoctors, removeClinicDoctor, saveClinicDoctor } from '@/services/doctorService';
import { DoctorFormModal } from './components/DoctorFormModal';

/** Clinic specialist roster (doctors linked through doctor_clinic). */
export default function ClinicDoctorsPage() {
  useDocumentTitle('Specialists');
  const { user } = useAuth();
  const toast = useToast();
  const { data, isLoading, error, reload } = useAsync(() => getClinicDoctors(user.clinicId), [user.clinicId]);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const roster = (data ?? []).filter((doctor) => doctor.status !== 'inactive');

  const save = async (values) => {
    await saveClinicDoctor(user.clinicId, values);
    toast.success(values.id ? 'Specialist updated' : 'Specialist added', values.name);
    reload();
  };

  const confirmRemove = async () => {
    setBusy(true);
    try {
      await removeClinicDoctor(user.clinicId, removing.id);
      toast.success('Specialist removed from roster', removing.name);
      setRemoving(null);
      reload();
    } catch (err) {
      toast.error('Cannot remove specialist', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        pills={
          <Badge tone="gold" size="md" uppercase>
            SCFHS Registered Roster
          </Badge>
        }
        title="Specialists"
        meta={<span>Manage the practitioners patients can book. Each specialist is verified against the SCFHS register.</span>}
        actions={
          <>
            <Button to={ROUTES.clinicPortal.schedule} variant="tonal" leftIcon={CalendarDays}>
              Manage schedules
            </Button>
            <Button leftIcon={UserPlus} onClick={() => setEditing('new')}>
              Add Specialist
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <DoctorCardSkeleton key={index} />
          ))}
        </div>
      ) : roster.length === 0 ? (
        <EmptyState icon={UsersRound} title="No specialists yet" description="Add your first practitioner to start accepting bookings." action={<Button onClick={() => setEditing('new')}>Add Specialist</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {roster.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              className="bg-surface-container-lowest shadow-sm"
              action={
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                    <Badge tone="neutral">{doctor.scfhsLicense}</Badge>
                    <Badge tone="plum">{doctor.serviceCount} treatments</Badge>
                    <Badge tone="gold">{doctor.upcomingCount} upcoming</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="soft" size="sm" leftIcon={Pencil} onClick={() => setEditing(doctor.id)}>
                      Edit
                    </Button>
                    <Button variant="danger-soft" size="sm" leftIcon={UserMinus} onClick={() => setRemoving(doctor)} disabled={doctor.clinicRole === 'owner'}>
                      Remove
                    </Button>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}

      {editing && (
        <DoctorFormModal key={editing} isOpen onClose={() => setEditing(null)} onSave={save} doctor={editing === 'new' ? null : roster.find((doctor) => doctor.id === editing)} />
      )}
      <ConfirmationModal
        isOpen={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        loading={busy}
        tone="danger"
        title="Remove from roster?"
        description={removing ? `${removing.name} will no longer be bookable at your clinic. Specialists with upcoming appointments must be reassigned first.` : ''}
        confirmLabel="Remove specialist"
      />
    </>
  );
}
