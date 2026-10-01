import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, Lock, LockKeyhole } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { AuthCard } from '@/components/auth/AuthCard';
import { PasswordStrength } from '@/components/auth/AuthWidgets';
import { Button } from '@/components/common/Button';
import { Field, PasswordInput } from '@/components/common/Form';
import { FormAlert } from '@/components/common/States';
import { ROUTES } from '@/constants/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { resetPassword } from '@/services/authService';
import { MESSAGES, passwordField } from '@/utils/validation';

const schema = z
  .object({ password: passwordField, confirmPassword: z.string().min(1, 'Please confirm your password.') })
  .refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: MESSAGES.passwordMatch });

export default function ResetPasswordPage() {
  useDocumentTitle('Set New Password');
  const [params] = useSearchParams();
  const token = params.get('token');
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { password: '', confirmPassword: '' } });

  if (!token) {
    return (
      <AuthCard overline="Account recovery" title="Reset link missing" description="This page needs the secure link from your reset email. Request a new link to continue.">
        <Button to={ROUTES.forgotPassword} fullWidth>
          Request a new link
        </Button>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard overline="All set" title="Password updated" description="Your new password is active. Sign in to continue your aesthetic journey.">
        <div className="mb-space-md flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-800">
          <CircleCheck className="size-6" aria-hidden="true" />
          <p className="font-body-sm text-body-sm">For your security, other devices have been signed out.</p>
        </div>
        <Button to={ROUTES.login} fullWidth>
          Sign in
        </Button>
      </AuthCard>
    );
  }

  const onSubmit = async ({ password }) => {
    setServerError('');
    try {
      await resetPassword({ token, password });
      setDone(true);
    } catch (error) {
      setServerError(error.message);
    }
  };

  return (
    <AuthCard overline="Account recovery" title="Set a new password" description="Choose a strong password you have not used before.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-space-md" noValidate>
        <FormAlert>{serverError}</FormAlert>
        <Field label="New Password" required error={errors.password?.message}>
          <PasswordInput leftIcon={Lock} autoComplete="new-password" placeholder="••••••••••••" {...register('password')} />
        </Field>
        <Field label="Confirm Password" required error={errors.confirmPassword?.message}>
          <PasswordInput leftIcon={LockKeyhole} autoComplete="new-password" placeholder="••••••••••••" {...register('confirmPassword')} />
        </Field>
        <PasswordStrength value={watch('password')} />
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}
