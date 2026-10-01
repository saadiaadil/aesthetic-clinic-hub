import { useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router';
import { Button } from '@/components/common/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { IconButton } from '@/components/common/IconButton';
import { Container, SectionHeading } from '@/components/common/Layout';
import { CardSkeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/States';
import { FeaturedClinicCard } from '@/components/clinic/ClinicCard';
import { TestimonialCard } from '@/components/review/ReviewCards';
import { SpecialtyTile } from '@/components/treatment/TreatmentCards';
import { ROUTES } from '@/constants/routes';
import { HOME_TRUST_ITEMS, HOW_IT_WORKS_STEPS } from '@/data/content';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getFeaturedClinics, getClinics } from '@/services/clinicService';
import { getFeaturedReviews } from '@/services/reviewService';
import { getSpecialties } from '@/services/treatmentService';
import { cn } from '@/utils/cn';
import { DiscoveryAssistant } from './home/DiscoveryAssistant';
import { HeroSection } from './home/HeroSection';

const TRUST_TONES = {
  secondary: 'bg-secondary/10 text-secondary',
  primary: 'bg-primary/10 text-primary',
  tertiary: 'bg-tertiary/10 text-tertiary',
  gold: 'bg-secondary-fixed/50 text-secondary',
};

function TrustStrip() {
  return (
    <section className="w-full bg-surface-container-low py-space-lg" aria-label="Why patients trust us">
      <Container>
        <ul className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          {HOME_TRUST_ITEMS.map((item) => (
            <li key={item.title} className="flex items-center gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
              <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-full', TRUST_TONES[item.tone])}>
                <DynamicIcon name={item.icon} className="size-6" />
              </span>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">{item.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function SpecialtiesSection() {
  const { data, isLoading, error, reload } = useAsync(getSpecialties, []);
  const tiles = data?.slice(0, 6) ?? [];
  const treatmentTotal = data?.reduce((sum, item) => sum + item.treatmentCount, 0);
  return (
    <section className="w-full bg-surface py-space-xl">
      <Container>
        <SectionHeading
          overline="Specialty Portfolio"
          withRule
          title="Curated Aesthetic Specialties"
          className="mb-space-lg"
          action={
            <Button to={ROUTES.treatments} variant="ghost" rightIcon={ArrowRight} className="px-0 text-primary hover:bg-transparent hover:text-tertiary">
              View all {treatmentTotal ?? ''} treatments
            </Button>
          }
        />
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }, (_, index) => <CardSkeleton key={index} imageClassName="aspect-[16/11] h-auto" />)
              : tiles.map((specialty) => <SpecialtyTile key={specialty.id} specialty={specialty} />)}
          </div>
        )}
      </Container>
    </section>
  );
}

