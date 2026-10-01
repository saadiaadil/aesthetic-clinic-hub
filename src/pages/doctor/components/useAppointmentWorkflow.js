import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { proposeNewTime, updateAppointmentStatus } from '@/services/appointmentService';
import { fromDateKey } from '@/utils/date';
import { formatLongDate, formatSlot } from '@/utils/format';
import { getNextStep, STEP_TOASTS } from './appointmentWorkflow';

const scheduledLabel = (appointment) => `${formatLongDate(fromDateKey(appointment.dateKey))} at ${formatSlot(appointment.slot)}`;

/**
 * Appointment actions shared by the doctor dashboard and appointments list:
 * day-of-visit progression (optimistic), accept / decline requests, propose a
 * new time, plus the state of the intake / decline / propose dialogs.
 *
 * - `onChange(appointment)` receives optimistic rows, confirmed rows from the
 *   API and the original row again when a request fails (rollback).
 * - `onSettled(appointment, action)` runs after a successful mutation.
 */
export function useAppointmentWorkflow({ onChange, onSettled } = {}) {
  const toast = useToast();
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [dialog, setDialog] = useState({ type: null, appointment: null });

  const setBusy = (id, busy) =>
    setBusyIds((previous) => {
      const next = new Set(previous);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  const mutate = async (appointment, { action, request, optimisticStatus, success, rethrow = false }) => {
    setBusy(appointment.id, true);
    if (optimisticStatus) onChange?.({ ...appointment, status: optimisticStatus });
    try {
      const updated = await request();
      onChange?.(updated);
      toast.success(...success(updated));
      onSettled?.(updated, action);
      return updated;
    } catch (error) {
      if (optimisticStatus) onChange?.(appointment);
      // Dialogs show the message inline, so they receive the error instead of a toast.
      if (rethrow) throw error;
      toast.error('Could not update this appointment', error.message);
      return null;
    } finally {
      setBusy(appointment.id, false);
    }
  };

  const advance = (appointment) => {
    const step = getNextStep(appointment);
    if (!step) return Promise.resolve(null);
    return mutate(appointment, {
      action: 'advance',
      optimisticStatus: step.status,
      request: () => updateAppointmentStatus(appointment.id, step.status),
      success: STEP_TOASTS[step.status],
    });
  };

  const accept = (appointment) =>
    mutate(appointment, {
      action: 'accept',
      request: () => updateAppointmentStatus(appointment.id, 'confirmed'),
      success: (updated) => ['Request accepted', `${updated.patient?.name} has been notified — ${scheduledLabel(updated)}.`],
    });

  const decline = (appointment, reason = '') =>
    mutate(appointment, {
      action: 'decline',
      rethrow: true,
      request: () => updateAppointmentStatus(appointment.id, 'cancelled', { reason: reason.trim() }),
      success: (updated) => ['Request declined', `${updated.patient?.name} has been notified.`],
    });

  const propose = (appointment, { dateKey, slot }) =>
    mutate(appointment, {
      action: 'propose',
      rethrow: true,
      request: () => proposeNewTime(appointment.id, { dateKey, slot }),
      success: (updated) => ['New time proposed', `${scheduledLabel(updated)} was sent to ${updated.patient?.name}.`],
    });

  const openDialog = (type) => (appointment) => setDialog({ type, appointment });
  // Keep the appointment while the dialog animates out.
  const closeDialog = () => setDialog((previous) => ({ ...previous, type: null }));

  return {
    isBusy: (id) => busyIds.has(id),
    advance,
    accept,
    decline,
    propose,
    dialog,
    openIntake: openDialog('intake'),
    openDecline: openDialog('decline'),
    openPropose: openDialog('propose'),
    closeDialog,
  };
}
