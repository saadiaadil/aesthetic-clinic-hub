import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IdCard, Lock, LockKeyhole, Mail, MapPin, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PasswordStrength } from '@/components/auth/AuthWidgets';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { CheckboxCard, Field, PasswordInput, SelectInput, TextInput } from '@/components/common/Form';
import { FormAlert } from '@/components/common/States';
import { PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { DISTRICTS } from '@/constants/districts';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { changePassword, updateProfile } from '@/services/authService';
import { formatDate } from '@/utils/format';
import { emailField, MESSAGES, passwordField, requiredText, saudiMobileField, toE164 } from '@/utils/validation';

const profileSchema = z.object({
  name: requiredText('Full name', 3),
  email: emailField,
  phone: saudiMobileField,
  district: z.string().min(1, 'Choose a district.'),
  femaleStaff: z.boolean(),
  whatsappReminders: z.boolean(),
  privateArrival: z.boolean(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, { path: ['confirmPassword'], message: MESSAGES.passwordMatch })
  .refine((values) => values.newPassword !== values.currentPassword, { path: ['newPassword'], message: 'Choose a password you have not used here before.' });

function ProfileForm({ user, onSaved }) {
  const toast = useToast();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: (user.phone ?? '').replace(/^\+966/, ''),
      district: user.district ?? '',
      femaleStaff: Boolean(user.preferences?.femaleStaff),
      whatsappReminders: Boolean(user.preferences?.whatsappReminders),
      privateArrival: Boolean(user.preferences?.privateArrival),
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const { user: updated } = await updateProfile(user.id, {
        name: values.name,
        email: values.email,
        phone: toE164(values.phone),
        district: values.district,
        preferences: { femaleStaff: values.femaleStaff, whatsappReminders: values.whatsappReminders, privateArrival: values.privateArrival },
      });
      onSaved(updated);
      reset(values);
      toast.success('Profile updated');
    } catch (error) {
      setServerError(error.message);
      Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => setError(field, { message }));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-space-md" noValidate>
      <FormAlert>{serverError}</FormAlert>
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <Field label="Full Name" required error={errors.name?.message} className="md:col-span-2">
          <TextInput leftIcon={IdCard} autoComplete="name" {...register('name')} />
        </Field>
        <Field label="Email Address" required error={errors.email?.message}>
          <TextInput leftIcon={Mail} type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Saudi Mobile Number" required error={errors.phone?.message}>
          <TextInput prefix="🇸🇦 +966" type="tel" autoComplete="tel-national" {...register('phone')} />
        </Field>
        <Field label="Preferred Riyadh District" required error={errors.district?.message} className="md:col-span-2">
          <SelectInput leftIcon={MapPin} {...register('district')}>
            <option value="" disabled>
              Select your district
            </option>
            {DISTRICTS.map((district) => (
              <option key={district.id} value={district.id}>
                {district.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <fieldset className="space-y-space-sm">
        <legend className="mb-space-sm font-label-md text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">Care & Communication Preferences</legend>
        <CheckboxCard title="Female-only practitioner & nurse attendance" description="Clinics prioritise female physicians and nursing staff whenever available." {...register('femaleStaff')} />
        <CheckboxCard title="WhatsApp Concierge Reminders (+966)" description="Prep instructions, confirmations and direct contact with clinic liaisons." {...register('whatsappReminders')} />
        <CheckboxCard title="Private Arrival Option" description="Private basement parking guidance and escort to recovery suites." {...register('privateArrival')} />
      </fieldset>
      <div className="flex justify-end">
        <Button type="submit" leftIcon={Save} loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function PasswordForm({ userId }) {
  const toast = useToast();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await changePassword(userId, { currentPassword: values.currentPassword, newPassword: values.newPassword });
      reset();
      toast.success('Password changed', 'Use your new password next time you sign in.');
    } catch (error) {
      setServerError(error.message);
      Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => setError(field, { message }));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-space-md" noValidate>
      <FormAlert>{serverError}</FormAlert>
      <Field label="Current Password" required error={errors.currentPassword?.message}>
        <PasswordInput leftIcon={Lock} {...register('currentPassword')} />
      </Field>
      <Field label="New Password" required error={errors.newPassword?.message}>
        <PasswordInput leftIcon={LockKeyhole} autoComplete="new-password" {...register('newPassword')} />
      </Field>
      <Field label="Confirm New Password" required error={errors.confirmPassword?.message}>
        <PasswordInput leftIcon={LockKeyhole} autoComplete="new-password" {...register('confirmPassword')} />
      </Field>
      <PasswordStrength value={watch('newPassword')} />
      <Button type="submit" variant="tonal" fullWidth loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}

export default function PatientProfilePage() {
  useDocumentTitle('Profile & Preferences');
  const { user, setUser } = useAuth();
  return (
    <>
      <PageHeader title="Profile & Preferences" meta={<span>Kept under strict medical confidentiality. Only your treating clinic sees your booking details.</span>} />
      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        <Panel title="Personal Details" className="xl:col-span-8">
          <ProfileForm user={user} onSaved={setUser} />
        </Panel>
        <div className="flex flex-col gap-space-lg xl:col-span-4">
          <Panel titleSize="title" title="Membership">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatar} name={user.name} size="xl" />
              <div>
                <p className="font-title-lg text-title-lg text-on-surface">{user.name}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Member since {formatDate(user.createdAt)}</p>
              </div>
            </div>
          </Panel>
          <Panel titleSize="title" title="Security" subtitle="Passwords are hashed server-side (bcrypt/Argon2) in Phase 5.">
            <PasswordForm userId={user.id} />
          </Panel>
        </div>
      </div>
    </>
  );
}
