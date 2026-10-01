import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { AuthCard } from '@/components/auth/AuthCard';
import { Button } from '@/components/common/Button';
import { Field, TextInput } from '@/components/common/Form';
import { FormAlert } from '@/components/common/States';
import { ROUTES } from '@/constants/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { requestPasswordReset } from '@/services/authService';
import { emailField } from '@/utils/validation';

const schema = z.object({ email: emailField });

/** UC-1 alternative flow A2: forgotten password → reset link. */
export default function ForgotPasswordPage() {
  useDocumentTitle('Reset Password');
  const [sent, setSent] = useState(null);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setServerError('');
    try {
      const result = await requestPasswordReset(email);
      setSent({ email, token: result.demoToken });
    } catch (error) {
      setServerError(error.message);
    }
  };

  if (sent) {
    return (
      <AuthCard overline="Check your inbox" title="Reset link sent" description={`If an account exists for ${sent.email}, you will receive a secure link to set a new password within a few minutes.`}>
        <div className="flex items-center gap-3 rounded-lg bg-secondary-fixed/30 p-4 text-on-secondary-fixed">
          <MailCheck className="size-6 text-secondary" aria-hidden="true" />
          <p className="font-body-sm text-body-sm">The link expires in 30 minutes. Check your spam folder if it does not arrive.</p>
        </div>
        <div className="mt-space-md flex flex-col gap-space-sm">
          {sent.token && (
            <Button to={`${ROUTES.resetPassword}?token=${sent.token}`} fullWidth>
              Open reset link (demo)
            </Button>
          )}
          <Button to={ROUTES.login} variant="soft" fullWidth leftIcon={ArrowLeft}>
            Back to sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard overline="Account recovery" title="Forgot your passcode?" description="Enter the email linked to your account and we will send you a secure reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-space-md" noValidate>
        <FormAlert>{serverError}</FormAlert>
        <Field label="Registered Email" required error={errors.email?.message}>
          <TextInput leftIcon={Mail} type="email" autoComplete="email" placeholder="name@domain.sa" {...register('email')} />
        </Field>
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Send reset link
        </Button>
        <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
          Remembered it?{' '}
          <Link to={ROUTES.login} className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
