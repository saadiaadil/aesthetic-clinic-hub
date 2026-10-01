import { ArrowRight, BadgeCheck, Briefcase, CalendarDays, Languages, MapPin } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Container, Overline, SectionHeading } from '@/components/common/Layout';
import { Breadcrumb } from '@/components/common/Navigation';
import { RatingValue } from '@/components/common/Rating';
import { Skeleton, SkeletonText } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { nextAvailableLabel } from '@/components/clinic/ClinicCard';
import { ServiceMenuItem } from '@/components/clinic/ServiceMenuItem';
import { ReviewCard } from '@/components/review/ReviewCards';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getDoctorById } from '@/services/doctorService';
import { useBookingStore } from '@/store/bookingStore';
import { formatNumber, getFirstName, getInitials } from '@/utils/format';

export default function DoctorDetailPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const startBooking = useBookingStore((state) => state.start);
  const { data: doctor, isLoading, error, reload } = useAsync(() => getDoctorById(doctorId), [doctorId]);
  useDocumentTitle(doctor?.name ?? 'Specialist');

  if (isLoading) {
    return (
      <Container className="grid gap-space-lg py-space-xl lg:grid-cols-12" aria-hidden="true">
        <Skeleton className="aspect-square rounded-2xl lg:col-span-4" />
        <div className="space-y-4 lg:col-span-8">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <SkeletonText lines={4} />
        </div>
      </Container>
    );
  }
  if (error) {
    return (
      <Container className="py-space-xl">
        {error.status === 404 ? (
          <EmptyState titleAs="h1" title="Specialist not found" description="This profile may be awaiting verification." action={<Button to={ROUTES.doctors}>Browse specialists</Button>} />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </Container>
    );
  }

  const book = (serviceId = null) => {
    startBooking({ clinicId: doctor.primaryClinicId, clinicServiceId: serviceId, doctorId: doctor.id });
    navigate(serviceId ? ROUTES.booking.dateTime : ROUTES.booking.service);
  };

  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-surface-container-low py-4">
        <Container>
          <Breadcrumb items={[{ label: 'Home', to: ROUTES.home }, { label: 'Specialists', to: ROUTES.doctors }, { label: doctor.name }]} />
        </Container>
      </section>

      <Container as="section" className="grid grid-cols-1 gap-space-lg pb-space-xl pt-space-lg lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-container shadow-lg">
            {doctor.photo ? (
              <img src={doctor.photo} alt={`${doctor.name}, ${doctor.title}`} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary-fixed via-surface-container to-secondary-fixed/60">
                <span className="font-display-lg text-display-lg text-primary/70" aria-hidden="true">
                  {getInitials(doctor.name)}
                </span>
              </div>
            )}
            {doctor.badges[0] && (
              <Badge tone="goldSolid" size="md" className="absolute right-3 top-3 font-bold">
                {doctor.badges[0]}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-space-md lg:col-span-8">
          <div className="space-y-2">
            <Overline>{doctor.specialization}</Overline>
            <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">{doctor.name}</h1>
            <p className="font-title-lg text-title-lg text-primary">{doctor.title}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-body-md text-body-md text-on-surface-variant">
              {doctor.rating > 0 && <RatingValue value={doctor.rating} count={doctor.reviewCount} countLabel="verified reviews" size="lg" />}
              <span className="flex items-center gap-1.5">
                <Briefcase className="size-[18px] text-primary" aria-hidden="true" />
                {doctor.experienceYears}+ years experience
              </span>
              <span className="flex items-center gap-1.5">
                <Languages className="size-[18px] text-primary" aria-hidden="true" />
                {doctor.languageLabels.join(', ')}
              </span>
            </div>
          </div>

          <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">{doctor.about}</p>

          <ul className="flex flex-wrap gap-2">
            {doctor.credentials.map((credential) => (
              <li key={credential} className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed/40 px-3 py-1.5 font-label-md text-label-md text-on-secondary-fixed-variant">
                <BadgeCheck className="size-4 text-secondary" aria-hidden="true" />
                {credential}
              </li>
            ))}
            <li className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface-variant">
              {doctor.scfhsLicense}
            </li>
          </ul>

          <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-low p-space-md sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              {doctor.clinics.map((clinic) => (
                <p key={clinic.id} className="flex items-center gap-1.5 font-title-md text-title-md text-on-surface">
                  <MapPin className="size-[18px] text-secondary" aria-hidden="true" />
                  {clinic.name} <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">• {clinic.districtLabel}</span>
                </p>
              ))}
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Consultation {formatNumber(doctor.consultationFee)} SAR • {nextAvailableLabel(doctor.nextAvailable)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button to={ROUTES.clinic(doctor.primaryClinicId)} variant="soft">
                View Clinic
              </Button>
              <Button leftIcon={CalendarDays} onClick={() => book()}>
                Book with {getFirstName(doctor.name)}
              </Button>
            </div>
          </div>
        </div>
      </Container>

      <section className="w-full bg-surface-container-low py-space-xl">
        <Container className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
          <div className="space-y-space-md lg:col-span-7">
            <SectionHeading overline="Treatments Performed" title="Book a Treatment" size="md" />
            {doctor.services.length ? (
              <div className="space-y-4">
                {doctor.services.map((service) => (
                  <ServiceMenuItem key={service.id} service={service} onSelect={() => book(service.id)} actionLabel="Book this" className="bg-surface hover:bg-surface-container-lowest" />
                ))}
              </div>
            ) : (
              <EmptyState compact title="No bookable treatments" description="Contact the clinic to arrange a consultation." />
            )}
          </div>
          <div className="space-y-space-md lg:col-span-5">
            <SectionHeading overline="Verified Satisfaction" title="Patient Reviews" size="md" />
            {doctor.reviews.length ? (
              doctor.reviews.slice(0, 4).map((review) => <ReviewCard key={review.id} review={review} />)
            ) : (
              <EmptyState compact title="No published reviews yet" description="Reviews appear after verified visits." />
            )}
            <Button to={ROUTES.doctors} variant="ghost" rightIcon={ArrowRight} className="px-0 text-primary hover:bg-transparent">
              Browse all specialists
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
