import { ArrowRight, CalendarCheck, Clock, Repeat, Sparkles, Syringe, Timer, Zap } from 'lucide-react';
import { useParams } from 'react-router';
import { Accordion } from '@/components/common/Accordion';
import { Button } from '@/components/common/Button';
import { Container, Overline, SectionHeading } from '@/components/common/Layout';
import { Breadcrumb } from '@/components/common/Navigation';
import { Skeleton, SkeletonText } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { PriceComparison } from '@/components/treatment/PriceComparison';
import { TreatmentCard } from '@/components/treatment/TreatmentCards';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getTreatmentById } from '@/services/treatmentService';
import { formatNumber, pluralize } from '@/utils/format';

const FACTS = [
  { key: 'durationMinutes', label: 'Session Duration', icon: Timer, format: (value) => `${value} mins` },
  { key: 'downtime', label: 'Downtime', icon: Zap },
  { key: 'resultsIn', label: 'Results Visible', icon: CalendarCheck },
  { key: 'longevity', label: 'Results Last', icon: Clock },
  { key: 'sessions', label: 'Recommended Course', icon: Repeat },
  { key: 'anesthesia', label: 'Comfort', icon: Syringe },
];

export default function TreatmentDetailPage() {
  const { treatmentId } = useParams();
  const { data: treatment, isLoading, error, reload } = useAsync(() => getTreatmentById(treatmentId), [treatmentId]);
  useDocumentTitle(treatment?.name ?? 'Treatment');

  if (isLoading) {
    return (
      <Container className="grid gap-space-lg py-space-xl lg:grid-cols-12" aria-hidden="true">
        <div className="space-y-4 lg:col-span-7">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-14 w-3/4" />
          <SkeletonText lines={3} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
        </div>
        <Skeleton className="aspect-[4/5] rounded-[2.5rem] lg:col-span-5" />
      </Container>
    );
  }
  if (error) {
    return (
      <Container className="py-space-xl">
        {error.status === 404 ? (
          <EmptyState titleAs="h1" title="Treatment not found" description="This treatment may have been renamed or removed from the catalog." action={<Button to={ROUTES.treatments}>Browse treatments</Button>} />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </Container>
    );
  }

  const faq = [
    {
      title: 'Is this treatment right for me?',
      content: `${treatment.name} is typically recommended for ${treatment.bestFor.join(', ').toLowerCase()}. Your specialist confirms suitability during a complimentary assessment before any treatment.`,
    },
    {
      title: 'Before your visit',
      content: 'Avoid retinoids and exfoliating acids for 48 hours, arrive with clean skin, and declare any medication, allergies or recent injectables in your confidential medical intake.',
    },
    {
      title: 'Aftercare & recovery',
      content: `Expected downtime: ${treatment.downtime.toLowerCase()}. Avoid saunas, strenuous exercise and direct sun for 24 hours. Your clinic will send tailored aftercare instructions via WhatsApp.`,
    },
    {
      title: 'How is pricing shown?',
      content: 'Prices are published by each clinic, include 15% VAT and are locked at the moment you book. Consultation assessments are complimentary when you proceed with treatment.',
    },
  ];

  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-surface-container-low py-4">
        <Container>
          <Breadcrumb
            items={[
              { label: 'Home', to: ROUTES.home },
              { label: 'Treatments', to: ROUTES.treatments },
              { label: treatment.specialty?.shortLabel ?? 'Specialty', to: `${ROUTES.treatments}?specialty=${treatment.specialtyId}` },
              { label: treatment.name },
            ]}
          />
        </Container>
      </section>

      <section className="relative w-full overflow-hidden bg-surface pb-space-xl pt-space-lg">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-secondary-fixed-dim/20 blur-3xl" />
        <Container className="relative grid grid-cols-1 items-center gap-space-lg lg:grid-cols-12">
          <div className="space-y-space-md lg:col-span-7">
            <Overline withRule>
              {treatment.specialty?.index} • {treatment.specialty?.overline}
            </Overline>
            <h1 className="text-balance font-display-lg text-display-lg-mobile leading-tight tracking-tight text-on-surface md:text-display-lg">{treatment.name}</h1>
            <p className="max-w-xl font-body-lg text-body-lg text-on-surface-variant">{treatment.description}</p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FACTS.map((fact) => (
                <div key={fact.key} className="rounded-xl bg-surface-container-low p-4">
                  <dt className="flex items-center gap-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    <fact.icon className="size-4 text-primary" aria-hidden="true" />
                    {fact.label}
                  </dt>
                  <dd className="mt-1 font-title-md text-title-md text-on-surface">{fact.format ? fact.format(treatment[fact.key]) : treatment[fact.key]}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-space-sm pt-space-xs">
              <Button href="#compare" rightIcon={ArrowRight} size="lg">
                Compare {pluralize(treatment.clinicCount, 'clinic')}
              </Button>
              <Button to={`${ROUTES.booking.clinic}?treatment=${treatment.id}`} variant="soft" size="lg">
                Book this treatment
              </Button>
            </div>
          </div>
          <div className="relative lg:col-span-5">
            <div className="relative aspect-[4/5] max-h-[560px] w-full overflow-hidden rounded-[2.5rem] bg-surface-container-high shadow-2xl sm:aspect-[5/4] lg:aspect-[4/5]">
              <img src={treatment.image} alt={`${treatment.name} treatment`} className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-on-background/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-surface/90 p-space-md shadow-lg backdrop-blur-md">
                <span className="block font-label-sm text-label-sm uppercase tracking-widest text-secondary">Transparent Pricing</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  {treatment.priceFrom ? `From ${formatNumber(treatment.priceFrom)} SAR` : 'Pricing on request'}
                </span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant">
                  Across {pluralize(treatment.clinicCount, 'MOH-verified clinic')} • VAT included
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="w-full bg-surface-container-low py-space-xl">
        <Container className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
          <div className="space-y-space-md lg:col-span-5">
            <SectionHeading overline="Clinical Overview" title="Best suited for" size="md" />
            <ul className="flex flex-wrap gap-2">
              {treatment.bestFor.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-1.5 font-label-md text-label-md text-on-surface">
                  <Sparkles className="size-3.5 text-secondary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="font-body-md text-body-md text-on-surface-variant">{treatment.shortDescription}</p>
          </div>
          <div className="lg:col-span-7">
            <Accordion items={faq} className="bg-surface" />
          </div>
        </Container>
      </section>

      <Container as="section" id="compare" className="scroll-mt-24 py-space-xl">
        <SectionHeading
          overline="Side-by-Side Pricing"
          title="Compare Clinics & Transparent Pricing"
          description="Prices published by each MOH-verified clinic, sorted from lowest to highest. The price you see is the price locked at booking."
          className="mb-space-lg"
        />
        {treatment.offers.length ? (
          <PriceComparison offers={treatment.offers} treatmentName={treatment.name} />
        ) : (
          <EmptyState title="Not currently offered" description="No verified clinic lists this treatment right now. Explore related treatments below." />
        )}
      </Container>

      {treatment.related.length > 0 && (
        <section className="w-full bg-surface-container-low py-space-xl">
          <Container>
            <SectionHeading overline="Related Protocols" title={`More in ${treatment.specialty?.name}`} size="md" className="mb-space-lg" />
            <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
              {treatment.related.map((item) => (
                <TreatmentCard key={item.id} treatment={item} specialtyName={treatment.specialty?.shortLabel} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}
