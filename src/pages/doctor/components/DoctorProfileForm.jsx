import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, Languages, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { CheckboxCard, Field, FieldGroup, Textarea, TextInput } from '@/components/common/Form';
import { FormAlert } from '@/components/common/States';
import { Panel } from '@/components/dashboard/DashboardUI';
import { DoctorCard } from '@/components/doctor/DoctorCard';
import { useToast } from '@/hooks/useToast';
import { updateDoctorProfile } from '@/services/doctorService';

const BIO_MAX = 220;

const LANGUAGE_OPTIONS = [
  { code: 'ar', label: 'Arabic' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
];
const LANGUAGE_LABELS = LANGUAGE_OPTIONS.map((option) => option.label);

const schema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(80, 'Keep the title under 80 characters.'),
  headline: z.string().trim().min(3, 'Headline must be at least 3 characters.').max(120, 'Keep the headline under 120 characters.'),
  bio: z
    .string()
    .trim()
    .min(20, 'Write at least 20 characters so patients understand your focus.')
    .max(BIO_MAX, `Keep your short bio under ${BIO_MAX} characters.`),
  about: z.string().trim().min(40, 'Write at least 40 characters about your approach.').max(2000, 'Keep this section under 2,000 characters.'),
  languages: z.array(z.enum(['ar', 'en', 'fr'])).min(1, 'Select at least one consultation language.'),
  experienceYears: z
    .number({ invalid_type_error: 'Enter your years of experience.' })
    .int('Use whole years.')
    .min(0, 'Experience cannot be negative.')
    .max(69, 'Experience must be under 70 years.'),
  consultationFee: z
    .number({ invalid_type_error: 'Enter your consultation fee.' })
    .min(100, 'The minimum consultation fee is 100 SAR.')
    .max(5000, 'The maximum consultation fee is 5,000 SAR.'),
});

const toFormValues = (doctor) => ({
  title: doctor.title ?? '',
  headline: doctor.headline ?? '',
  bio: doctor.bio ?? '',
  about: doctor.about ?? '',
  languages: doctor.languages ?? [],
  experienceYears: doctor.experienceYears ?? 0,
  consultationFee: doctor.consultationFee ?? 0,
});

const isLanguageTag = (tag) => tag.split(' & ').every((part) => LANGUAGE_LABELS.includes(part));

/** Keeps the public "Arabic & English" tag in sync with the selected languages. */
function withLanguageTag(tags = [], languages = []) {
  const selected = LANGUAGE_OPTIONS.filter((option) => languages.includes(option.code)).map((option) => option.label);
  const others = tags.filter((tag) => !isLanguageTag(tag));
  return selected.length ? [selected.join(' & '), ...others] : others;
}