function FeaturedClinicsSection() {
  const { data, isLoading, error, reload } = useAsync(() => getFeaturedClinics(3), []);
  const { data: all } = useAsync(() => getClinics({ pageSize: 1 }), []);
  return (
    <section className="w-full bg-surface-container-low py-space-xl">
      <Container>
        <SectionHeading
          overline="Verified Excellence"
          title="Premier Medical Aesthetic Centers"
          className="mb-space-lg"
          action={
            <div className="flex flex-wrap items-center gap-space-sm">
              <Button to={`${ROUTES.clinics}#filters`} variant="soft" size="sm" className="bg-surface-container-highest hover:bg-surface-container">
                Filter by District
              </Button>
              <Button to={ROUTES.clinics} size="sm" className="shadow-none">
                See All {all?.total ?? ''} Verified Clinics
              </Button>
            </div>
          }
        />
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }, (_, index) => <CardSkeleton key={index} />)
              : data.map((clinic) => <FeaturedClinicCard key={clinic.id} clinic={clinic} />)}
          </div>
        )}
      </Container>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full scroll-mt-24 bg-surface-container-low py-space-xl">
      <Container>
        <SectionHeading
          align="center"
          overline="Confidence & Discretion"
          title="The Aesthetic Clinic Hub Experience"
          description="From verified medical credential verification to VIP post-treatment follow-up."
          className="mb-space-xl"
        />
        <ol className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <li key={step.index} className="relative rounded-2xl bg-surface p-space-md shadow-sm">
              <span className="mb-space-sm block font-headline-lg text-headline-lg font-bold text-secondary/30" aria-hidden="true">
                {step.index}
              </span>
              <h3 className="mb-2 font-headline-sm text-headline-sm text-on-surface">{step.title}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function TestimonialsSection() {
  const trackRef = useRef(null);
  const { data, isLoading } = useAsync(() => getFeaturedReviews(3), []);
  const scroll = (direction) => trackRef.current?.scrollBy({ left: direction * 360, behavior: 'smooth' });
  return (
    <section className="w-full bg-surface py-space-xl" aria-labelledby="testimonials-title">
      <Container>
        <div className="mb-space-lg flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div>
            <span className="mb-2 block font-label-sm text-label-sm uppercase tracking-widest text-secondary">Real Journeys</span>
            <h2 id="testimonials-title" className="font-headline-lg text-headline-md text-on-surface md:text-headline-lg">
              Verified Patient Experiences
            </h2>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <IconButton icon={ChevronLeft} label="Previous story" variant="soft" onClick={() => scroll(-1)} />
            <IconButton icon={ChevronRight} label="Next story" variant="soft" onClick={() => scroll(1)} />
          </div>
        </div>
        <div
          ref={trackRef}
          className="no-scrollbar -mx-margin-mobile flex snap-x snap-mandatory gap-space-md overflow-x-auto px-margin-mobile pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0"
        >
          {isLoading
            ? Array.from({ length: 3 }, (_, index) => <CardSkeleton key={index} imageClassName="h-0" className="min-w-[85%] snap-start md:min-w-0" />)
            : data?.map((review) => <TestimonialCard key={review.id} review={review} className="min-w-[85%] snap-start md:min-w-0" />)}
        </div>
      </Container>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative w-full overflow-hidden bg-surface-container-lowest py-space-xl">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-primary p-space-lg text-on-primary shadow-2xl lg:p-space-xl">
          <div className="pointer-events-none absolute -bottom-20 -right-20 size-80 rounded-full bg-secondary/20 blur-2xl" />
          <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-tertiary-container/30 blur-2xl" />
          <div className="relative z-10 max-w-2xl space-y-space-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface/10 px-3 py-1 font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">
              Kingdom of Saudi Arabia
            </span>
            <h2 className="font-display-md text-display-md-mobile text-on-primary md:text-display-md">
              Your next aesthetic appointment starts with the right clinic.
            </h2>
            <p className="font-body-lg text-body-lg text-on-primary/80">
              Compare licensed medical experts, explore transparent fees, and book securely with complete discretion across Riyadh’s top districts.
            </p>
            <div className="flex flex-col items-center gap-space-md pt-space-sm sm:flex-row">
              <Button to={ROUTES.clinics} variant="light" size="xl" className="w-full sm:w-auto">
                Explore All Clinics in Riyadh
              </Button>
              <Button to={ROUTES.clinicRegister} variant="ghost" size="xl" className="w-full text-on-primary hover:bg-surface/10 hover:text-on-primary sm:w-auto">
                List Your Aesthetic Clinic
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle('');
  const { hash } = useLocation();

  // Scroll to "#how-it-works" after lazy content mounts.
  useEffect(() => {
    if (!hash) return undefined;
    const timer = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 150);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <div className="flex w-full flex-col">
      <HeroSection />
      <TrustStrip />
      <SpecialtiesSection />
      <FeaturedClinicsSection />
      <DiscoveryAssistant />
      <HowItWorksSection />
      <TestimonialsSection />
      <FinalCta />
    </div>
  );
}
