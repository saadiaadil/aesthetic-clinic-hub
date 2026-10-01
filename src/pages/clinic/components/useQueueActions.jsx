import { useState } from 'react';
import { CancelAppointmentDialog, RescheduleDialog } from '@/components/appointment/AppointmentDialogs';
import { useToast } from '@/hooks/useToast';
import { proposeNewTime, updateAppointmentStatus } from '@/services/appointmentService';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';

const STATUS_ACTIONS = {
  accept: { status: 'confirmed', message: 'Appointment confirmed', detail: 'The patient has been notified.' },
  checkin: { status: 'checked_in', message: 'Patient checked in' },
  start: { status: 'in_session', message: 'Session started' },
  finish: { status: 'completed', message: 'Session completed', detail: 'The patient will be invited to leave a verified review.' },
  noshow: { status: 'no_show', message: 'Marked as no-show' },
};

/**
 * Handles clinic queue actions (FR-6: accept / reject / reschedule and the
 * day-of-visit stages) and owns the related dialogs. `onChange` refreshes data.
 */
export function useQueueActions(onChange) {
  const toast = useToast();
  const [details, setDetails] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);

  const handle = async (type, appointment) => {
    if (type === 'intake' || type === 'receipt') return setDetails({ appointment, view: type });
    if (type === 'decline') return setDeclining(appointment);
    if (type === 'reschedule' || type === 'propose') return setRescheduling({ appointment, mode: type });
    if (type === 'remind') return toast.success('Reminder sent', `WhatsApp prep instructions sent to ${appointment.patient?.name}.`);
    if (type === 'call') return toast.info(`${appointment.patient?.name} called`, `Please proceed to ${appointment.suite ?? 'your suite'}.`);
    if (type === 'refreshment') return toast.info('VIP refreshment protocol', 'Cardamom coffee and dates requested for the suite.');

    const action = STATUS_ACTIONS[type];
    if (!action) return undefined;
    try {
      await updateAppointmentStatus(appointment.id, action.status);
      toast.success(action.message, action.detail ?? appointment.patient?.name);
      onChange?.();
    } catch (error) {
      toast.error('Could not update appointment', error.message);
    }
    return undefined;
  };

  const dialogs = (
    <>
      <AppointmentDetailsModal appointment={details?.appointment} view={details?.view} isOpen={Boolean(details)} onClose={() => setDetails(null)} />
      <CancelAppointmentDialog
        key={declining?.id}
        mode="clinic"
        appointment={declining}
        isOpen={Boolean(declining)}
        onClose={() => setDeclining(null)}
        onConfirm={async (reason) => {
          await updateAppointmentStatus(declining.id, 'cancelled', { reason });
          toast.success('Request declined', 'The patient has been notified.');
          onChange?.();
        }}
      />
      <RescheduleDialog
        key={rescheduling?.appointment.id}
        appointment={rescheduling?.appointment}
        isOpen={Boolean(rescheduling)}
        title={rescheduling?.mode === 'propose' ? 'Propose a new time' : 'Reschedule appointment'}
        confirmLabel={rescheduling?.mode === 'propose' ? 'Send proposal' : 'Confirm new time'}
        onClose={() => setRescheduling(null)}
        onConfirm={async ({ dateKey, slot }) => {
          await proposeNewTime(rescheduling.appointment.id, { dateKey, slot });
          toast.success(rescheduling.mode === 'propose' ? 'New time proposed' : 'Appointment rescheduled', 'The patient has been notified.');
          onChange?.();
        }}
      />
    </>
  );

  return { handle, dialogs };
}
