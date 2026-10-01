import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarOff, Plane, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Field, TextInput } from '@/components/common/Form';
import { IconButton } from '@/components/common/IconButton';
import { ConfirmationModal } from '@/components/common/Overlay';
import { EmptyState, FormAlert } from '@/components/common/States';
import { Panel } from '@/components/dashboard/DashboardUI';
import { useToast } from '@/hooks/useToast';
import { addDoctorLeave, removeDoctorLeave } from '@/services/doctorService';
import { fromDateKey, todayKey } from '@/utils/date';
import { formatDate, formatShortDate, pluralize } from '@/utils/format';

const leaveSchema = z
  .object({
    startDate: z.string().min(1, 'Choose the first day of your leave.'),
    endDate: z.string().min(1, 'Choose the last day of your leave.'),
    reason: z.string().trim().min(3, 'Add a short reason (at least 3 characters).').max(120, 'Keep the reason under 120 characters.'),
  })
  .refine((values) => !values.startDate || values.startDate >= todayKey(), { path: ['startDate'], message: 'Leave cannot start in the past.' })
  .refine((values) => !values.startDate || !values.endDate || values.endDate >= values.startDate, {
    path: ['endDate'],
    message: 'The end date must be on or after the start date.',
  });

const EMPTY_LEAVE = { startDate: '', endDate: '', reason: '' };

/** "14 Oct 2026" or "Wed, 14 Oct – 16 Oct 2026". */
function formatRange(leave) {
  if (leave.startDate === leave.endDate) return formatDate(fromDateKey(leave.startDate));
  return `${formatShortDate(fromDateKey(leave.startDate))} – ${formatDate(fromDateKey(leave.endDate))}`;
}

const leaveLength = (leave) => Math.round((fromDateKey(leave.endDate) - fromDateKey(leave.startDate)) / 86400000) + 1;

function LeaveItem({ leave, onRemove }) {
  const range = formatRange(leave);
  const active = leave.startDate <= todayKey();
  return (
    <li className="flex items-start justify-between gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
      <div className="flex min-w-0 gap-space-sm">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed/40 text-secondary">
          <Plane className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-title-md text-title-md text-on-surface">{range}</p>
          <p className="break-words font-body-sm text-body-sm text-on-surface-variant">{leave.reason}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge tone={active ? 'plum' : 'gold'}>{active ? 'On leave now' : 'Upcoming'}</Badge>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{pluralize(leaveLength(leave), 'day')}</span>
          </div>
        </div>
      </div>
      <IconButton icon={Trash2} label={`Remove leave ${range}`} size="md" onClick={() => onRemove(leave)} className="hover:text-error" />
    </li>
  );
}

function AddLeaveForm({ doctorId, onAdded }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(leaveSchema), defaultValues: EMPTY_LEAVE });
  const today = todayKey();

  const onSubmit = async (values) => {
    try {
      const leave = await addDoctorLeave(doctorId, values);
      onAdded(leave);
      reset(EMPTY_LEAVE);
      toast.success('Time off added', `Your slots for ${formatRange(leave)} are now hidden from booking.`);
    } catch (error) {
      setError('root.server', { message: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-space-sm rounded-xl bg-surface-container-low p-space-sm sm:p-space-md">
      <h3 className="font-title-md text-title-md text-on-surface">Add time off</h3>
      <FormAlert>{errors.root?.server?.message}</FormAlert>
      <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Field label="Start date" required error={errors.startDate?.message}>
          <TextInput type="date" min={today} surface="white" {...register('startDate', { deps: ['endDate'] })} />
        </Field>
        <Field label="End date" required error={errors.endDate?.message}>
          <TextInput type="date" min={today} surface="white" {...register('endDate')} />
        </Field>
      </div>
      <Field label="Reason" required error={errors.reason?.message}>
        <TextInput surface="white" placeholder="e.g. Annual leave, conference" maxLength={120} {...register('reason')} />
      </Field>
      <Button type="submit" leftIcon={CalendarOff} loading={isSubmitting} fullWidth>
        Block these dates
      </Button>
    </form>
  );
}

/** "Leave & Time Off" (doctor_leave): current and upcoming leave with add / remove. */
export function LeavePanel({ doctorId, leaves, onChange }) {
  const toast = useToast();
  const [pendingRemoval, setPendingRemoval] = useState({ leave: null, isOpen: false });
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const today = todayKey();
  const current = leaves.filter((leave) => leave.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));

  const askRemove = (leave) => {
    setRemoveError('');
    setPendingRemoval({ leave, isOpen: true });
  };
  const closeRemove = () => setPendingRemoval((previous) => ({ ...previous, isOpen: false }));

  const confirmRemove = async () => {
    const { leave } = pendingRemoval;
    setRemoving(true);
    setRemoveError('');
    try {
      await removeDoctorLeave(leave.id);
      onChange(leaves.filter((item) => item.id !== leave.id));
      closeRemove();
      toast.success('Leave removed', `Your slots for ${formatRange(leave)} are open for booking again.`);
    } catch (error) {
      setRemoveError(error.message);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Panel title="Leave & Time Off" titleSize="title" subtitle="Blocked dates hide your slots from patient booking">
      <div className="space-y-space-md">
        {current.length ? (
          <ul className="space-y-space-sm">
            {current.map((leave) => (
              <LeaveItem key={leave.id} leave={leave} onRemove={askRemove} />
            ))}
          </ul>
        ) : (
          <EmptyState compact icon={Plane} title="No leave scheduled" description="Add conferences, holidays or training days below." />
        )}
        <AddLeaveForm doctorId={doctorId} onAdded={(leave) => onChange([...leaves, leave])} />
      </div>

      <ConfirmationModal
        isOpen={pendingRemoval.isOpen}
        onClose={closeRemove}
        onConfirm={confirmRemove}
        loading={removing}
        tone="danger"
        title="Remove this leave?"
        description={pendingRemoval.leave ? `${formatRange(pendingRemoval.leave)} • ${pendingRemoval.leave.reason}` : undefined}
        confirmLabel="Remove leave"
        cancelLabel="Keep leave"
      >
        <div className="space-y-space-sm">
          <FormAlert>{removeError}</FormAlert>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Patients will be able to book you on these dates again.</p>
        </div>
      </ConfirmationModal>
    </Panel>
  );
}
