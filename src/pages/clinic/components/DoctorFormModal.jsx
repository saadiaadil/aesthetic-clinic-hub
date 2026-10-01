import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/common/Button';
import { CheckboxCard, Field, FieldGroup, RadioCard, TextInput, Textarea } from '@/components/common/Form';
import { Modal } from '@/components/common/Overlay';
import { FormAlert } from '@/components/common/States';

const LANGUAGES = [
  { id: 'ar', label: 'Arabic' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'French' },
];

const schema = z.object({
  name: z.string().trim().min(5, 'Enter the specialist’s full name.'),
  title: z.string().trim().min(3, 'Enter the professional title.'),
  specialization: z.string().trim().min(3, 'Enter the specialization.'),
  gender: z.enum(['female', 'male'], { errorMap: () => ({ message: 'Select one.' }) }),
  scfhsLicense: z
    .string()
    .trim()
    .regex(/^SCFHS-[A-Z0-9-]{4,}$/i, 'Use the SCFHS format, e.g. SCFHS-21-MD-98442.'),
  experienceYears: z.coerce.number({ invalid_type_error: 'Enter years.' }).int().min(0).max(69),
  consultationFee: z.coerce.number({ invalid_type_error: 'Enter a fee.' }).min(100, 'Minimum 100 SAR.').max(5000, 'Maximum 5,000 SAR.'),
  languages: z.array(z.string()).min(1, 'Choose at least one language.'),
  bio: z.string().trim().min(20, 'Write at least 20 characters.').max(220, 'Keep the bio under 220 characters.'),
});

/** Add / edit a specialist on the clinic roster (doctors + doctor_clinic). */
export function DoctorFormModal({ isOpen, onClose, onSave, doctor }) {
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: doctor
      ? { ...doctor, scfhsLicense: doctor.scfhsLicense ?? '' }
      : { name: 'Dr. ', title: '', specialization: '', gender: 'female', scfhsLicense: '', experienceYears: 5, consultationFee: 450, languages: ['ar', 'en'], bio: '' },
  });

  const submit = async (values) => {
    setServerError('');
    try {
      await onSave({ ...values, id: doctor?.id });
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
      title={doctor ? `Edit ${doctor.name}` : 'Add Specialist'}
      description="Credentials are re-verified by the platform against the SCFHS register."
      footer={
        <>
          <Button variant="soft" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="doctor-form" loading={isSubmitting}>
            {doctor ? 'Save changes' : 'Add to roster'}
          </Button>
        </>
      }
    >
      <form id="doctor-form" onSubmit={handleSubmit(submit)} className="space-y-space-md" noValidate>
        <FormAlert>{serverError}</FormAlert>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field label="Full name" required error={errors.name?.message}>
            <TextInput {...register('name')} />
          </Field>
          <Field label="SCFHS license" required error={errors.scfhsLicense?.message}>
            <TextInput placeholder="SCFHS-21-MD-98442" {...register('scfhsLicense')} />
          </Field>
          <Field label="Professional title" required error={errors.title?.message}>
            <TextInput placeholder="e.g. Consultant Dermatologist" {...register('title')} />
          </Field>
          <Field label="Specialization" required error={errors.specialization?.message}>
            <TextInput placeholder="e.g. Cosmetic Dermatology" {...register('specialization')} />
          </Field>
          <Field label="Years of experience" required error={errors.experienceYears?.message}>
            <TextInput type="number" min="0" {...register('experienceYears')} />
          </Field>
          <Field label="Consultation fee (SAR)" required error={errors.consultationFee?.message}>
            <TextInput type="number" min="100" {...register('consultationFee')} />
          </Field>
        </div>
        <FieldGroup legend="Specialist" required error={errors.gender?.message}>
          <div className="grid grid-cols-2 gap-2">
            <RadioCard title="Female" value="female" {...register('gender')} />
            <RadioCard title="Male" value="male" {...register('gender')} />
          </div>
        </FieldGroup>
        <FieldGroup legend="Consultation languages" required error={errors.languages?.message}>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((language) => (
              <CheckboxCard key={language.id} compact title={language.label} value={language.id} {...register('languages')} />
            ))}
          </div>
        </FieldGroup>
        <Field label="Public bio" required error={errors.bio?.message} hint="Shown on specialist cards (max 220 characters).">
          <Textarea rows={3} {...register('bio')} />
        </Field>
      </form>
    </Modal>
  );
}
