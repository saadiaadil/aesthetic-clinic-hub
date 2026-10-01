import { useMemo, useState } from 'react';
import { BadgeCheck, CalendarDays, Car, Clock, ExternalLink, MapPin, PhoneCall, Route, Share2, Star, Stethoscope } from 'lucide-react';
import { useParams } from 'react-router';
import { images } from '@/assets/images';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { Container, Overline } from '@/components/common/Layout';
import { Breadcrumb, Tabs } from '@/components/common/Navigation';
import { Stars } from '@/components/common/Rating';
import { Skeleton, SkeletonText } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { BookingDock } from '@/components/clinic/BookingDock';
import { ClinicGallery } from '@/components/clinic/ClinicGallery';
import { FavoriteButton } from '@/components/clinic/FavoriteButton';
import { ServiceMenuItem } from '@/components/clinic/ServiceMenuItem';
import { DoctorCard } from '@/components/doctor/DoctorCard';
import { RatingBreakdown, ReviewCard } from '@/components/review/ReviewCards';
import { getDistrictName } from '@/constants/districts';
import { ROUTES } from '@/constants/routes';
import { specialties } from '@/data/treatments';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { getClinicById } from '@/services/clinicService';
import { getOpeningStatus, mapsUrl } from '@/utils/clinic';
import { formatNumber, formatPrice, formatRating, formatSaudiPhone } from '@/utils/format';

function ClinicDetailSkeleton() {
  return (
    <Container className="space-y-8 py-8" aria-hidden="true">
      <Skeleton className="h-4 w-72" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid gap-4 md:grid-cols-12">
        <Skeleton className="h-[460px] md:col-span-8" />
        <div className="grid gap-4 md:col-span-4">
          <Skeleton className="h-[222px]" />
          <Skeleton className="h-[222px]" />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Skeleton className="h-48" />
          <SkeletonText lines={4} />
        </div>
        <Skeleton className="h-[560px] lg:col-span-4" />
      </div>
    </Container>
  );
}

