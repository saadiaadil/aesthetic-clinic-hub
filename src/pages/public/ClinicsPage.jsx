import { LayoutGrid, Lock, Map as MapIcon, Phone, SearchX, ShieldCheck, Star, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Layout';
import { Pagination } from '@/components/common/Navigation';
import { PageHero } from '@/components/common/PageHero';
import { EmptyState, ErrorState } from '@/components/common/States';
import { ClinicCard, ClinicCardSkeleton } from '@/components/clinic/ClinicCard';
import { ClinicFilters } from '@/components/clinic/ClinicFilters';
import { ClinicMap } from '@/components/clinic/ClinicMap';
import { BRAND } from '@/constants/brand';
import { PAGE_SIZE } from '@/constants/config';
import { ALL_DISTRICTS } from '@/constants/districts';
import { CLINIC_SORT_OPTIONS, RATING_OPTIONS } from '@/data/content';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { parseList, useQueryState } from '@/hooks/useQueryState';
import { searchClinics } from '@/services/clinicService';
import { getTreatments } from '@/services/treatmentService';
import { usePreferencesStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import { pluralize } from '@/utils/format';

export default function ClinicsPage() {
  useDocumentTitle('Clinics in Riyadh');
  const preferredDistrict = usePreferencesStore((state) => state.district);
  const [filters, setFilters, resetFilters] = useQueryState({
    q: '',
    district: preferredDistrict,
    specialty: 'all',
    treatment: '',
    price: 'all',
    rating: 'any',
    features: '',
    instant: '',
    availability: 'any',
    sort: 'recommended',
    view: 'grid',
    page: '1',
  });

  const minRating = RATING_OPTIONS.find((option) => option.id === filters.rating)?.min ?? 0;
  const { data, isLoading, error, reload } = useAsync(
    () =>
      searchClinics({
        q: filters.q,
        district: filters.district,
        specialty: filters.specialty,
        treatment: filters.treatment,
        price: filters.price,
        minRating,
        features: parseList(filters.features),
        instantOnly: filters.instant === '1',
        availability: filters.availability,
        sort: filters.sort,
        page: Number(filters.page),
        pageSize: filters.view === 'map' ? 50 : PAGE_SIZE.clinics,
      }),
    [filters],
    { keepPreviousData: true },
  );
  const { data: treatmentLookup } = useAsync(() => (filters.treatment ? getTreatments({ pageSize: 100 }) : Promise.resolve(null)), [filters.treatment]);
  const treatmentName = treatmentLookup?.items.find((item) => item.id === filters.treatment)?.name;

  const clinics = data?.items ?? [];
  const contextPills = [
    filters.q && { key: 'q', label: `“${filters.q}”` },
    filters.treatment && { key: 'treatment', label: treatmentName ?? 'Selected treatment' },
    filters.specialty !== 'all' && { key: 'specialty', label: filters.specialty },
    filters.availability !== 'any' && { key: 'availability', label: `Availability: ${filters.availability}` },
  ].filter(Boolean);

  const changePage = (page) => {
    setFilters({ page: String(page) });
    document.getElementById('clinic-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex w-full flex-col">
      {/* Editorial header & filter engine */}
      <PageHero
        pill="Kingdom of Saudi Arabia Verified Portals"
        title="Find Your Aesthetic Sanctuary in Riyadh"
        description="Explore Ministry of Health-licensed clinics across Al Olaya, Hittin, Al Nakheel, and Al Malqa, offering bespoke clinical artistry and discrete medical luxury."
        aside={
          <dl className="flex items-center gap-space-md self-start rounded-xl bg-surface p-space-sm shadow-sm lg:self-auto">
            {[
              { value: '100%', label: 'MOH Certified', tone: 'text-primary' },
              { value: '4.92 ★', label: 'Patient Index', tone: 'text-on-surface' },
              { value: '15 Min', label: 'VIP Concierge', tone: 'text-secondary' },
            ].map((stat, index) => (
              <div key={stat.label} className="flex items-center gap-space-md">
                {index > 0 && <div className="h-8 w-px bg-surface-container-highest" aria-hidden="true" />}
                <div className="flex flex-col px-3 py-1">
                  <dt className="order-2 font-label-sm text-label-sm text-on-surface-variant">{stat.label}</dt>
                  <dd className={cn('font-headline-sm text-headline-sm', stat.tone)}>{stat.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        }
      >
        <ClinicFilters filters={filters} onChange={setFilters} resultCount={data?.total} />
      </PageHero>

      {/* Controls bar */}
      <Container as="section" id="clinic-results" className="scroll-mt-24 pb-space-sm pt-space-lg" aria-label="Results">
        <div className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-center">
          <div className="flex items-center gap-space-xs">
            <h2 className="font-headline-sm text-headline-sm text-on-surface" aria-live="polite">
              {isLoading && !data ? 'Finding verified clinics…' : `Showing ${pluralize(data?.total ?? 0, 'Verified Medical Aesthetic Center')}`}
            </h2>
            <span className="size-2 rounded-full bg-secondary" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs">
              <label htmlFor="clinic-sort" className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Sort:
              </label>
              <select
                id="clinic-sort"
                value={filters.sort}
                onChange={(event) => setFilters({ sort: event.target.value })}
                className="cursor-pointer rounded-lg bg-surface-container-low px-3 py-1.5 font-label-md text-label-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
              >
                {CLINIC_SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center rounded-lg bg-surface-container p-1" role="group" aria-label="View">
              {[
                { id: 'grid', icon: LayoutGrid, label: 'Grid view' },
                { id: 'map', icon: MapIcon, label: 'Map view' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={filters.view === option.id}
                  onClick={() => setFilters({ view: option.id })}
                  className={cn(
                    'flex items-center justify-center rounded-md p-1.5 transition-colors',
                    filters.view === option.id ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  <option.icon className="size-[18px]" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
        {contextPills.length > 0 && (
          <div className="mt-space-sm flex flex-wrap items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Filtered by:</span>
            {contextPills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => setFilters({ [pill.key]: '' })}
                className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 font-label-sm text-label-sm capitalize text-on-primary-fixed-variant hover:bg-primary-fixed-dim"
              >
                {pill.label}
                <X className="size-3.5" aria-label={`Remove ${pill.label} filter`} />
              </button>
            ))}
          </div>
        )}
      </Container>

      {/* Results */}
      <Container as="section" className="pb-space-xl" aria-busy={isLoading}>
        {error ? (
          <ErrorState title="We couldn’t load clinics" error={error} onRetry={reload} />
        ) : !isLoading && clinics.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No clinics match your search"
            description="Try another district, widen the price range or remove a filter. New MOH-verified clinics join every week."
            action={
              <Button variant="primary" onClick={() => { resetFilters(); setFilters({ district: ALL_DISTRICTS }); }}>
                Clear all filters
              </Button>
            }
          />
        ) : filters.view === 'map' && clinics.length > 0 ? (
          <ClinicMap clinics={clinics} />
        ) : (
          <div className={cn('grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-3 transition-opacity', isLoading && data && 'opacity-60')}>
            {isLoading && !data
              ? Array.from({ length: PAGE_SIZE.clinics }, (_, index) => <ClinicCardSkeleton key={index} />)
              : clinics.map((clinic) => <ClinicCard key={clinic.id} clinic={clinic} />)}
          </div>
        )}
        {filters.view !== 'map' && data && (
          <Pagination
            className="mt-space-xl pt-space-md"
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            onChange={changePage}
            itemLabel="accredited clinics in Riyadh"
          />
        )}
      </Container>

      {/* VIP concierge callout */}
      <section className="w-full bg-surface-container-low py-space-xl">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-inverse-surface p-space-lg text-inverse-on-surface shadow-2xl md:p-space-xl">
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-secondary-fixed-dim/20 blur-3xl" />
            <div className="relative z-10 grid grid-cols-1 items-center gap-space-lg lg:grid-cols-12">
              <div className="space-y-space-sm lg:col-span-8">
                <span className="inline-block rounded-full bg-secondary-container px-3 py-1 font-label-sm text-label-sm font-bold uppercase tracking-widest text-on-secondary-container">
                  Private Medical Concierge
                </span>
                <h2 className="font-headline-lg text-headline-md text-inverse-on-surface md:text-headline-lg">Need Discretion or Personal Physician Guidance?</h2>
                <p className="max-w-xl font-body-lg text-body-lg text-inverse-on-surface/80">
                  Our Riyadh-based medical liaison team organizes bespoke multi-procedure itineraries, private entrance bookings, and bilingual consultations with top international dermatological authorities.
                </p>
                <ul className="flex flex-wrap items-center gap-space-md pt-space-xs font-label-md text-label-md text-inverse-on-surface/90">
                  <li className="flex items-center gap-1.5">
                    <Lock className="size-[18px] text-secondary-fixed" aria-hidden="true" /> Strict PDPL & MOH Privacy
                  </li>
                  <li className="flex items-center gap-1.5">
                    <ShieldCheck className="size-[18px] text-secondary-fixed" aria-hidden="true" /> Verified Credentials
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Star className="size-[18px] text-secondary-fixed" aria-hidden="true" /> Complimentary Valet Coordination
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-space-sm lg:col-span-4">
                <Button href={BRAND.whatsappHref} target="_blank" rel="noopener noreferrer" variant="gold" size="xl" className="rounded-xl py-4 font-title-lg text-title-lg font-bold">
                  Request VIP Advisor
                </Button>
                <Button href={BRAND.conciergePhoneHref} variant="luxury" size="lg" leftIcon={Phone} className="rounded-xl border-transparent hover:bg-surface-variant/20">
                  Call Concierge {BRAND.conciergePhone}
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
