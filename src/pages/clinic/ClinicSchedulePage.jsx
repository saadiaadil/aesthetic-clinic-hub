import { useMemo, useState } from 'react';
import { CalendarRange, Pencil, Plane } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { getClinicAppointments } from '@/services/appointmentService';
import { getClinicSchedules, updateDoctorSchedule } from '@/services/doctorService';
import { cn } from '@/utils/cn';
import { addDays, dayOfWeek, fromDateKey, todayKey, WEEKDAYS } from '@/utils/date';
import { formatDate, formatSlot } from '@/utils/format';
import { ScheduleEditorModal } from './components/ScheduleEditorModal';

const ACTIVE = ['pending', 'confirmed', 'checked_in', 'in_session', 'rescheduled', 'completed'];

/** 7-day clinic schedule grid: specialists × days with hours, bookings and leave. */
export default function ClinicSchedulePage() {
  useDocumentTitle('Schedule');
  const { user } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const schedules = useAsync(() => getClinicSchedules(user.clinicId), [user.clinicId]);
  const appointments = useAsync(() => getClinicAppointments(user.clinicId, { tab: 'all', pageSize: 500 }), [user.clinicId]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(todayKey(), index)), []);
  const bookings = useMemo(() => {
    const map = new Map();
    (appointments.data?.items ?? [])
      .filter((apt) => ACTIVE.includes(apt.status))
      .forEach((apt) => {
        const key = `${apt.doctor?.id}|${apt.dateKey}`;
        map.set(key, [...(map.get(key) ?? []), apt]);
      });
    return map;
  }, [appointments.data]);

  const save = async (blocks) => {
    await updateDoctorSchedule(editing.doctor.id, user.clinicId, blocks);
    toast.success('Availability updated', editing.doctor.name);
    schedules.reload();
  };

  const loading = schedules.isLoading || appointments.isLoading;

  return (
    <>
      <PageHeader
        title="Schedule"
        meta={
          <>
            <CalendarRange className="size-4 text-secondary" aria-hidden="true" />
            <span>
              Next 7 days • {formatDate(fromDateKey(days[0]))} – {formatDate(fromDateKey(days[6]))} • Riyadh time
            </span>
          </>
        }
      />

      <Panel title="7-Day Specialist Grid" subtitle="Working hours, booked visits and leave for every specialist">
        {schedules.error ? (
          <ErrorState error={schedules.error} onRetry={schedules.reload} />
        ) : loading ? (
          <Skeleton className="h-80 w-full" />
        ) : schedules.data.length === 0 ? (
          <EmptyState compact title="No specialists on the roster" description="Add specialists to build your schedule." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-2 text-left">
              <caption className="sr-only">Specialist schedule for the next seven days</caption>
              <thead>
                <tr className="font-label-md text-label-md text-on-surface-variant">
                  <th scope="col" className="w-56">
                    Specialist
                  </th>
                  {days.map((key, index) => (
                    <th key={key} scope="col" className={cn('text-center', index === 0 && 'text-secondary')}>
                      {WEEKDAYS[dayOfWeek(key)].slice(0, 3)} {fromDateKey(key).getDate()}
                      {index === 0 && <span className="block font-label-sm text-label-sm">Today</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedules.data.map((row) => (
                  <tr key={row.doctor.id}>
                    <th scope="row" className="rounded-lg bg-surface-container-low p-2 align-middle">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <Avatar src={row.doctor.headshot} name={row.doctor.name} size="sm" />
                          <span className="truncate font-title-md text-body-sm font-semibold text-on-surface">{row.doctor.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditing(row)}
                          aria-label={`Edit availability for ${row.doctor.name}`}
                          className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </th>
                    {days.map((key) => {
                      const block = row.blocks.find((item) => item.dayOfWeek === dayOfWeek(key));
                      const leave = row.leaves.find((item) => key >= item.startDate && key <= item.endDate);
                      const booked = bookings.get(`${row.doctor.id}|${key}`) ?? [];
                      return (
                        <td
                          key={key}
                          className={cn(
                            'h-20 rounded-lg p-2 text-center align-middle font-label-sm text-label-sm',
                            leave ? 'bg-tertiary-fixed/60 text-on-tertiary-fixed' : block ? (booked.length >= 4 ? 'bg-primary-container text-on-primary-container' : booked.length ? 'bg-secondary-fixed/50 text-on-secondary-fixed' : 'bg-surface-container-low text-on-surface-variant') : 'bg-surface-container-high/60 text-outline',
                          )}
                        >
                          {leave ? (
                            <span className="flex flex-col items-center gap-1">
                              <Plane className="size-4" aria-hidden="true" /> On leave
                            </span>
                          ) : block ? (
                            <span className="flex flex-col items-center gap-0.5">
                              <span className="font-semibold">{booked.length} booked</span>
                              <span className="opacity-80">
                                {formatSlot(block.start).replace(':00', '')}–{formatSlot(block.end).replace(':00', '')}
                              </span>
                            </span>
                          ) : (
                            'Off'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-space-md flex flex-wrap items-center gap-space-md font-label-sm text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-surface-container-low ring-1 ring-outline-variant/40" /> Open</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-secondary-fixed/50" /> Booked</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-primary-container" /> 4+ visits</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-tertiary-fixed/60" /> Leave</span>
        </div>
      </Panel>

      {schedules.data?.some((row) => row.leaves.length) && (
        <Panel title="Upcoming Leave" titleSize="title">
          <ul className="flex flex-wrap gap-2">
            {schedules.data.flatMap((row) =>
              row.leaves.map((leave) => (
                <li key={leave.id}>
                  <Badge tone="blush" size="lg" className="whitespace-normal">
                    {row.doctor.name} • {formatDate(fromDateKey(leave.startDate))}
                    {leave.endDate !== leave.startDate ? ` – ${formatDate(fromDateKey(leave.endDate))}` : ''} • {leave.reason}
                  </Badge>
                </li>
              )),
            )}
          </ul>
        </Panel>
      )}

      {editing && <ScheduleEditorModal key={editing.doctor.id} isOpen doctor={editing.doctor} blocks={editing.blocks} onClose={() => setEditing(null)} onSave={save} />}
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Tip: specialists can also manage their own leave from the Specialist Workstation.{' '}
        <Button variant="ghost" size="xs" className="px-1 text-primary" onClick={() => toast.info('Specialist workstation', 'Doctors sign in via the Provider Hub → Practitioner.')}>
          Learn more
        </Button>
      </p>
    </>
  );
}