export default function ClinicDetailPage() {
  const { clinicId } = useParams();
  const toast = useToast();
  const { data: clinic, isLoading, error, reload } = useAsync(() => getClinicById(clinicId), [clinicId]);
  useDocumentTitle(clinic?.name ?? 'Clinic');

  const [category, setCategory] = useState('all');
  const [serviceId, setServiceId] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const categories = useMemo(() => {
    if (!clinic) return [];
    const ids = [...new Set(clinic.services.map((service) => service.treatment?.specialtyId).filter(Boolean))];
    return [
      { value: 'all', label: `All Services (${clinic.services.length})` },
      ...specialties.filter((item) => ids.includes(item.id)).map((item) => ({ value: item.id, label: item.shortLabel })),
    ];
  }, [clinic]);

  if (isLoading) return <ClinicDetailSkeleton />;
  if (error) {
    return (
      <Container className="py-space-xl">
        {error.status === 404 ? (
          <EmptyState
            titleAs="h1"
            title="This clinic isn’t listed"
            description="It may be awaiting MOH verification or no longer accepting patients. Explore other verified clinics in Riyadh."
            action={<Button to={ROUTES.clinics}>Browse verified clinics</Button>}
          />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </Container>
    );
  }

  const activeService = clinic.services.find((service) => service.id === serviceId) ?? clinic.services[0];
  const activeDoctorId = doctorId ?? activeService?.doctorIds.find((id) => clinic.doctors.some((doctor) => doctor.id === id)) ?? 'any';
  const visibleServices = clinic.services.filter((service) => category === 'all' || service.treatment?.specialtyId === category);
  const reviews = showAllReviews ? clinic.reviews : clinic.reviews.slice(0, 2);
  const openStatus = getOpeningStatus(clinic.openingHours);
  const scrollToDock = () => document.getElementById('booking-dock')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const selectService = (service) => {
    setServiceId(service.id);
    if (doctorId && doctorId !== 'any' && !service.doctorIds.includes(doctorId)) setDoctorId(null);
    if (window.innerWidth < 1024) scrollToDock();
  };

  const selectDoctor = (id) => {
    setDoctorId(id);
    if (activeService && !activeService.doctorIds.includes(id)) {
      const alternative = clinic.services.find((service) => service.doctorIds.includes(id));
      if (alternative) setServiceId(alternative.id);
    }
    if (window.innerWidth < 1024) scrollToDock();
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Clinic link copied to clipboard');
    } catch {
      toast.info('Copy this link', window.location.href);
    }
  };

  return (
    <div className="flex w-full flex-col pb-24 lg:pb-0">
      {/* Sub-header: breadcrumb & quick actions */}
      <section className="w-full bg-surface-container-low py-4">
        <Container className="flex flex-wrap items-center justify-between gap-4">
          <Breadcrumb
            items={[
              { label: 'Home', to: ROUTES.home },
              { label: 'Clinics', to: ROUTES.clinics },
              { label: getDistrictName(clinic.districtId), to: `${ROUTES.clinics}?district=${clinic.districtId}` },
              { label: clinic.name },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <FavoriteButton clinicId={clinic.id} clinicName={clinic.name} variant="pill" />
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3.5 py-1.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <Share2 className="size-[18px]" aria-hidden="true" />
              Share
            </button>
            <Badge tone="gold" size="lg" className="bg-secondary-fixed/50 font-label-sm text-label-sm text-on-secondary-fixed-variant">
              <BadgeCheck className="size-[15px] text-secondary" aria-hidden="true" />
              MOH License #{clinic.licenseNumber.replace(/^MOH-/, '')}
            </Badge>
          </div>
        </Container>
      </section>

      {/* Identity & gallery */}
      <Container as="section" className="pb-12 pt-8">
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="plum" uppercase>
                {clinic.category}
              </Badge>
              <span className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary">
                <Clock className="size-4" aria-hidden="true" />
                {openStatus.label}
              </span>
              {clinic.amenities.includes('concierge') || clinic.features.vipLounge ? (
                <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="inline-block size-2 rounded-full bg-emerald-600" /> VIP Concierge Available
                </span>
              ) : null}
            </div>
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface lg:text-display-md">{clinic.name}</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-body-md text-body-md text-on-surface-variant">
              <span className="flex items-center gap-1 font-semibold text-on-surface">
                <Star className="size-5 fill-current text-secondary" aria-hidden="true" />
                {clinic.reviewCount ? formatRating(clinic.rating) : 'New'}
                <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">
                  {clinic.reviewCount ? `(${formatNumber(clinic.reviewCount)} verified Saudi reviews)` : '(no reviews yet)'}
                </span>
              </span>
              <span className="hidden text-outline-variant sm:inline" aria-hidden="true">
                •
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-[18px] text-primary" aria-hidden="true" />
                {clinic.address}
              </span>
              {clinic.features.valet && (
                <>
                  <span className="hidden text-outline-variant sm:inline" aria-hidden="true">
                    •
                  </span>
                  <span className="flex items-center gap-1 font-body-sm text-body-sm font-medium text-primary">
                    <Car className="size-[17px]" aria-hidden="true" />
                    Complimentary Private Valet
                  </span>
                </>
              )}
            </div>
          </div>
          <Button leftIcon={CalendarDays} size="lg" onClick={scrollToDock} className="shrink-0 hover:bg-primary-container">
            Book Appointment
          </Button>
        </div>
        <ClinicGallery clinicName={clinic.name} gallery={clinic.gallery} />
      </Container>

      {/* Content & sticky booking dock */}
      <Container as="section" className="pb-20">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-12 lg:col-span-8">
            {/* Philosophy */}
            <div className="space-y-6 rounded-xl bg-surface-container-low p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary-fixed/50 text-secondary">
                  <Stethoscope className="size-[22px]" aria-hidden="true" />
                </span>
                <div>
                  <Overline className="text-primary">Precision & Discretion</Overline>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">{clinic.philosophyTitle}</h2>
                </div>
              </div>
              <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{clinic.description}</p>
              {clinic.standards.length > 0 && (
                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
                  {clinic.standards.map((standard) => (
                    <div key={standard.title} className="space-y-2 rounded-lg bg-surface p-5">
                      <div className="flex items-center gap-2 text-primary">
                        <DynamicIcon name={standard.icon} className="size-5" />
                        <span className="font-title-md text-title-md">{standard.title}</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{standard.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Treatment menu */}
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <Overline>Curated Procedures</Overline>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Treatment Menu & Transparent Pricing</h2>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">All prices include 15% VAT</span>
              </div>
              <Tabs variant="chips" tabs={categories} value={category} onChange={setCategory} label="Treatment categories" />
              <div className="space-y-4">
                {visibleServices.map((service) => (
                  <ServiceMenuItem key={service.id} service={service} selected={service.id === activeService?.id} onSelect={selectService} />
                ))}
              </div>
            </div>

            {/* Specialists */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Overline>Medical Leadership</Overline>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Resident Aesthetic Consultants</h2>
                </div>
                <span className="hidden font-label-md text-label-md font-semibold text-primary sm:inline">{clinic.doctors.length} Board-Certified Specialists</span>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {clinic.doctors.map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    selected={doctor.id === activeDoctorId}
                    action={
                      <Button
                        variant={doctor.id === activeDoctorId ? 'primary' : 'soft'}
                        size="sm"
                        fullWidth
                        className="py-2.5 shadow-none hover:bg-primary hover:text-on-primary"
                        onClick={() => selectDoctor(doctor.id)}
                        aria-pressed={doctor.id === activeDoctorId}
                      >
                        {doctor.id === activeDoctorId ? 'Selected Specialist' : 'Select Specialist'}
                      </Button>
                    }
                  />
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-8 rounded-xl bg-surface-container-low p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <Overline>Verified Satisfaction</Overline>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Patient Reviews & Scores</h2>
                </div>
                <div className="flex items-center gap-4 rounded-xl bg-surface px-6 py-4">
                  <span className="font-display-md text-display-md font-bold text-primary">{formatRating(clinic.rating)}</span>
                  <div className="space-y-1">
                    <Stars value={clinic.rating} size="lg" />
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Based on {formatNumber(clinic.reviewCount)} MOH-authenticated visits</p>
                  </div>
                </div>
              </div>
              <RatingBreakdown breakdown={clinic.ratingBreakdown} />
              {clinic.reviews.length ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {clinic.reviews.length > 2 && (
                    <Button variant="soft" onClick={() => setShowAllReviews((value) => !value)} aria-expanded={showAllReviews}>
                      {showAllReviews ? 'Show fewer reviews' : `Show all ${clinic.reviews.length} published reviews`}
                    </Button>
                  )}
                </div>
              ) : (
                <EmptyState compact title="No published reviews yet" description="Reviews appear here after verified patients complete their visits." />
              )}
            </div>

            {/* Amenities */}
            <div className="space-y-6 rounded-xl bg-surface-container-low p-6 sm:p-8">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Signature Clinic Amenities</h2>
              <ul className="grid grid-cols-1 gap-6 min-[420px]:grid-cols-2 sm:grid-cols-3">
                {clinic.amenityDetails.map((amenity) => (
                  <li key={amenity.id} className="flex items-start gap-3">
                    <DynamicIcon name={amenity.icon} className="size-6 text-primary" />
                    <div>
                      <h3 className="font-title-md text-title-md text-on-surface">{amenity.label}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{amenity.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Location */}
            <div className="space-y-6 rounded-xl bg-surface-container-low p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <Overline>{getDistrictName(clinic.districtId)} District</Overline>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Location & Accessibility</h2>
                </div>
                <a
                  href={mapsUrl(clinic)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary hover:underline"
                >
                  Open in Google Maps
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
              <div className="relative h-72 w-full overflow-hidden rounded-xl bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${images.misc.riyadhMap})` }} role="img" aria-label={`Map showing ${clinic.name} in ${clinic.districtLabel}`}>
                <div className="absolute bottom-4 left-4 max-w-xs space-y-1 rounded-lg bg-surface/95 px-4 py-3 shadow-md backdrop-blur-md">
                  <p className="font-title-md text-title-md text-on-surface">{clinic.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{clinic.address}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 font-body-sm text-body-sm text-on-surface-variant">
                {clinic.travelNote && (
                  <span className="flex items-center gap-2">
                    <Route className="size-[18px] text-primary" aria-hidden="true" />
                    {clinic.travelNote}
                  </span>
                )}
                <a href={`tel:${clinic.contactNo}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                  <PhoneCall className="size-[18px]" aria-hidden="true" />
                  Direct Reception: {formatSaudiPhone(clinic.contactNo)}
                </a>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:col-span-4" aria-label="Book an appointment">
            <BookingDock
              id="booking-dock"
              clinic={clinic}
              services={clinic.services}
              doctors={clinic.doctors}
              serviceId={activeService?.id}
              onServiceChange={setServiceId}
              doctorId={activeDoctorId}
              onDoctorChange={setDoctorId}
            />
          </aside>
        </div>
      </Container>

      {/* Mobile sticky booking bar (DESIGN.md: persistent sticky bottom booking actions) */}
      {activeService && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-container-high bg-surface/95 px-margin-mobile py-3 shadow-modal backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-title-md text-title-md text-on-surface">{activeService.shortTitle}</p>
              <p className="font-label-md text-label-md text-primary">{formatPrice(activeService.priceMin)} • VAT incl.</p>
            </div>
            <Button onClick={scrollToDock} leftIcon={CalendarDays} className="shrink-0">
              Book
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
