import { useEffect, useId } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/common/Button';
import { Field, SelectInput, Textarea, TextInput } from '@/components/common/Form';
import { Modal } from '@/components/common/Overlay';
import { FormAlert } from '@/components/common/States';
import { specialties } from '@/data/treatments';
import { saveTreatment } from '@/services/treatmentService';
import { requiredText } from '@/utils/validation';

const optionalShortText = z.string().trim().max(60, 'Keep this under 60 characters.');

const schema = z.object({
  name: requiredText('Treatment name', 3).max(80, 'Keep the name under 80 characters.'),
  specialtyId: z.string().min(1, 'Choose a specialty.'),
  shortDescription: requiredText('Short description', 10).max(160, 'Keep the summary under 160 characters.'),
  description: requiredText('Full description', 20),
  durationMinutes: z
    .number({ invalid_type_error: 'Enter the duration in minutes.' })
    .int('Use whole minutes.')
    .min(5, 'Duration must be at least 5 minutes.')
    .max(480, 'Duration cannot exceed 480 minutes (8 hours).'),
  downtime: optionalShortText,
  resultsIn: optionalShortText,
});

const EMPTY = { name: '', specialtyId: '', shortDescription: '', description: '', durationMinutes: 30, downtime: '', resultsIn: '' };

const toFormValues = (treatment) =>
  treatment
    ? {
        name: treatment.name,
        specialtyId: treatment.specialtyId,
        shortDescription: treatment.shortDescription ?? '',
        description: treatment.description ?? '',
        durationMinutes: treatment.durationMinutes ?? 30,
        downtime: treatment.downtime === 'Varies' ? '' : (treatment.downtime ?? ''),
        resultsIn: treatment.resultsIn === 'Varies' ? '' : (treatment.resultsIn ?? ''),
      }
    : EMPTY;

/** Add / edit a treatment in the global catalog (the `services` table). */
export function TreatmentFormModal({ isOpen, treatment, onClose, onSaved }) {
  const formId = useId();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: toFormValues(treatment) });

  useEffect(() => {
    if (!isOpen) return;
    reset(toFormValues(treatment));
  }, [isOpen, treatment, reset]);

  const specialtyId = useWatch({ control, name: 'specialtyId' });
  const specialty = specialties.find((item) => item.id === specialtyId);
  const isEdit = Boolean(treatment);

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await saveTreatment({
        ...(isEdit ? { id: treatment.id } : {}),
        ...values,
        name: values.name.trim(),
        downtime: values.downtime || 'Varies',
        resultsIn: values.resultsIn || 'Varies',
      });
      onSaved(saved, isEdit);
    } catch (error) {
      const fieldErrors = Object.entries(error.fieldErrors ?? {});
      fieldErrors.forEach(([field, message], index) => setError(field, { type: 'server', message }, { shouldFocus: index === 0 }));
      if (!fieldErrors.length) setError('root.server', { type: 'server', message: error.message });
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      size="lg"
      title={isEdit ? `Edit ${treatment.name}` : 'Add Treatment'}
      description="Catalog entries are shared by every clinic; clinics set their own prices when they list a treatment."
      footer={
        <>
          <Button variant="soft" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} leftIcon={Save} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add to catalog'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="space-y-space-md">
        <FormAlert>{errors.root?.server?.message}</FormAlert>
        <Field label="Treatment name" required error={errors.name?.message}>
          <TextInput placeholder="e.g. Profhilo Skin Bioremodeling" autoComplete="off" data-autofocus {...register('name')} />
        </Field>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field
            label="Specialty"
            required
            error={errors.specialtyId?.message}
            hint={specialty ? `Category: ${specialty.category}` : 'The category is derived from the specialty.'}
          >
            <SelectInput {...register('specialtyId')}>
              <option value="">Choose a specialty</option>
              {specialties.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Duration (minutes)" required error={errors.durationMinutes?.message} hint="Between 5 and 480 minutes.">
            <TextInput type="number" inputMode="numeric" min={5} max={480} step={5} {...register('durationMinutes', { valueAsNumber: true })} />
          </Field>
        </div>
        <Field label="Short description" required error={errors.shortDescription?.message} hint="Shown on treatment cards and search results.">
          <Textarea rows={2} {...register('shortDescription')} />
        </Field>
        <Field label="Full description" required error={errors.description?.message}>
          <Textarea rows={4} {...register('description')} />
        </Field>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field label="Downtime" error={errors.downtime?.message} hint="Leave blank for “Varies”.">
            <TextInput placeholder="e.g. Zero downtime" {...register('downtime')} />
          </Field>
          <Field label="Results in" error={errors.resultsIn?.message} hint="Leave blank for “Varies”.">
            <TextInput placeholder="e.g. 4–7 days" {...register('resultsIn')} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
