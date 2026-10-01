import { useState } from 'react';
import { ConfirmationModal, Modal } from '@/components/common/Overlay';
import { Button } from '@/components/common/Button';
import { Field, SelectInput, Textarea } from '@/components/common/Form';
import { FormAlert } from '@/components/common/States';
import { useAsync } from '@/hooks/useAsync';
import { getRescheduleSlots } from '@/services/appointmentService';
import { addDays, fromDateKey, todayKey, WEEKDAYS } from '@/utils/date';
import { formatLongDate, formatSlot } from '@/utils/format';
import { TimeSlotGrid } from './TimeSlotGrid';

const CANCEL_REASONS = ['Schedule conflict', 'Feeling unwell', 'Found another clinic', 'Travelling', 'Other'];

/**
 * Cancel dialog. `mode="patient"` asks for a reason; `mode="clinic"` is the
 * decline flow with a message that is sent to the patient.
 */
export function CancelAppointmentDialog({ appointment, isOpen, onClose, onConfirm, mode = 'patient' }) {
  const [reason, setReason] = useState(mode === 'patient' ? CANCEL_REASONS[0] : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!appointment) return null;

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm(reason);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={submit}
      loading={loading}
      tone="danger"
      title={mode === 'patient' ? 'Cancel this appointment?' : 'Decline this request?'}
      description={`${appointment.service?.shortTitle ?? 'Appointment'} • ${formatLongDate(fromDateKey(appointment.dateKey))} at ${formatSlot(appointment.slot)}`}
      confirmLabel={mode === 'patient' ? 'Cancel appointment' : 'Decline request'}
      cancelLabel={mode === 'patient' ? 'Keep appointment' : 'Back'}
    >
      <div className="space-y-space-sm">
        <FormAlert>{error}</FormAlert>
        {mode === 'patient' ? (
          <>
            <Field label="Reason (optional)">
              <SelectInput value={reason} onChange={(event) => setReason(event.target.value)}>
                {CANCEL_REASONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </SelectInput>
            </Field>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Cancellation is complimentary up to 24 hours before your appointment.</p>
          </>
        ) : (
          <Field label="Message to patient" hint="Shared with the patient in their notification.">
            <Textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Dr. Reem is fully booked that day — please choose another time." />
          </Field>
        )}
      </div>
    </ConfirmationModal>
  );
}

/** Reschedule / propose a new time with the same specialist (next 14 days). */
export function RescheduleDialog({ appointment, isOpen, onClose, onConfirm, title = 'Reschedule appointment', confirmLabel = 'Confirm new time' }) {
  const [dateKey, setDateKey] = useState(() => addDays(todayKey(), 1));
  const [slot, setSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { data: slots = [], isLoading } = useAsync(
    () => (isOpen && appointment ? getRescheduleSlots(appointment.id, dateKey) : Promise.resolve([])),
    [isOpen, appointment?.id, dateKey],
  );
  if (!appointment) return null;

  const days = Array.from({ length: 14 }, (_, index) => addDays(todayKey(), index + 1));

  const submit = async () => {
    if (!slot) {
      setError('Choose an available time.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onConfirm({ dateKey, slot });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={title}
      description={`${appointment.service?.shortTitle} with ${appointment.doctor?.name}`}
      footer={
        <>
          <Button variant="soft" onClick={onClose} disabled={submitting}>
            Close
          </Button>
          <Button onClick={submit} loading={submitting} disabled={!slot}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-space-md">
        <FormAlert>{error}</FormAlert>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Choose a date">
          {days.map((key) => {
            const date = fromDateKey(key);
            const active = key === dateKey;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setDateKey(key);
                  setSlot(null);
                }}
                className={
                  active
                    ? 'shrink-0 rounded-lg bg-primary px-3 py-2 text-center font-label-md text-label-md text-on-primary'
                    : 'shrink-0 rounded-lg bg-surface-container px-3 py-2 text-center font-label-md text-label-md text-on-surface hover:bg-surface-container-high'
                }
              >
                <span className="block text-[11px] opacity-80">{WEEKDAYS[date.getDay()].slice(0, 3)}</span>
                <span className="font-bold">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
        {!isLoading && slots.filter((item) => item.status === 'available').length === 0 ? (
          <p className="rounded-lg bg-surface-container-low px-4 py-3 font-body-sm text-body-sm text-on-surface-variant">
            No times left with this specialist on {formatLongDate(fromDateKey(dateKey))}. Try another day.
          </p>
        ) : (
          <TimeSlotGrid slots={slots} value={slot} loading={isLoading} onChange={(item) => setSlot(item.slot)} />
        )}
      </div>
    </Modal>
  );
}
