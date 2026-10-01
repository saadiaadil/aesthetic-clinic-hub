import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, BadgeCheck, ChevronRight, IdCard, Lock, LockKeyhole, Mail, MapPin, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { images } from '@/assets/images';
import { PasswordStrength } from '@/components/auth/AuthWidgets';
import { Button } from '@/components/common/Button';
import { Checkbox, CheckboxCard, Field, PasswordInput, SelectInput, TextInput } from '@/components/common/Form';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { Container } from '@/components/common/Layout';
import { Stars } from '@/components/common/Rating';
import { FormAlert } from '@/components/common/States';
import { BRAND } from '@/constants/brand';
import { USE_MOCK_API } from '@/constants/config';
import { DISTRICTS } from '@/constants/districts';
import { ROUTES } from '@/constants/routes';
import { REGISTRATION_BENEFITS } from '@/data/content';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { getFirstName } from '@/utils/format';
import { emailField, MESSAGES, passwordField, requiredText, saudiMobileField, toE164 } from '@/utils/validation';

const schema = z
  .object({
    name: requiredText('Full name', 3),
    phone: saudiMobileField,
    email: emailField,
    district: z.string().min(1, 'Choose your preferred district.'),
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    femaleStaff: z.boolean(),
    whatsappReminders: z.boolean(),
    privateArrival: z.boolean(),
    terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms to create an account.' }) }),
  })
  .refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: MESSAGES.passwordMatch });

const otpSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code sent to your mobile.') });

