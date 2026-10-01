import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, ExternalLink, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { CheckboxCard, Field, FieldGroup, SelectInput, Switch, TextInput, Textarea } from '@/components/common/Form';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState, FormAlert } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { DISTRICTS, getDistrict } from '@/constants/districts';
import { ROUTES } from '@/constants/routes';
import { AMENITIES } from '@/data/clinics';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { getClinicById, updateClinicProfile } from '@/services/clinicService';
import { minutesToSlot, WEEKDAYS } from '@/utils/date';
import { formatDate, formatSlot } from '@/utils/format';

const TIMES = Array.from({ length: 33 }, (_, index) => minutesToSlot(7 * 60 + index * 30));
const FEATURES = [
  { id: 'instantConfirmation', label: 'Instant confirmation', description: 'Bookings are confirmed automatically when a slot is free.' },
  { id: 'weekend', label: 'Weekend appointments', description: 'Shown under “Weekend Appointments” in discovery.' },
  { id: 'femaleDermatologists', label: 'Female dermatologists', description: 'At least one female specialist on the roster.' },
  { id: 'vipLounge', label: 'VIP private lounges', description: 'Private waiting suites with no shared corridors.' },
  { id: 'valet', label: 'Valet parking', description: 'Complimentary valet or private garage.' },
];

const schema = z
  .object({
    name: z.string().trim().min(3, 'Enter the clinic name.'),
    nameAr: z.string().trim().min(2, 'Enter the Arabic name.'),
    category: z.string().trim().min(3),
    shortDescription: z.string().trim().min(20, 'At least 20 characters.').max(160, 'Keep under 160 characters.'),
    description: z.string().trim().min(40, 'At least 40 characters.').max(900),
    districtId: z.string().min(1),
    address: z.string().trim().min(8, 'Enter the full street address.'),
    contactNo: z.string().trim().regex(/^\+9665\d{8}$|^\+9661\d{8}$/, 'Use E.164 format, e.g. +966114829900.'),
    startingPrice: z.coerce.number().min(0).max(20000),
    open: z.string(),
    close: z.string(),
    closedDays: z.array(z.string()),
    amenities: z.array(z.string()),
    instantConfirmation: z.boolean(),
    weekend: z.boolean(),
    femaleDermatologists: z.boolean(),
    vipLounge: z.boolean(),
    valet: z.boolean(),
  })
  .refine((values) => values.close > values.open, { path: ['close'], message: 'Closing time must be after opening time.' });

