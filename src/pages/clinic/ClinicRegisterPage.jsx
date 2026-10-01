import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, BadgeCheck, Bookmark, CircleCheck, CircleHelp, ClipboardList, CloudUpload, Headset, MapPin, ShieldCheck, ShieldUser, Upload, Zap } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { images } from '@/assets/images';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { Checkbox, CheckboxCard, Field, FieldGroup, FileDropzone, PasswordInput, RadioCard, SelectInput, TextInput } from '@/components/common/Form';
import { Container } from '@/components/common/Layout';
import { FormAlert } from '@/components/common/States';
import { ProgressBar } from '@/components/dashboard/DashboardUI';
import { BRAND } from '@/constants/brand';
import { DISTRICTS, getDistrict } from '@/constants/districts';
import { ROUTES } from '@/constants/routes';
import { ACCREDITATION_BENEFITS, CLINIC_AMENITY_OPTIONS, CLINIC_SPECIALTY_OPTIONS } from '@/data/content';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { registerClinic } from '@/services/clinicService';
import { cn } from '@/utils/cn';
import { emailField, MESSAGES, passwordField, saudiMobileField, toE164 } from '@/utils/validation';

const DRAFT_KEY = 'ach.clinic-application-draft';
const file = z.object({ name: z.string(), size: z.string() }, { invalid_type_error: 'Upload this document.', required_error: 'Upload this document.' });

const schema = z
  .object({
    nameEn: z.string().trim().min(3, 'Enter the English commercial name.'),
    nameAr: z.string().trim().min(3, 'Enter the Arabic commercial name.'),
    mohLicense: z.string().trim().regex(/^MOH-\d{4,6}(-[A-Z]{3})?$/i, 'Use the MOH format, e.g. MOH-94182-RUH.'),
    crNumber: z.string().trim().regex(/^\d{10}$/, 'The CR number is 10 digits.'),
    specialty: z.string().min(1, 'Choose a specialty.'),
    directorName: z.string().trim().min(5, 'Enter the medical director’s full name.'),
    scfhsLicense: z.string().trim().regex(/^SCFHS-[A-Z0-9-]{4,}$/i, 'Use the SCFHS format, e.g. SCFHS-21-MD-98442.'),
    email: emailField,
    mobile: saudiMobileField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm the password.'),
    district: z.string().min(1, 'Choose the district.'),
    address: z.string().trim().min(8, 'Enter the street and building details.'),
    amenities: z.array(z.string()),
    mohDocument: file.nullable().refine(Boolean, 'Upload the MOH facility license certificate.'),
    baladyDocument: file.nullable().refine(Boolean, 'Upload the Balady municipal commercial permit.'),
    charter: z.literal(true, { errorMap: () => ({ message: 'Please accept the quality charter to continue.' }) }),
  })
  .refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: MESSAGES.passwordMatch });

const SECTIONS = [
  { key: 'facility', label: 'Facility & MOH', sub: 'MOH & CR', fields: ['nameEn', 'nameAr', 'mohLicense', 'crNumber', 'specialty'] },
  { key: 'director', label: 'Medical Director', sub: 'SCFHS', fields: ['directorName', 'scfhsLicense', 'email', 'mobile', 'password', 'confirmPassword'] },
  { key: 'location', label: 'Location & VIP', sub: 'Amenities', fields: ['district', 'address'] },
  { key: 'documents', label: 'Documents', sub: 'Compliance', fields: ['mohDocument', 'baladyDocument', 'charter'] },
  { key: 'verification', label: 'Verification', sub: 'Final', fields: [] },
];

const DEFAULTS = {
  nameEn: '',
  nameAr: '',
  mohLicense: '',
  crNumber: '',
  specialty: 'dermatology',
  directorName: '',
  scfhsLicense: '',
  email: '',
  mobile: '',
  password: '',
  confirmPassword: '',
  district: 'olaya',
  address: '',
  amenities: ['valet', 'privateLounges'],
  mohDocument: null,
  baladyDocument: null,
  charter: false,
};

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
    return draft ? { ...DEFAULTS, ...draft, password: '', confirmPassword: '' } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function SectionCard({ number, icon: Icon, title, tag, children }) {
  return (
    <section className="space-y-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm md:p-space-lg" aria-labelledby={`section-${number}`}>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low px-4 py-3">
        <div className="flex items-center gap-space-xs">
          <Icon className="size-[22px] text-primary" aria-hidden="true" />
          <h2 id={`section-${number}`} className="font-headline-sm text-headline-sm text-on-surface">
            {number}. {title}
          </h2>
        </div>
        <span className="hidden font-label-sm text-label-sm font-medium uppercase text-secondary sm:inline">{tag}</span>
      </div>
      {children}
    </section>
  );
}