function PrivilegesPanel() {
  return (
    <div className="flex flex-col gap-space-md lg:sticky lg:top-28">
      <div className="relative flex flex-col gap-space-md overflow-hidden rounded-xl bg-surface-container p-space-md shadow-sm lg:p-space-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-space-xs rounded-full bg-secondary-fixed/50 px-3 py-1 font-label-sm text-label-sm text-secondary">
            <Sparkles className="size-[15px]" aria-hidden="true" />
            EXCLUSIVE PATIENT PRIVILEGES
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Riyadh Sanctuary</span>
        </div>
        <div className="space-y-space-xs">
          <h1 className="font-display-md text-display-md-mobile leading-tight text-on-surface lg:text-display-md">
            Refined care, <br />
            <span className="italic text-primary">absolute discretion.</span>
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Join Saudi Arabia’s foremost aesthetic directory and gain privileged entry to leading aesthetic suites in Al Olaya, Hittin, and Al Nakheel.
          </p>
        </div>
        <div className="relative h-44 w-full overflow-hidden rounded-lg shadow-sm">
          <img src={images.auth.registrationSuite} alt="Serene Riyadh consultation suite with travertine arches" className="size-full object-cover" />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-primary/80 via-primary/20 to-transparent p-space-sm">
            <span className="flex items-center gap-space-xs font-label-md text-label-md text-on-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
              MOH Saudi Arabia Verified Clinical Standards
            </span>
          </div>
        </div>
        <ul className="space-y-space-sm pt-space-xs">
          {REGISTRATION_BENEFITS.map((benefit) => (
            <li key={benefit.title} className="flex items-start gap-space-sm">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-primary">
                <DynamicIcon name={benefit.icon} className="size-[18px]" />
              </span>
              <div>
                <h2 className="font-title-md text-title-md text-on-surface">{benefit.title}</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{benefit.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <figure className="mt-space-xs flex flex-col gap-space-xs rounded-lg bg-surface-container-lowest p-space-sm shadow-sm">
          <div className="flex items-center justify-between">
            <Stars value={5} size="sm" />
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed/40 px-2 py-0.5 font-label-sm text-label-sm text-secondary">
              <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified Patient
            </span>
          </div>
          <blockquote className="font-body-sm text-body-sm italic text-on-surface">
            “Booking my Morpheus8 sessions in Hittin through {BRAND.name} gave me peace of mind. Discretion is top tier, and their female specialist team is unmatched.”
          </blockquote>
          <figcaption className="flex items-center justify-between pt-1">
            <span className="font-label-md text-label-md font-semibold text-on-surface">Loulwa Al-Saud</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Al Olaya Member • Since 2024</span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}

/** Patient registration — Stitch "Create Your Private Profile" (step 1) + mobile verification (step 2). */
export default function SignupPage() {
  useDocumentTitle('Create Account');
  const { register: registerAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [pending, setPending] = useState(null);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      district: '',
      password: '',
      confirmPassword: '',
      femaleStaff: true,
      whatsappReminders: true,
      privateArrival: false,
      terms: false,
    },
  });
  const otpForm = useForm({ resolver: zodResolver(otpSchema), defaultValues: { code: '' } });
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const toVerification = (values) => {
    setServerError('');
    setPending(values);
    setStep(2);
  };

  const createAccount = async () => {
    setServerError('');
    try {
      const user = await registerAccount({
        name: pending.name,
        email: pending.email,
        phone: toE164(pending.phone),
        password: pending.password,
        district: pending.district,
        preferences: { femaleStaff: pending.femaleStaff, whatsappReminders: pending.whatsappReminders, privateArrival: pending.privateArrival },
      });
      toast.success(`Welcome to ${BRAND.name}, ${getFirstName(user.name)}`, 'Your private profile is ready.');
      navigate(ROUTES.patient.dashboard, { replace: true });
    } catch (error) {
      setServerError(error.message);
      if (error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => form.setError(field, { message }));
        setStep(1);
      }
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-surface py-space-lg lg:py-space-xl">
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary-fixed/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 size-[30rem] rounded-full bg-secondary-fixed/20 blur-3xl" />
      <Container className="relative z-10">
        <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <PrivilegesPanel />
          </div>

          <div className="order-1 flex flex-col lg:order-2 lg:col-span-7">
            <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-md lg:p-space-lg">
              <div className="flex flex-col gap-1 pb-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-primary">Patient Membership Portal</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Step {step} of 2</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface">{step === 1 ? 'Create Your Private Profile' : 'Verify Your Mobile'}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {step === 1
                    ? 'Join Riyadh’s premier aesthetic & cosmetic wellness network. All fields are kept under strict medical confidentiality.'
                    : `We sent a 6-digit code to +966 ${pending?.phone}. Enter it to activate your account.`}
                </p>
              </div>

              <FormAlert>{serverError}</FormAlert>

              {step === 1 ? (
                <form onSubmit={handleSubmit(toVerification)} className="flex flex-col gap-space-md" noValidate>
                  <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
                    <Field label="Full Name" required labelStyle="title" hint="As shown on National ID / Iqama" hintPosition="label" error={errors.name?.message} className="md:col-span-2">
                      <TextInput leftIcon={IdCard} placeholder="e.g. Sara Abdulaziz Al-Muqrin" autoComplete="name" {...register('name')} />
                    </Field>
                    <Field label="Saudi Mobile Number" required labelStyle="title" error={errors.phone?.message}>
                      <TextInput prefix="🇸🇦 +966" type="tel" inputMode="tel" placeholder="50 123 4567" autoComplete="tel-national" {...register('phone')} />
                    </Field>
                    <Field label="Email Address" required labelStyle="title" error={errors.email?.message}>
                      <TextInput leftIcon={Mail} type="email" placeholder="sara.aesthetic@domain.sa" autoComplete="email" {...register('email')} />
                    </Field>
                    <Field label="Preferred Riyadh District" required labelStyle="title" hint="For proximity routing" hintPosition="label" error={errors.district?.message} className="md:col-span-2">
                      <SelectInput leftIcon={MapPin} {...register('district')}>
                        <option value="" disabled>
                          Select your local district
                        </option>
                        {DISTRICTS.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.label}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="Confidential Password" required labelStyle="title" error={errors.password?.message}>
                      <PasswordInput leftIcon={Lock} placeholder="••••••••••••" autoComplete="new-password" {...register('password')} />
                    </Field>
                    <Field label="Confirm Password" required labelStyle="title" error={errors.confirmPassword?.message}>
                      <PasswordInput leftIcon={LockKeyhole} placeholder="••••••••••••" autoComplete="new-password" {...register('confirmPassword')} />
                    </Field>
                    <div className="md:col-span-2">
                      <PasswordStrength value={watch('password')} />
                    </div>
                  </div>

                  <fieldset className="space-y-space-sm pt-space-xs">
                    <legend className="mb-space-sm font-label-md text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
                      Care & Communication Preferences
                    </legend>
                    <CheckboxCard
                      title="Female-only practitioner & nurse attendance"
                      description="Clinics will prioritize female aesthetic physicians and nursing staff for consultations and treatments whenever available."
                      {...register('femaleStaff')}
                    />
                    <CheckboxCard
                      title="WhatsApp Concierge Reminders (+966)"
                      description="Receive pre-procedure prep instructions, booking confirmations, and direct contact with VIP clinic liaisons."
                      {...register('whatsappReminders')}
                    />
                    <CheckboxCard
                      title="Private Arrival Option"
                      description="Request private basement parking guidance and escort directly to clinical recovery suites."
                      {...register('privateArrival')}
                    />
                  </fieldset>

                  <div className="space-y-1 pt-2">
                    <Checkbox
                      invalid={Boolean(errors.terms)}
                      aria-invalid={errors.terms ? true : undefined}
                      label={
                        <>
                          I agree to the{' '}
                          <Link to={ROUTES.legal('terms')} className="font-medium text-primary underline hover:text-tertiary">
                            Terms of Service
                          </Link>
                          ,{' '}
                          <Link to={ROUTES.legal('privacy')} className="font-medium text-primary underline hover:text-tertiary">
                            Patient Medical Confidentiality Agreement
                          </Link>
                          , and verify that all information conforms to Kingdom of Saudi Arabia Ministry of Health (MOH) patient registration guidelines.
                        </>
                      }
                      {...register('terms')}
                    />
                    {errors.terms && <p className="pl-6 font-body-sm text-body-sm text-error">{errors.terms.message}</p>}
                  </div>

                  <div className="flex flex-col gap-space-sm pt-space-xs">
                    <Button type="submit" size="lg" fullWidth loading={isSubmitting} rightIcon={ArrowRight} className="py-3.5 font-title-lg text-title-lg">
                      Create Account & Unlock Sanctuary
                    </Button>
                    <div className="flex items-center justify-between px-1 font-body-sm text-body-sm text-on-surface-variant">
                      <span>Already have an account?</span>
                      <Link to={ROUTES.login} className="flex items-center gap-0.5 font-title-md text-title-md text-primary underline hover:text-tertiary">
                        Sign in here
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={otpForm.handleSubmit(createAccount)} className="flex flex-col gap-space-md" noValidate>
                  <Field
                    label="Verification Code"
                    required
                    labelStyle="title"
                    error={otpForm.formState.errors.code?.message}
                    hint={USE_MOCK_API ? 'Demo mode: any 6 digits are accepted.' : 'The code expires in 5 minutes.'}
                  >
                    <TextInput
                      leftIcon={Smartphone}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="••••••"
                      inputClassName="tracking-[0.5em]"
                      {...otpForm.register('code')}
                    />
                  </Field>
                  <div className="flex flex-col-reverse gap-space-sm sm:flex-row">
                    <Button variant="soft" leftIcon={ArrowLeft} onClick={() => setStep(1)}>
                      Edit details
                    </Button>
                    <Button type="submit" className="flex-1" loading={otpForm.formState.isSubmitting} rightIcon={ArrowRight}>
                      Verify & Create Account
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.info('Code re-sent', `A new code was sent to +966 ${pending?.phone}.`)}
                    className="self-start font-label-md text-label-md text-primary hover:underline"
                  >
                    Resend code
                  </button>
                </form>
              )}

              <div className="flex flex-col items-center justify-between gap-space-sm rounded-lg bg-surface-container p-space-sm text-on-surface-variant sm:flex-row">
                <span className="flex items-center gap-2 font-label-md text-label-md">
                  <BadgeCheck className="size-5 text-secondary" aria-hidden="true" />
                  Saudi MOH Authorized Platform
                </span>
                <span className="flex items-center gap-space-md font-label-sm text-label-sm">
                  <span className="flex items-center gap-1">
                    <Lock className="size-[15px]" aria-hidden="true" /> 256-Bit SSL
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-[15px]" aria-hidden="true" /> PDPL Compliant
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