function ProfileForm({ clinic, onSaved }) {
  const toast = useToast();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: clinic.name,
      nameAr: clinic.nameAr,
      category: clinic.category,
      shortDescription: clinic.shortDescription,
      description: clinic.description,
      districtId: clinic.districtId,
      address: clinic.address,
      contactNo: clinic.contactNo,
      startingPrice: clinic.startingPrice,
      open: clinic.openingHours.open,
      close: clinic.openingHours.close,
      closedDays: clinic.openingHours.closedDays.map(String),
      amenities: clinic.amenities,
      ...Object.fromEntries(FEATURES.map((feature) => [feature.id, Boolean(clinic.features[feature.id])])),
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const district = getDistrict(values.districtId);
      const updated = await updateClinicProfile(clinic.id, {
        name: values.name,
        nameAr: values.nameAr,
        category: values.category,
        shortDescription: values.shortDescription,
        description: values.description,
        districtId: values.districtId,
        districtLabel: values.districtId === clinic.districtId ? clinic.districtLabel : district?.name,
        address: values.address,
        contactNo: values.contactNo,
        whatsapp: values.contactNo.replace('+', ''),
        startingPrice: values.startingPrice,
        openingHours: { open: values.open, close: values.close, closedDays: values.closedDays.map(Number) },
        amenities: values.amenities,
        features: { ...clinic.features, ...Object.fromEntries(FEATURES.map((feature) => [feature.id, values[feature.id]])) },
      });
      reset(values);
      onSaved(updated);
      toast.success('Branch profile updated', 'Changes are live on your public profile.');
    } catch (error) {
      setServerError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-space-lg" noValidate>
      <FormAlert>{serverError}</FormAlert>
      <Panel title="Identity & Story">
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <Field label="Commercial name (English)" required error={errors.name?.message}>
            <TextInput {...register('name')} />
          </Field>
          <Field label="Commercial name (Arabic)" required error={errors.nameAr?.message}>
            <TextInput dir="rtl" lang="ar" className="text-right" {...register('nameAr')} />
          </Field>
          <Field label="Category line" required error={errors.category?.message} className="md:col-span-2">
            <TextInput placeholder="e.g. Bespoke Aesthetics & Dermatology" {...register('category')} />
          </Field>
          <Field label="Card summary" required error={errors.shortDescription?.message} className="md:col-span-2" hint="Shown on discovery and homepage cards.">
            <Textarea rows={2} {...register('shortDescription')} />
          </Field>
          <Field label="Clinic philosophy" required error={errors.description?.message} className="md:col-span-2">
            <Textarea rows={4} {...register('description')} />
          </Field>
        </div>
      </Panel>

      <Panel title="Location & Contact">
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <Field label="District" required error={errors.districtId?.message}>
            <SelectInput {...register('districtId')}>
              {DISTRICTS.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Reception number (E.164)" required error={errors.contactNo?.message}>
            <TextInput type="tel" {...register('contactNo')} />
          </Field>
          <Field label="Street & building" required error={errors.address?.message} className="md:col-span-2">
            <TextInput {...register('address')} />
          </Field>
        </div>
      </Panel>

      <Panel title="Hours, Pricing & Booking">
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
          <Field label="Opens" error={errors.open?.message}>
            <SelectInput {...register('open')}>
              {TIMES.map((time) => (
                <option key={time} value={time}>
                  {formatSlot(time)}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Closes" error={errors.close?.message}>
            <SelectInput {...register('close')}>
              {TIMES.map((time) => (
                <option key={time} value={time}>
                  {formatSlot(time)}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Consultation from (SAR)" error={errors.startingPrice?.message}>
            <TextInput type="number" min="0" {...register('startingPrice')} />
          </Field>
        </div>
        <FieldGroup legend="Closed on" className="mt-space-md">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {WEEKDAYS.map((day, index) => (
              <CheckboxCard key={day} compact title={day} value={String(index)} {...register('closedDays')} />
            ))}
          </div>
        </FieldGroup>
        <div className="mt-space-md grid grid-cols-1 gap-space-sm md:grid-cols-2">
          {FEATURES.map((feature) => (
            <label key={feature.id} className="flex cursor-pointer items-start justify-between gap-space-md rounded-lg bg-surface-container-low p-space-sm">
              <span>
                <span className="block font-title-md text-title-md text-on-surface">{feature.label}</span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant">{feature.description}</span>
              </span>
              <Switch srLabel={feature.label} className="mt-1" {...register(feature.id)} />
            </label>
          ))}
        </div>
      </Panel>

      <Panel title="Signature Amenities">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(AMENITIES).map(([id, amenity]) => (
            <CheckboxCard key={id} value={id} title={amenity.label} description={amenity.description} iconNode={<DynamicIcon name={amenity.icon} className="mt-1 size-[18px] text-secondary" />} {...register('amenities')} />
          ))}
        </div>
      </Panel>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" size="lg" leftIcon={Save} loading={isSubmitting} disabled={!isDirty} className="shadow-lift">
          Save branch profile
        </Button>
      </div>
    </form>
  );
}

/** Branch profile — clinic identity, contact, hours, amenities and booking features. */
export default function ClinicProfilePage() {
  useDocumentTitle('Branch Profile');
  const { user } = useAuth();
  const { data: clinic, isLoading, error, reload, setData } = useAsync(() => getClinicById(user.clinicId, { includeUnverified: true }), [user.clinicId]);

  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        pills={clinic && <StatusBadge type="clinic" status={clinic.verificationStatus} />}
        title="Branch Profile"
        meta={<span>What patients see on your public profile, discovery cards and booking flow.</span>}
        actions={
          clinic?.verificationStatus === 'verified' && (
            <Button to={ROUTES.clinic(clinic.id)} variant="tonal" rightIcon={ExternalLink}>
              View public profile
            </Button>
          )
        }
      />
      {isLoading || !clinic ? (
        <div className="space-y-space-md">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
          <div className="xl:col-span-8">
            <ProfileForm clinic={clinic} onSaved={(updated) => setData((current) => ({ ...current, ...updated }))} />
          </div>
          <div className="flex flex-col gap-space-lg xl:sticky xl:top-24 xl:col-span-4">
            <Panel titleSize="title" title="Verification">
              <dl className="space-y-2 font-body-sm text-body-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">MOH facility license</dt>
                  <dd className="font-semibold text-on-surface">{clinic.licenseNumber}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Commercial registration</dt>
                  <dd className="font-semibold text-on-surface">{clinic.crNumber}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Verified</dt>
                  <dd className="font-semibold text-on-surface">{clinic.verifiedAt ? formatDate(clinic.verifiedAt) : 'Awaiting review'}</dd>
                </div>
              </dl>
              <p className="mt-space-sm flex items-start gap-2 rounded-lg bg-secondary-fixed/30 p-3 font-body-sm text-body-sm text-on-secondary-fixed">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
                License details are locked after verification. Contact the platform team to update them.
              </p>
            </Panel>
            <Panel titleSize="title" title="Gallery">
              <div className="grid grid-cols-2 gap-2">
                {clinic.gallery.slice(0, 4).map((image) => (
                  <img key={image.caption} src={image.src} alt={image.caption} className="aspect-[4/3] w-full rounded-lg object-cover" />
                ))}
              </div>
              <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">Image uploads connect to secure storage (S3/R2) in Phase 5.</p>
            </Panel>
            <Panel titleSize="title" title="Public Rating">
              <p className="font-headline-lg text-headline-lg text-primary">{clinic.rating ? clinic.rating.toFixed(2) : '—'}</p>
              <Badge tone="gold">{clinic.reviewCount} verified reviews</Badge>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