function Stepper({ completion }) {
  const activeIndex = completion.findIndex((done) => !done);
  return (
    <nav aria-label="Application progress" className="w-full rounded-xl bg-surface-container p-space-md shadow-sm">
      <ol className="no-scrollbar flex items-center justify-between gap-4 overflow-x-auto">
        {SECTIONS.map((section, index) => {
          const done = completion[index];
          const active = index === (activeIndex === -1 ? SECTIONS.length - 1 : activeIndex);
          return (
            <li key={section.key} className="flex shrink-0 items-center gap-4" aria-current={active ? 'step' : undefined}>
              <div className={cn('flex items-center gap-space-xs', !active && !done && 'opacity-60')}>
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full font-label-md text-label-md',
                    active ? 'bg-primary text-on-primary shadow-sm' : done ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant',
                  )}
                >
                  {done && !active ? <CircleCheck className="size-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className="flex flex-col">
                  <span className={cn('font-title-md text-[13px] leading-tight', active ? 'font-semibold text-on-surface' : 'text-on-surface-variant')}>{section.label}</span>
                  <span className={cn('font-label-sm text-label-sm uppercase', active ? 'font-medium text-primary' : 'text-on-surface-variant')}>
                    {active ? 'Active Step' : done ? 'Complete' : section.sub}
                  </span>
                </span>
              </div>
              {index < SECTIONS.length - 1 && <span className={cn('h-0.5 w-8 shrink-0 opacity-40 md:w-12', done ? 'bg-primary' : 'bg-outline-variant')} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Aside() {
  return (
    <aside className="flex flex-col gap-space-md lg:col-span-4">
      <div className="space-y-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex items-center gap-space-xs">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
            <BadgeCheck className="size-[18px]" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-title-lg text-title-lg leading-tight text-on-surface">Accreditation Process</h3>
            <p className="font-label-sm text-label-sm text-secondary">TRUST & SAFETY BOARD</p>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Our medical verification committee reviews all MOH credentials, active malpractice coverage, and SCFHS practitioner records within{' '}
          <strong className="font-semibold text-on-surface">24 to 48 hours</strong>.
        </p>
        <div className="space-y-space-xs rounded-lg bg-surface-container p-space-sm">
          <div className="flex items-center justify-between text-on-surface">
            <span className="font-title-md text-[13px]">Average Approval SLA</span>
            <span className="font-label-md text-label-md font-bold text-primary">36 Hours</span>
          </div>
          <ProgressBar value={75} className="h-2" label="Average approval time" />
          <span className="block text-right font-label-sm text-label-sm text-on-surface-variant">Riyadh Medical Committee Active</span>
        </div>
        <ul className="space-y-space-sm pt-space-xs font-body-sm text-body-sm text-on-surface">
          {ACCREDITATION_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-space-xs">
              <CircleCheck className="size-[18px] shrink-0 text-secondary" aria-hidden="true" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="relative h-44 w-full">
          <img src={images.clinics.olayaHubReception} alt="Clinic reception in Al Olaya, Riyadh" className="size-full object-cover" />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent p-space-md">
            <span className="font-headline-sm text-headline-sm text-inverse-on-surface">Premier Olaya Hub</span>
          </div>
        </div>
        <div className="space-y-space-xs p-space-md">
          <div className="flex items-center justify-between font-label-md text-label-md text-on-surface-variant">
            <span>District Concentration</span>
            <span className="font-semibold text-on-surface">Al Olaya & Hittin</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            84% of {BRAND.name} aesthetic bookings originate from patients residing or seeking care within Northern and Central Riyadh districts.
          </p>
        </div>
      </div>
      <figure className="space-y-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex items-center gap-space-sm">
          <Avatar src={images.doctors.noraAlSudairi} name="Dr. Nora Al-Sudairi" size="lg" />
          <figcaption>
            <span className="block font-title-md text-[14px] text-on-surface">Dr. Nora Al-Sudairi</span>
            <span className="block font-label-sm text-label-sm text-on-surface-variant">Head of Dermatology Council</span>
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-secondary">
              <BadgeCheck className="size-3" aria-hidden="true" /> Platform Review Board
            </span>
          </figcaption>
        </div>
        <blockquote className="pt-space-xs font-body-sm text-body-sm italic text-on-surface-variant">
          “{BRAND.name} elevates clinical integrity. By bringing verified practitioners into one unified luxury registry, we uphold the highest aesthetic standards across the Kingdom.”
        </blockquote>
      </figure>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-high p-space-md">
        <div className="flex items-center gap-space-xs">
          <CircleHelp className="size-6 text-primary" aria-hidden="true" />
          <div>
            <span className="block font-title-md text-[13px] text-on-surface">Questions regarding SCFHS?</span>
            <span className="font-body-sm text-[12px] text-on-surface-variant">Chat with our licensing specialist</span>
          </div>
        </div>
        <Button href={BRAND.whatsappHref} target="_blank" rel="noopener noreferrer" variant="light" size="sm" className="shrink-0 shadow-sm">
          Inquire
        </Button>
      </div>
    </aside>
  );
}

function SubmittedState({ application }) {
  return (
    <Container className="max-w-3xl py-space-xl text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary-fixed/50 text-secondary">
        <ShieldCheck className="size-8" aria-hidden="true" />
      </span>
      <p className="mt-space-md font-label-sm text-label-sm uppercase tracking-widest text-secondary">Step 5 • Verification</p>
      <h1 className="mt-1 font-display-md text-display-md-mobile text-on-surface md:text-display-md">Application received</h1>
      <p className="mx-auto mt-2 max-w-xl font-body-lg text-body-lg text-on-surface-variant">
        {application.name} is now with the Riyadh Medical Verification Committee. Only approved clinics appear in patient search — we will notify {application.email} within 24–48 hours.
      </p>
      <ol className="mx-auto mt-space-lg max-w-md space-y-space-sm text-left">
        {['MOH facility license & Balady permit review', 'SCFHS medical director verification', 'Profile goes live in discovery & booking'].map((step, index) => (
          <li key={step} className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3 font-body-md text-body-md text-on-surface">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary-container font-label-md text-label-md text-on-primary-container">{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <div className="mt-space-lg flex flex-wrap justify-center gap-space-sm">
        <Button to={ROUTES.providerLogin}>Sign in to Provider Hub</Button>
        <Button to={ROUTES.home} variant="soft">
          Back to home
        </Button>
      </div>
    </Container>
  );
}

/** Clinic onboarding — Stitch "Clinic Provider Onboarding / Registration" (FR-3). */
export default function ClinicRegisterPage() {
  useDocumentTitle('Partner With Us — Clinic Accreditation');
  const toast = useToast();
  const [serverError, setServerError] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setError,
    getFieldState,
    formState,
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: loadDraft() });
  const { errors, isSubmitting } = formState;

  const values = watch();
  const mohValid = /^MOH-\d{4,6}(-[A-Z]{3})?$/i.test(values.mohLicense ?? '');
  const completion = SECTIONS.map((section) =>
    section.key === 'verification' ? false : section.fields.every((field) => Boolean(values[field]) && !getFieldState(field, formState).invalid),
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [submitted]);

  const saveDraft = () => {
    const { password: _password, confirmPassword: _confirm, ...draft } = getValues();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    toast.success('Draft saved', 'Continue your application any time on this device (passwords are not saved).');
  };

  const onSubmit = async (data) => {
    setServerError('');
    const district = getDistrict(data.district);
    const specialty = CLINIC_SPECIALTY_OPTIONS.find((option) => option.id === data.specialty);
    try {
      await registerClinic({
        ...data,
        mobile: toE164(data.mobile),
        districtName: district?.name ?? 'Riyadh',
        specialtyLabel: specialty?.label ?? 'Dermatology',
        documents: [
          { type: 'MOH Facility License', fileName: data.mohDocument.name, size: data.mohDocument.size },
          { type: 'Balady Municipal Permit', fileName: data.baladyDocument.name, size: data.baladyDocument.size },
        ],
      });
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted({ name: data.nameEn, email: data.email });
    } catch (error) {
      setServerError(error.message);
      Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => setError(field, { message }));
    }
  };

  if (submitted) return <SubmittedState application={submitted} />;

  return (
    <div className="relative mx-auto w-full max-w-page px-gutter-mobile pb-space-xl pt-space-md md:px-margin md:pt-space-lg">
      <div className="mb-space-lg flex flex-col gap-space-lg">
        <Stepper completion={completion} />
        <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-space-xs">
            <span className="inline-flex items-center gap-space-xs rounded-full bg-secondary-fixed px-3 py-1 font-label-sm text-label-sm tracking-wider text-on-secondary-fixed">
              <ShieldUser className="size-3.5" aria-hidden="true" />
              SAUDI ARABIA HEALTHCARE PROVIDER ACCREDITATION
            </span>
            <h1 className="font-headline-lg text-headline-md tracking-tight text-on-surface md:text-headline-lg">Partner With {BRAND.name} — Clinic Accreditation</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Join Saudi Arabia’s verified registry of luxury aesthetic, laser, and dermatological clinics. Establish direct patient trust through certified MOH compliance and bespoke concierge access.
            </p>
          </div>
          <a href={BRAND.conciergePhoneHref} className="flex shrink-0 items-center gap-space-sm rounded-lg bg-surface-container-low p-space-sm transition-colors hover:bg-surface-container">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Headset className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-label-sm text-label-sm text-on-surface-variant">Concierge Onboarding</span>
              <span className="block font-title-md text-title-md text-on-surface">{BRAND.conciergePhone}</span>
            </span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-space-lg lg:col-span-8" noValidate>
          <FormAlert>{serverError}</FormAlert>

          <SectionCard number={1} icon={ClipboardList} title="Facility Essentials" tag="MOH & CR Validation">
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              <Field label="Clinic Commercial Name (English)" required error={errors.nameEn?.message}>
                <TextInput placeholder="e.g. Lumina Dermatology & Laser Clinic" {...register('nameEn')} />
              </Field>
              <Field label="Clinic Commercial Name (Arabic)" required error={errors.nameAr?.message}>
                <TextInput dir="rtl" lang="ar" inputClassName="text-right" placeholder="عيادة د. ريم النعيم للتجميل والجلدية" {...register('nameAr')} />
              </Field>
              <Field
                label="Saudi MOH Facility License"
                required
                error={errors.mohLicense?.message}
                hint={mohValid ? 'Format validated — verified against the MOH Facility Health Database on review.' : 'Format: MOH-94182-RUH'}
                labelAside={
                  <span className="flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                    <Zap className="size-3.5" aria-hidden="true" /> Live Sync
                  </span>
                }
              >
                <TextInput
                  placeholder="MOH-8829-RYD"
                  inputClassName="tracking-wider"
                  rightSlot={
                    mohValid && (
                      <span className="mr-1 flex items-center gap-1 rounded-full bg-secondary-fixed/50 px-2.5 py-1 font-label-sm text-label-sm text-on-secondary-fixed">
                        <BadgeCheck className="size-3.5 text-secondary" aria-hidden="true" /> Valid
                      </span>
                    )
                  }
                  {...register('mohLicense')}
                />
              </Field>
              <Field label="Commercial Registration (CR)" required error={errors.crNumber?.message} hint="Ministry of Commerce 10-digit number">
                <TextInput inputMode="numeric" maxLength={10} placeholder="1010XXXXXX" inputClassName="tracking-wider" {...register('crNumber')} />
              </Field>
            </div>
            <FieldGroup legend="Primary Medical Specialty Classification" required error={errors.specialty?.message}>
              <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2 lg:grid-cols-4">
                {CLINIC_SPECIALTY_OPTIONS.map((option) => (
                  <RadioCard key={option.id} value={option.id} title={option.label} {...register('specialty')} />
                ))}
              </div>
            </FieldGroup>
          </SectionCard>

          <SectionCard number={2} icon={ClipboardList} title="Primary Medical Director & Admin" tag="SCFHS Registered">
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              <Field label="Medical Director Full Name" required error={errors.directorName?.message}>
                <TextInput placeholder="Dr. First Last" {...register('directorName')} />
              </Field>
              <Field label="SCFHS Practitioner License ID" required error={errors.scfhsLicense?.message}>
                <TextInput placeholder="SCFHS ID (e.g. SCFHS-21-MD-98442)" {...register('scfhsLicense')} />
              </Field>
              <Field label="Official Clinical Email" required error={errors.email?.message} hint="Must match the official clinic or registered domain.">
                <TextInput type="email" autoComplete="email" placeholder="director@yourclinic.sa" {...register('email')} />
              </Field>
              <Field label="Direct Mobile Number" required error={errors.mobile?.message}>
                <TextInput prefix="+966" type="tel" placeholder="50 XXX XXXX" {...register('mobile')} />
              </Field>
              <Field label="Portal Security Password" required error={errors.password?.message}>
                <PasswordInput autoComplete="new-password" placeholder="Min. 8 characters, letters & numbers" {...register('password')} />
              </Field>
              <Field label="Confirm Security Password" required error={errors.confirmPassword?.message}>
                <PasswordInput autoComplete="new-password" placeholder="Re-type password" {...register('confirmPassword')} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard number={3} icon={MapPin} title="Riyadh Location & VIP Amenities" tag="Riyadh Region">
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
              <Field label="Primary District" required error={errors.district?.message}>
                <SelectInput {...register('district')}>
                  {DISTRICTS.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Physical Street & Building Details" required error={errors.address?.message} className="md:col-span-2">
                <TextInput placeholder="King Fahd Rd, Tower 4, 11th Floor" {...register('address')} />
              </Field>
            </div>
            <FieldGroup legend="Patient Hospitality & VIP Infrastructure">
              <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 md:grid-cols-4">
                {CLINIC_AMENITY_OPTIONS.map((option) => (
                  <CheckboxCard key={option.id} compact value={option.id} title={option.label} iconNode={<DynamicIcon name={option.icon} className="size-[18px] text-secondary" />} {...register('amenities')} />
                ))}
              </div>
            </FieldGroup>
          </SectionCard>

          <SectionCard number={4} icon={Upload} title="Compliance & Verification Uploads" tag="PDF or High-Res JPG">
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              <Controller
                name="mohDocument"
                control={control}
                render={({ field }) => (
                  <Field label="MOH Facility License Certificate" required error={errors.mohDocument?.message}>
                    <FileDropzone value={field.value} onChange={field.onChange} title="Drop MOH License Document" icon={ShieldCheck} highlight />
                  </Field>
                )}
              />
              <Controller
                name="baladyDocument"
                control={control}
                render={({ field }) => (
                  <Field label="Balady Municipal Commercial Permit" required error={errors.baladyDocument?.message}>
                    <FileDropzone value={field.value} onChange={field.onChange} title="Drop Balady Commercial License" icon={CloudUpload} />
                  </Field>
                )}
              />
            </div>
          </SectionCard>

          <div className="space-y-space-sm rounded-xl bg-surface-container p-space-md">
            <Checkbox
              className="[&_input]:size-5"
              invalid={Boolean(errors.charter)}
              label={
                <span className="space-y-1">
                  <span className="block font-title-md text-[15px] text-on-surface">Acknowledgment of {BRAND.name} Quality Charter & Patient Privacy Standards</span>
                  <span className="block">
                    We officially verify that our medical center, operating doctors, and staff strictly adhere to the Saudi Commission for Health Specialties (SCFHS) code of ethics, Saudi Personal
                    Data Protection Law (PDPL), and Saudi Ministry of Health regulations. We understand {BRAND.name} reserves the right to unlist clinics failing clinical safety audits.
                  </span>
                </span>
              }
              {...register('charter')}
            />
            {errors.charter && <p className="pl-7 font-body-sm text-body-sm text-error">{errors.charter.message}</p>}
          </div>

          <div className="flex flex-col-reverse items-center justify-between gap-space-md pt-space-xs sm:flex-row">
            <Button variant="tonal" leftIcon={Bookmark} onClick={saveDraft} className="w-full sm:w-auto">
              Save Draft
            </Button>
            <Button type="submit" size="xl" rightIcon={ArrowRight} loading={isSubmitting} className="w-full hover:bg-brand-burgundy sm:w-auto">
              Submit for Verification
            </Button>
          </div>
          <p className="text-center font-body-sm text-body-sm text-on-surface-variant sm:text-right">
            Already accredited?{' '}
            <Link to={ROUTES.providerLogin} className="font-semibold text-primary hover:underline">
              Sign in to the Provider Hub
            </Link>
          </p>
        </form>
        <Aside />
      </div>
    </div>
  );
}
