import { useId, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, MapPin, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Container } from '@/components/common/Layout';
import { SelectInput } from '@/components/common/Form';
import { images } from '@/assets/images';
import { ALL_DISTRICTS, DISTRICTS } from '@/constants/districts';
import { ROUTES } from '@/constants/routes';
import { AVAILABILITY_OPTIONS, HERO_QUICK_SEARCHES } from '@/data/content';
import { useAsync } from '@/hooks/useAsync';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getSearchSuggestions } from '@/services/treatmentService';
import { usePreferencesStore } from '@/store/uiStore';
import { pluralize } from '@/utils/format';

/** Stitch homepage hero: editorial headline, arch visual card, floating search canvas. */
export function HeroSection() {
  const navigate = useNavigate();
  const preferredDistrict = usePreferencesStore((state) => state.district);
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState(preferredDistrict);
  const [availability, setAvailability] = useState('any');
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const listboxId = useId();
  const debounced = useDebouncedValue(query, 200);
  const { data: suggestions } = useAsync(() => getSearchSuggestions(debounced), [debounced], { keepPreviousData: true });
  useClickOutside([searchRef], () => setFlyoutOpen(false), flyoutOpen);

  const submit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (district !== ALL_DISTRICTS) params.set('district', district);
    if (availability !== 'any') params.set('availability', availability);
    navigate(`${ROUTES.clinics}${params.toString() ? `?${params}` : ''}`);
  };

  const pick = (value) => {
    setQuery(value);
    setFlyoutOpen(false);
    inputRef.current?.focus();
  };

  return (
    <section className="relative w-full overflow-hidden bg-surface pb-space-xl pt-8">
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-secondary-fixed-dim/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-1/2 size-80 rounded-full bg-tertiary-fixed-dim/30 blur-3xl" />
      <Container className="relative">
        <div className="mb-space-lg grid grid-cols-1 items-center gap-space-lg lg:grid-cols-12">
          <div className="z-10 space-y-space-md lg:col-span-7">
            <span className="inline-flex items-center gap-space-xs rounded-full bg-surface-container px-3.5 py-1.5 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              <BadgeCheck className="size-[15px] fill-secondary text-surface-container" aria-hidden="true" />
              Riyadh’s Verified Aesthetic Registry
            </span>
            <h1 className="text-balance font-display-lg text-display-lg-mobile leading-tight tracking-tight text-on-surface md:text-display-lg">
              Find the right aesthetic clinic in Riyadh.
            </h1>
            <p className="max-w-xl font-body-lg text-body-lg text-on-surface-variant">
              Discover trusted clinics, explore treatments, compare clinical credentials, and book discreet appointments with total medical confidence.
            </p>
          </div>
          <div className="relative lg:col-span-5">
            <div className="relative aspect-[4/5] max-h-[560px] w-full overflow-hidden rounded-[2.5rem] bg-surface-container-high shadow-2xl sm:aspect-[5/4] lg:aspect-[4/5]">
              <img
                src={images.home.heroSanctuarySuite}
                alt="Luxury Riyadh aesthetic treatment suite with limestone arches and warm indirect lighting"
                className="size-full object-cover transition-transform duration-700 hover:scale-105"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-on-background/70 via-transparent to-transparent" />
              <Link
                to={ROUTES.clinic('clinique-elysee')}
                className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-3 rounded-xl bg-surface/90 p-space-md shadow-lg backdrop-blur-md transition-colors hover:bg-surface"
              >
                <span>
                  <span className="block font-label-sm text-label-sm uppercase tracking-widest text-secondary">Featured Sanctuary</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Clinique Élysée Riyadh</span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant">Al Malqa • Royal Suites Available</span>
                </span>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                  <ArrowUpRight className="size-5" aria-hidden="true" />
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Interactive floating search canvas */}
        <div className="relative z-20 -mt-6 rounded-2xl bg-surface-container-lowest p-space-md shadow-xl lg:-mt-12 lg:p-space-lg">
          <form onSubmit={submit} role="search" aria-label="Find a clinic" className="grid grid-cols-1 items-end gap-space-sm md:grid-cols-2 lg:grid-cols-12">
            <div ref={searchRef} className="relative lg:col-span-5">
              <label htmlFor="hero-search" className="mb-2 block font-label-md text-label-md text-on-surface">
                TREATMENT OR CLINIC <span className="text-tertiary">*</span>
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
                <input
                  ref={inputRef}
                  id="hero-search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setFlyoutOpen(true);
                  }}
                  onFocus={() => setFlyoutOpen(true)}
                  onKeyDown={(event) => event.key === 'Escape' && setFlyoutOpen(false)}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={flyoutOpen}
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  placeholder="What treatment or clinic are you looking for?"
                  className="w-full rounded-lg bg-surface py-3 pl-11 pr-4 font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {flyoutOpen && suggestions && (suggestions.treatments.length > 0 || suggestions.clinics.length > 0) && (
                <div id={listboxId} role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl bg-surface-container-lowest p-3 shadow-2xl">
                  <p className="px-2 py-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    {query ? 'Matching Treatments' : 'Top Verified Searches'}
                  </p>
                  <div className="mt-1 space-y-1">
                    {suggestions.treatments.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected="false"
                        onClick={() => pick(item.name)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-container"
                      >
                        <span className="font-body-md text-body-md text-on-surface">{item.name}</span>
                        <span className="shrink-0 font-label-sm text-label-sm text-secondary">{pluralize(item.clinicCount, 'Clinic')}</span>
                      </button>
                    ))}
                    {suggestions.clinics.map((clinic) => (
                      <Link
                        key={clinic.id}
                        to={ROUTES.clinic(clinic.id)}
                        role="option"
                        aria-selected="false"
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-container"
                      >
                        <span className="font-body-md text-body-md text-on-surface">{clinic.name}</span>
                        <span className="shrink-0 font-label-sm text-label-sm text-on-surface-variant">{clinic.districtLabel}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <label htmlFor="hero-district" className="mb-2 block font-label-md text-label-md text-on-surface">
                DISTRICT IN RIYADH
              </label>
              <SelectInput id="hero-district" surface="surface" leftIcon={MapPin} value={district} onChange={(event) => setDistrict(event.target.value)}>
                <option value={ALL_DISTRICTS}>Riyadh • All Districts</option>
                {DISTRICTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </SelectInput>
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="hero-availability" className="mb-2 block font-label-md text-label-md text-on-surface">
                AVAILABILITY
              </label>
              <SelectInput id="hero-availability" surface="surface" leftIcon={CalendarDays} value={availability} onChange={(event) => setAvailability(event.target.value)}>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </div>

            <div className="lg:col-span-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-title-md text-title-md text-on-primary shadow-md transition-all hover:bg-tertiary active:scale-[0.98]"
              >
                Search Clinics
                <ArrowRight className="size-[18px]" aria-hidden="true" />
              </button>
            </div>
          </form>

          <div className="mt-space-sm flex flex-wrap items-center gap-2 pt-space-sm">
            <span className="mr-1 font-label-sm text-label-sm text-on-surface-variant">Quick Select:</span>
            {HERO_QUICK_SEARCHES.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => pick(chip.query)}
                className="rounded-full bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-primary hover:text-on-primary"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