function CredentialsPanel({ doctor }) {
  return (
    <Panel title="Credentials & Licensing" titleSize="title" subtitle="Verified by your clinic and the Saudi Commission for Health Specialties">
      <div className="space-y-space-md">
        <div>
          <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">SCFHS License</p>
          <Badge tone="plum" size="lg" icon={ShieldCheck}>
            {doctor.scfhsLicense}
          </Badge>
        </div>
        <div>
          <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Board certifications</p>
          {doctor.credentials?.length ? (
            <ul className="flex flex-wrap gap-2">
              {doctor.credentials.map((credential) => (
                <li key={credential}>
                  <Badge tone="gold" size="md" icon={BadgeCheck}>
                    {credential}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No certifications on file yet.</p>
          )}
        </div>
        <p className="rounded-lg bg-surface-container-low p-space-sm font-body-sm text-body-sm text-on-surface-variant">
          Credentials are read-only. Ask {doctor.clinic?.name ?? 'your clinic'} to update them after SCFHS verification.
        </p>
      </div>
    </Panel>
  );
}

/** Editable professional profile with a live public-card preview. */
export function DoctorProfileForm({ doctor, onSaved }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: toFormValues(doctor) });
  const values = useWatch({ control });

  const preview = {
    ...doctor,
    title: values.title || doctor.title,
    bio: values.bio || doctor.bio,
    consultationFee: Number.isFinite(values.consultationFee) ? values.consultationFee : doctor.consultationFee,
    tags: withLanguageTag(doctor.tags, values.languages),
  };

  const onSubmit = async (formValues) => {
    try {
      const patch = { ...formValues, tags: withLanguageTag(doctor.tags, formValues.languages) };
      await updateDoctorProfile(doctor.id, patch);
      reset(formValues);
      onSaved?.(patch);
      toast.success('Profile updated', 'Your public profile now shows these details.');
    } catch (error) {
      setError('root.server', { message: error.message });
      toast.error('Could not save your profile', error.message);
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-w-0 flex-col gap-space-lg xl:col-span-8">
        <FormAlert>{errors.root?.server?.message}</FormAlert>

        <Panel title="Public Introduction" subtitle="What patients read on your profile and specialist cards">
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <Field label="Professional title" required error={errors.title?.message}>
              <TextInput placeholder="e.g. Senior Cosmetic Dermatologist" {...register('title')} />
            </Field>
            <Field label="Headline" required error={errors.headline?.message}>
              <TextInput placeholder="e.g. Consultant Dermatologist & Anti-Aging Expert" {...register('headline')} />
            </Field>
            <Field
              label="Short bio"
              required
              hint={`${values.bio?.length ?? 0}/${BIO_MAX}`}
              hintPosition="label"
              error={errors.bio?.message}
              className="md:col-span-2"
            >
              <Textarea rows={4} maxLength={BIO_MAX + 40} placeholder="One or two sentences shown on your specialist card." {...register('bio')} />
            </Field>
            <Field label="About your practice" required hint="Training, philosophy and the treatments you are known for." error={errors.about?.message} className="md:col-span-2">
              <Textarea rows={6} {...register('about')} />
            </Field>
          </div>
        </Panel>

        <Panel title="Practice Details" subtitle="Consultation languages, experience and fee">
          <div className="space-y-space-md">
            <FieldGroup legend="Consultation languages" required error={errors.languages?.message}>
              <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-3">
                {LANGUAGE_OPTIONS.map((option) => (
                  <CheckboxCard key={option.code} compact icon={Languages} value={option.code} title={option.label} {...register('languages')} />
                ))}
              </div>
            </FieldGroup>
            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              <Field label="Years of experience" required error={errors.experienceYears?.message}>
                <TextInput type="number" inputMode="numeric" min={0} max={69} step={1} {...register('experienceYears', { valueAsNumber: true })} />
              </Field>
              <Field label="Consultation fee" required hint="Between 100 and 5,000 SAR" error={errors.consultationFee?.message}>
                <TextInput
                  type="number"
                  inputMode="numeric"
                  min={100}
                  max={5000}
                  step={10}
                  rightSlot={<span className="pr-2 font-label-md text-label-md font-semibold text-secondary">SAR</span>}
                  {...register('consultationFee', { valueAsNumber: true })}
                />
              </Field>
            </div>
          </div>
        </Panel>

        <div className="flex flex-col-reverse gap-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {isDirty ? <span className="font-semibold text-secondary">You have unsaved changes.</span> : 'Changes appear on your public profile as soon as you save.'}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="soft" leftIcon={RotateCcw} disabled={!isDirty || isSubmitting} onClick={() => reset()}>
              Discard
            </Button>
            <Button type="submit" leftIcon={Save} loading={isSubmitting}>
              Save profile
            </Button>
          </div>
        </div>
      </form>

      <aside className="flex min-w-0 flex-col gap-space-lg xl:col-span-4" aria-label="Profile preview and credentials">
        <section className="space-y-space-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Live preview</h2>
            <Badge tone="neutral">As patients see it</Badge>
          </div>
          <DoctorCard doctor={preview} showClinic className="bg-surface-container-lowest shadow-sm" />
        </section>
        <CredentialsPanel doctor={doctor} />
      </aside>
    </div>
  );
}
