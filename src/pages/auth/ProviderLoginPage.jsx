import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, BadgeCheck, Building2, IdCard, Lock, Stethoscope } from 'lucide-react';
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
import { cn } from '@/utils/cn';
import { getFirstName } from '@/utils/format';

const PORTALS = {
  admin: {
    label: 'Administrator',
    icon: Building2,
    fieldLabel: 'MOH License # or Registered Email',
    placeholder: 'e.g. MOH-4892 or director@clinic.sa',
    submit: 'Sign In to Console',
    demoRoles: ['clinic', 'admin'],
  },
  practitioner: {
    label: 'Practitioner',
    icon: Stethoscope,
    fieldLabel: 'SCFHS Practitioner # or Email',
    placeholder: 'e.g. SCFHS-14-RD-20391 or doctor@clinic.sa',
    submit: 'Open Specialist Workstation',
    demoRoles: ['doctor'],
  },
};

const schema = z.object({
  identifier: z.string().trim().min(1, 'Enter your license number or registered email.'),
  password: z.string().min(1, 'Enter your password.'),
  remember: z.boolean(),
});

/** Clinic provider sign in — Stitch "Clinic Admin / Provider Login". */
export default function ProviderLoginPage() {
  useDocumentTitle('Clinic Provider Sign In');
  const [portal, setPortal] = useState('admin');
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const toast = useToast();
  const redirect = useRedirectAfterLogin();
  const config = PORTALS[portal];
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { identifier: '', password: '', remember: true } });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login({ identifier: values.identifier, password: values.password, portal: 'provider' });
      toast.success(`Welcome back, ${getFirstName(user.name)}`, 'Your console is ready.');
      redirect(user);
    } catch (error) {
      setServerError(error.message);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-[1200px] flex-1 items-center justify-center px-margin-mobile py-space-xl md:px-margin">
      <div className="grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xl lg:grid-cols-12">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-space-xl text-on-primary lg:col-span-5 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-tertiary to-primary-container opacity-90" aria-hidden="true" />
          <img className="absolute inset-0 size-full object-cover opacity-30 mix-blend-overlay" src={images.auth.providerLoginInterior} alt="" />
          <div className="relative z-10 space-y-space-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface/10 px-3 py-1 font-label-sm text-label-sm uppercase tracking-wider text-on-primary backdrop-blur-md">
              <BadgeCheck className="size-3.5 text-secondary-fixed" aria-hidden="true" />
              {BRAND.name} Medical Network
            </span>
            <h2 className="font-display-md text-display-md leading-tight tracking-tight text-on-primary">Elegance & Discretion in Clinical Care</h2>
            <p className="pt-2 font-body-md text-body-md text-on-primary/80">
              Saudi Arabia’s dedicated management ecosystem for premier aesthetic clinics, board-certified surgeons, and medical directors.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-space-sm pt-space-xl font-label-sm text-label-sm text-on-primary/70">
            <Lock className="size-4 text-secondary-fixed" aria-hidden="true" />
            MOH & SFDA Verified Secure Gateway
          </div>
        </div>

        <div className="flex flex-col justify-center bg-surface-container-lowest p-space-lg md:p-space-xl lg:col-span-7">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-space-md">
              <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">Provider Hub</span>
              <h1 className="mt-1 font-headline-md text-headline-md text-on-surface">Clinic Provider Sign In</h1>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">Access your clinic management console</p>
            </div>

            <div className="mb-space-md flex w-full items-center rounded-xl bg-surface-container p-1" role="radiogroup" aria-label="Account type">
              {Object.entries(PORTALS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={portal === key}
                  onClick={() => setPortal(key)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-title-md text-body-sm transition-all duration-200',
                    portal === key ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-space-md" noValidate>
              <FormAlert>{serverError}</FormAlert>
              <Field label={config.fieldLabel} required labelStyle="title" error={errors.identifier?.message} className="[&_label]:text-body-sm">
                <TextInput leftIcon={IdCard} placeholder={config.placeholder} autoComplete="username" {...register('identifier')} />
              </Field>
              <Field
                label="Password"
                required
                labelStyle="title"
                className="[&_label]:text-body-sm"
                error={errors.password?.message}
                labelAside={
                  <Link to={ROUTES.forgotPassword} className="font-label-sm text-label-sm text-primary transition-colors hover:text-tertiary">
                    Forgot password?
                  </Link>
                }
              >
                <PasswordInput leftIcon={Lock} placeholder="••••••••••••••••" {...register('password')} />
              </Field>
              <Checkbox label="Remember this device" {...register('remember')} />
              <Button type="submit" size="xl" fullWidth loading={isSubmitting} rightIcon={isSubmitting ? undefined : ArrowRight}>
                {isSubmitting ? 'Verifying MOH Registry…' : config.submit}
              </Button>
              <div className="border-t border-outline-variant/30 pt-space-sm text-center">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  New clinic in Riyadh?
                  <Link to={ROUTES.clinicRegister} className="ml-1 font-semibold text-primary transition-colors hover:text-tertiary">
                    Apply for Accreditation
                  </Link>
                </p>
              </div>
              <p className="flex items-center justify-center gap-1 text-center font-label-sm text-label-sm text-outline">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                MOH & SFDA Compliant Platform • 256-bit SSL
              </p>
            </form>

            <DemoAccounts
              roles={config.demoRoles}
              onPick={(email, password) => {
                setValue('identifier', email, { shouldValidate: true });
                setValue('password', password, { shouldValidate: true });
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
