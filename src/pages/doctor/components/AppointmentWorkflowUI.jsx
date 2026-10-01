import { CalendarClock, Check, FolderOpen } from 'lucide-react';
import { CancelAppointmentDialog, RescheduleDialog } from '@/components/appointment/AppointmentDialogs';
import { Button } from '@/components/common/Button';
import { todayKey } from '@/utils/date';
import { getNextStep, PROPOSABLE_STATUSES } from './appointmentWorkflow';
import { IntakeModal } from './IntakeModal';

/**
 * Contextual queue-row actions (Stitch: "Intake", "Finish Session",
 * "Accept Slot", "Propose Time"). `allowPropose` adds the reschedule action
 * used on the appointments list.
 */
export function AppointmentActions({ appointment, workflow, allowPropose = false }) {
  const step = getNextStep(appointment);
  const busy = workflow.isBusy(appointment.id);
  const isPending = appointment.status === 'pending';
  const canPropose = allowPropose && PROPOSABLE_STATUSES.includes(appointment.status);
  const patientName = appointment.patient?.name ?? 'patient';
  const proposeLabel = isPending ? 'Propose time' : appointment.dateKey === todayKey() ? 'Reschedule' : 'Propose new time';

  return (
    <>
      <Button
        variant="soft"
        size="sm"
        leftIcon={FolderOpen}
        className="text-primary"
        aria-label={`Intake for ${patientName}`}
        onClick={() => workflow.openIntake(appointment)}
      >
        Intake
      </Button>
      {canPropose && (
        <Button variant="soft" size="sm" leftIcon={CalendarClock} disabled={busy} onClick={() => workflow.openPropose(appointment)}>
          {proposeLabel}
        </Button>
      )}
      {isPending && (
        <>
          <Button variant="ghost" size="sm" disabled={busy} aria-label={`Decline request from ${patientName}`} onClick={() => workflow.openDecline(appointment)}>
            Decline
          </Button>
          <Button
            size="sm"
            leftIcon={Check}
            loading={busy}
            className="shadow-none"
            aria-label={`Accept request from ${patientName}`}
            onClick={() => workflow.accept(appointment)}
          >
            Accept
          </Button>
        </>
      )}
      {step && (
        <Button
          size="sm"
          leftIcon={step.icon}
          loading={busy}
          className="shadow-none"
          aria-label={`${step.label} for ${patientName}`}
          onClick={() => workflow.advance(appointment)}
        >
          {step.label}
        </Button>
      )}
    </>
  );
}

/** Intake, decline and propose-time dialogs driven by `useAppointmentWorkflow`. */
export function AppointmentWorkflowDialogs({ workflow }) {
  const { dialog, closeDialog } = workflow;
  const { appointment } = dialog;
  return (
    <>
      <IntakeModal appointment={appointment} isOpen={dialog.type === 'intake'} onClose={closeDialog} />
      {/* Keyed by appointment so the message and chosen slot reset between patients. */}
      <CancelAppointmentDialog
        key={`decline-${appointment?.id}`}
        mode="clinic"
        appointment={appointment}
        isOpen={dialog.type === 'decline'}
        onClose={closeDialog}
        onConfirm={(reason) => workflow.decline(appointment, reason)}
      />
      <RescheduleDialog
        key={`propose-${appointment?.id}`}
        appointment={appointment}
        isOpen={dialog.type === 'propose'}
        onClose={closeDialog}
        title="Propose a new time"
        confirmLabel="Send proposal"
        onConfirm={(value) => workflow.propose(appointment, value)}
      />
    </>
  );
}
