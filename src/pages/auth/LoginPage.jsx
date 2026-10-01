import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, IdCard, Lock, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { images } from '@/assets/images';
import { DemoAccounts } from '@/components/auth/AuthWidgets';
import { Button } from '@/components/common/Button';
import { Checkbox, Field, PasswordInput, TextInput } from '@/components/common/Form';
import { FormAlert } from '@/components/common/States';
import { BRAND } from '@/constants/brand';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRedirectAfterLogin } from '@/hooks/useRedirectAfterLogin';
import { useToast } from '@/hooks/useToast';
import { getFirstName } from '@/utils/format';
import { identifierField } from '@/utils/validation';

const schema = z.object({
  identifier: identifierField,
  password: z.string().min(1, 'Enter your passcode.'),
  remember: z.boolean(),
});

/** Patient sign in — Stitch "Patient Login Access" split screen. */
export default function LoginPage() {
  useDocumentTitle('Sign In');
  const { login } = useAuth();
  const toast = useToast();
  const redirect = useRedirectAfterLogin();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { identifier: '', password: '', remember: true } });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login({ identifier: values.identifier, password: values.password, portal: 'patient' });
      toast.success(`Welcome back, ${getFirstName(user.name)}`);
      redirect(user);
    } catch (error) {
      setServerError(error.message);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full flex-col bg-surface lg:flex-row">
      <div className="relative flex min-h-[380px] w-full flex-col justify-between overflow-hidden p-space-lg lg:min-h-[calc(100vh-80px)] lg:w-1/2 lg:p-space-xl">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${images.auth.luxuryInterior})` }} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/40 to-inverse-surface/50 mix-blend-multiply" aria-hidden="true" />
        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">{BRAND.name} Sanctuary</span>
          <span className="font-label-sm text-label-sm tracking-wider text-surface-container-high/80">Riyadh, Saudi Arabia</span>
        </div>
        <div className="relative z-10 my-auto max-w-md py-space-xl">
          <blockquote className="mb-space-sm font-headline-lg text-headline-md leading-tight text-surface-bright drop-shadow-sm md:text-headline-lg">
            “Beauty elevated to clinical artistry, guarded by discretion.”
          </blockquote>
          <p className="font-body-md text-body-md font-light text-surface-container-high/80">
            Your private aesthetic health journey and verified medical consultations in one sanctuary.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-space-sm font-body-sm text-body-sm text-surface-container-high/70">
          <ShieldCheck className="size-[18px] text-secondary-fixed" aria-hidden="true" />
          Licensed MOH Medical Network
        </div>
      </div>

      <div className="flex w-full flex-col justify-center bg-surface px-margin-mobile py-space-xl sm:px-space-lg lg:w-1/2 lg:px-space-xl">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-space-lg flex items-center gap-space-md border-b border-surface-container-highest">
            <span className="relative pb-2 font-title-md text-title-md font-semibold text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary">
              Patient Sanctuary
            </span>
            <Link to={ROUTES.providerLogin} className="pb-2 font-title-md text-title-md text-on-surface-variant transition-colors hover:text-on-surface">
              Clinic Portal
            </Link>
          </div>

          <div className="mb-space-lg">
            <h1 className="mb-1.5 font-headline-md text-headline-md tracking-tight text-on-surface">Sign In</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Access your medical journey and appointments.</p>
          </div>

          <button
            type="button"
            onClick={() => toast.info('Nafath sign in', 'National Single Sign-On (Nafath) connects when the secure backend launches.')}
            className="group flex w-full items-center justify-center gap-space-sm rounded-xl bg-surface-container-high px-space-md py-3 font-title-md text-title-md text-on-surface shadow-sm transition-colors hover:bg-surface-variant"
          >
            <IdCard className="size-5 text-[#006C35]" aria-hidden="true" />
            Login via Nafath
            <ArrowRight className="ml-1 size-4 text-on-surface-variant transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>

          <div className="relative my-space-lg flex items-center justify-center">
            <div className="h-px w-full bg-surface-container-highest" />
            <span className="absolute bg-surface px-4 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">or with credentials</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-space-md" noValidate>
            <FormAlert>{serverError}</FormAlert>
            <Field label="Mobile or Email" error={errors.identifier?.message}>
              <TextInput placeholder="e.g. 05XXXXXXXX or name@domain.sa" autoComplete="username" className="[&_input]:rounded-xl" {...register('identifier')} />
            </Field>
            <Field
              label="Passcode"
              error={errors.password?.message}
              labelAside={
                <Link to={ROUTES.forgotPassword} className="font-label-sm text-label-sm text-primary hover:underline">
                  Forgot Passcode?
                </Link>
              }
            >
              <PasswordInput placeholder="••••••••••••" className="[&_input]:rounded-xl" {...register('password')} />
            </Field>
            <Checkbox label="Remember me" {...register('remember')} />
            <Button type="submit" size="xl" fullWidth loading={isSubmitting} className="rounded-xl bg-primary-container hover:bg-primary">
              {isSubmitting ? 'Verifying…' : 'Sign In'}
            </Button>
          </form>

          <DemoAccounts
            onPick={(email, password) => {
              setValue('identifier', email, { shouldValidate: true });
              setValue('password', password, { shouldValidate: true });
            }}
          />

          <p className="mt-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
            New to {BRAND.name}?
            <Link to={ROUTES.signup} className="ml-1 font-title-md text-title-md text-primary hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-space-xl flex items-center justify-center gap-2 border-t border-surface-container pt-space-md text-center font-label-sm text-label-sm text-on-surface-variant">
            <Lock className="size-4 text-secondary" aria-hidden="true" />
            256-bit AES Encrypted • MOH Health Data Protected
          </p>

        </div>
      </div>
    </div>
  );
}
