import { CalendarDays, ListChecks } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/States';
import { PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getDoctorSchedule } from '@/services/doctorService';
import { LeavePanel } from './components/LeavePanel';
import { WeeklyAvailabilityForm } from './components/WeeklyAvailabilityForm';

function ScheduleSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12" aria-hidden="true">
      <div className="space-y-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg xl:col-span-8">
        <Skeleton className="mb-space-sm h-7 w-56" />
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[480px] rounded-xl xl:col-span-4" />
    </div>
  );
}

/** Doctor availability — weekly working hours at the clinic plus leave and time off. */
export default function DoctorSchedulePage() {
  useDocumentTitle('Availability');
  const { user } = useAuth();
  const doctorId = user.doctorId;
  const { data, isLoading, error, reload, setData } = useAsync(() => getDoctorSchedule(doctorId), [doctorId]);

  const clinicId = user.clinicId ?? data?.doctor?.primaryClinicId;
  const schedule = data?.schedules.find((row) => row.clinicId === clinicId) ?? data?.schedules[0];
  const clinicName = schedule?.clinic ?? data?.doctor?.clinic?.name;

  const replaceSchedule = (saved) =>
    setData((previous) => ({
      ...previous,
      schedules: [...previous.schedules.filter((row) => row.clinicId !== saved.clinicId), { ...saved, clinic: clinicName }],
    }));

  return (
    <>
      <PageHeader
        pills={
          <>
            <Badge tone="gold" size="md" uppercase className="text-on-secondary-fixed">
              Riyadh week • Sun – Sat
            </Badge>
            {clinicName && (
              <Badge tone="neutral" size="md">
                {clinicName}
              </Badge>
            )}
          </>
        }
        title="Availability & Time Off"
        meta={
          <>
            <CalendarDays className="size-4 text-secondary" aria-hidden="true" />
            <span>Set the hours patients can book you</span>
            <span className="text-outline-variant">•</span>
            <span>Riyadh (GMT+3)</span>
          </>
        }
        actions={
          <Button to={ROUTES.doctorPortal.appointments} variant="tonal" leftIcon={ListChecks}>
            My appointments
          </Button>
        }
      />

      {isLoading ? (
        <ScheduleSkeleton />
      ) : error ? (
        <ErrorState title="We couldn’t load your availability" error={error} onRetry={reload} />
      ) : (
        <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
          <Panel
            className="xl:col-span-8"
            title="Weekly Availability"
            subtitle={`Working hours at ${clinicName ?? 'your clinic'} — booking slots are generated from these blocks`}
          >
            <WeeklyAvailabilityForm doctorId={doctorId} clinicId={schedule?.clinicId ?? clinicId} blocks={schedule?.blocks} onSaved={replaceSchedule} />
          </Panel>
          <div className="min-w-0 xl:col-span-4">
            <LeavePanel doctorId={doctorId} leaves={data.leaves} onChange={(leaves) => setData((previous) => ({ ...previous, leaves }))} />
          </div>
        </div>
      )}
    </>
  );
}
