import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/common/Button';
import { Field, SelectInput, Textarea } from '@/components/common/Form';
import { Modal } from '@/components/common/Overlay';
import { FormAlert } from '@/components/common/States';
import { TimeSlotGrid } from '@/components/appointment/TimeSlotGrid';
import { useAsync } from '@/hooks/useAsync';
import { createAppointment, getSlots } from '@/services/appointmentService';
import { getUsers } from '@/services/userService';
import { getUpcomingOpenDays } from '@/utils/clinic';
import { fromDateKey } from '@/utils/date';
import { formatShortDate } from '@/utils/format';

const schema = z.object({
  userId: z.string().min(1, 'Choose the patient.'),
  clinicServiceId: z.string().min(1, 'Choose a treatment.'),
  doctorId: z.string().min(1, 'Choose a specialist.'),
  dateKey: z.string().min(1, 'Choose a date.'),
  patientNotes: z.string().max(1000),
});

/** Phone / walk-in booking created by clinic staff on behalf of a patient. */
export function NewAppointmentModal({ clinic, isOpen, onClose, onCreated }) {
  const days = useMemo(() => getUpcomingOpenDays(clinic?.openingHours, 7), [clinic?.openingHours]);
  const [slot, setSlot] = useState(null);
  const [serverError, setServerError] = useState('');
  const patients = useAsync(() => (isOpen ? getUsers({ role: 'patient', status: 'active', pageSize: 100 }) : Promise.resolve(null)), [isOpen]);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { userId: '', clinicServiceId: clinic?.services?.[0]?.id ?? '', doctorId: 'any', dateKey: days[0]?.key ?? '', patientNotes: '' },
  });
  const serviceId = watch('clinicServiceId');
  const doctorId = watch('doctorId');
  const dateKey = watch('dateKey');
  const service = clinic?.services.find((item) => item.id === serviceId);
  const doctors = (clinic?.doctors ?? []).filter((doctor) => service?.doctorIds.includes(doctor.id));
  const slots = useAsync(
    () => (isOpen && serviceId && dateKey ? getSlots({ clinicId: clinic.id, clinicServiceId: serviceId, doctorId, dateKey }) : Promise.resolve([])),
    [isOpen, serviceId, doctorId, dateKey],
  );

  const close = () => {
    reset();
    setSlot(null);
    setServerError('');
    onClose();
  };

  const onSubmit = async (values) => {
    if (!slot) {
      setServerError('Choose an available time slot.');
      return;
    }
    setServerError('');
    try {
      const appointment = await createAppointment({
        ...values,
        clinicId: clinic.id,
        slot: slot.slot,
        doctorId: values.doctorId === 'any' ? slot.doctorId ?? 'any' : values.doctorId,
        paymentMethod: 'clinic',
        preferences: { privateSuite: false, femaleStaff: false },
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `staff-${Date.now()}`,
      });
      onCreated(appointment);
      close();
    } catch (error) {
      setServerError(error.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      size="lg"
      title="New Appointment"
      description="Book a phone or walk-in patient into the live schedule."
      footer={
        <>
          <Button variant="soft" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="new-appointment-form" loading={isSubmitting}>
            Create appointment
          </Button>
        </>
      }
    >
      <form id="new-appointment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-space-md" noValidate>
        <FormAlert>{serverError}</FormAlert>
        <Field label="Patient" required error={errors.userId?.message}>
          <SelectInput {...register('userId')}>
            <option value="">{patients.isLoading ? 'Loading patients…' : 'Select a registered patient'}</option>
            {(patients.data?.items ?? []).map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} — {patient.phone ?? patient.email}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field label="Treatment" required error={errors.clinicServiceId?.message}>
            <SelectInput
              {...register('clinicServiceId', {
                onChange: () => {
                  setValue('doctorId', 'any');
                  setSlot(null);
                },
              })}
            >
              {(clinic?.services ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.shortTitle}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Specialist" required error={errors.doctorId?.message}>
            <SelectInput {...register('doctorId', { onChange: () => setSlot(null) })}>
              <option value="any">Next available specialist</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label="Date" required error={errors.dateKey?.message}>
          <SelectInput {...register('dateKey', { onChange: () => setSlot(null) })}>
            {days.map((day) => (
              <option key={day.key} value={day.key}>
                {day.label} — {formatShortDate(fromDateKey(day.key))}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div>
          <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-on-surface">Time</p>
          <TimeSlotGrid slots={slots.data ?? []} value={slot?.slot} loading={slots.isLoading} onChange={setSlot} />
        </div>
        <Field label="Intake notes (optional)" error={errors.patientNotes?.message}>
          <Textarea rows={2} placeholder="Allergies, prior treatments or requests shared on the call." {...register('patientNotes')} />
        </Field>
      </form>
    </Modal>
  );
}
