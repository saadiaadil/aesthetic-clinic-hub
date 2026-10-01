import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/common/Button';
import { CheckboxCard, Field, FieldGroup, SelectInput, TextInput, Textarea } from '@/components/common/Form';
import { Modal } from '@/components/common/Overlay';
import { FormAlert } from '@/components/common/States';

const schema = z
  .object({
    treatmentId: z.string().min(1, 'Choose the treatment from the catalog.'),
    title: z.string().trim().min(5, 'Give the listing a descriptive title.').max(90),
    shortTitle: z.string().trim().max(40).optional(),
    tag: z.string().trim().max(28).optional(),
    description: z.string().trim().min(20, 'Describe the protocol in at least 20 characters.').max(300),
    priceMin: z.coerce.number({ invalid_type_error: 'Enter a price.' }).min(0, 'Price cannot be negative.'),
    priceMax: z.coerce.number({ invalid_type_error: 'Enter a price.' }).min(0, 'Price cannot be negative.'),
    priceNote: z.string().trim().max(50).optional(),
    durationMinutes: z.coerce.number({ invalid_type_error: 'Enter a duration.' }).int().min(5, 'Minimum 5 minutes.').max(480, 'Maximum 8 hours.'),
    doctorIds: z.array(z.string()).min(1, 'Assign at least one specialist.'),
  })
  .refine((values) => values.priceMax >= values.priceMin, { path: ['priceMax'], message: 'Maximum price must be ≥ minimum price.' });

/** Create / edit a clinic treatment listing (clinic_service). */
export function ServiceFormModal({ isOpen, onClose, onSave, service, treatments, doctors }) {
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: service
      ? { ...service, tag: service.tag ?? '', priceNote: service.priceNote ?? '', shortTitle: service.shortTitle ?? '' }
      : { treatmentId: '', title: '', shortTitle: '', tag: '', description: '', priceMin: '', priceMax: '', priceNote: '', durationMinutes: 45, doctorIds: [] },
  });

  const submit = async (values) => {
    setServerError('');
    try {
      await onSave({ ...values, id: service?.id });
      onClose();
    } catch (error) {
      setServerError(error.message);
      Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => setError(field, { message }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={service ? 'Edit Treatment Listing' : 'Add Treatment'}
      description="Prices are shown to patients VAT-inclusive and locked at booking."
      footer={
        <>
          <Button variant="soft" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="service-form" loading={isSubmitting}>
            {service ? 'Save changes' : 'Add to menu'}
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={handleSubmit(submit)} className="space-y-space-md" noValidate>
        <FormAlert>{serverError}</FormAlert>
        <Field label="Catalog treatment" required error={errors.treatmentId?.message} hint="Links your listing to the platform treatment for search and comparison.">
          <SelectInput {...register('treatmentId')} disabled={Boolean(service)}>
            <option value="">Select a treatment</option>
            {treatments.map((treatment) => (
              <option key={treatment.id} value={treatment.id}>
                {treatment.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Listing title" required error={errors.title?.message}>
          <TextInput placeholder="e.g. Micro-Dosed Forehead & Crow’s Feet Botox" {...register('title')} />
        </Field>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field label="Short name" error={errors.shortTitle?.message} hint="Used in the booking summary.">
            <TextInput placeholder="e.g. Micro-Dosed Botox" {...register('shortTitle')} />
          </Field>
          <Field label="Highlight tag" error={errors.tag?.message}>
            <TextInput placeholder="e.g. Doctor Performed" {...register('tag')} />
          </Field>
        </div>
        <Field label="Description" required error={errors.description?.message}>
          <Textarea rows={3} {...register('description')} />
        </Field>
        <div className="grid grid-cols-2 gap-space-md sm:grid-cols-4">
          <Field label="Min price (SAR)" required error={errors.priceMin?.message}>
            <TextInput type="number" inputMode="numeric" min="0" {...register('priceMin')} />
          </Field>
          <Field label="Max price (SAR)" required error={errors.priceMax?.message}>
            <TextInput type="number" inputMode="numeric" min="0" {...register('priceMax')} />
          </Field>
          <Field label="Duration (min)" required error={errors.durationMinutes?.message}>
            <TextInput type="number" inputMode="numeric" min="5" {...register('durationMinutes')} />
          </Field>
          <Field label="Price note" error={errors.priceNote?.message}>
            <TextInput placeholder="e.g. Per Vial" {...register('priceNote')} />
          </Field>
        </div>
        <FieldGroup legend="Performing specialists" required error={errors.doctorIds?.message}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {doctors.map((doctor) => (
              <CheckboxCard key={doctor.id} compact title={doctor.name} value={doctor.id} {...register('doctorIds')} />
            ))}
          </div>
        </FieldGroup>
      </form>
    </Modal>
  );
}
