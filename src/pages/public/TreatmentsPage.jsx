import { useEffect, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Layout';
import { Pagination, Tabs } from '@/components/common/Navigation';
import { PageHero } from '@/components/common/PageHero';
import { EmptyState, ErrorState } from '@/components/common/States';
import { TreatmentCard, TreatmentCardSkeleton } from '@/components/treatment/TreatmentCards';
import { PAGE_SIZE } from '@/constants/config';
import { useAsync } from '@/hooks/useAsync';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQueryState } from '@/hooks/useQueryState';
import { getSpecialties, getTreatments } from '@/services/treatmentService';
import { cn } from '@/utils/cn';

const SORTS = [
  { id: 'popular', label: 'Most Requested' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'name', label: 'Alphabetical' },
];

export default function TreatmentsPage() {
  useDocumentTitle('Treatments');
  const [filters, setFilters] = useQueryState({ q: '', specialty: 'all', sort: 'popular', page: '1' });
  const [keyword, setKeyword] = useState(filters.q);
  const debounced = useDebouncedValue(keyword, 300);

  useEffect(() => {
    if (debounced !== filters.q) setFilters({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data: specialties } = useAsync(getSpecialties, []);
  const { data, isLoading, error, reload } = useAsync(
    () => getTreatments({ q: filters.q, specialty: filters.specialty, sort: filters.sort, page: Number(filters.page), pageSize: PAGE_SIZE.treatments }),
    [filters],
    { keepPreviousData: true },
  );

  const specialtyName = (id) => specialties?.find((item) => item.id === id)?.shortLabel ?? '';
  const tabs = [{ value: 'all', label: 'All Treatments' }, ...(specialties ?? []).map((item) => ({ value: item.id, label: item.shortLabel }))];
  const activeSpecialty = specialties?.find((item) => item.id === filters.specialty);

  return (
    <div className="flex w-full flex-col">
      <PageHero
        pill="Aesthetic Portfolios"
        title="Explore Treatments & Transparent Prices"
        description="Every treatment listed by MOH-verified Riyadh clinics — with typical duration, downtime and the price range you can expect before you book."
      >
        <div className="mt-space-lg rounded-xl bg-surface p-space-md shadow-md">
          <div className="flex flex-col gap-space-sm md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-space-xs rounded-lg bg-surface-container-low px-space-sm py-2.5 focus-within:bg-surface-container">
              <Search className="ml-1 size-5 text-primary" aria-hidden="true" />
              <label htmlFor="treatment-search" className="sr-only">
                Search treatments
              </label>
              <input
                id="treatment-search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search Botox, Profhilo, laser hair removal…"
                className="w-full border-0 bg-transparent p-0 font-title-md text-title-md text-on-surface outline-none placeholder:text-outline"
              />
            </div>
            <div className="flex items-center gap-space-xs">
              <label htmlFor="treatment-sort" className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Sort:
              </label>
              <select
                id="treatment-sort"
                value={filters.sort}
                onChange={(event) => setFilters({ sort: event.target.value })}
                className="cursor-pointer rounded-lg bg-surface-container-low px-3 py-2.5 font-label-md text-label-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
              >
                {SORTS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Tabs variant="chips" tabs={tabs} value={filters.specialty} onChange={(value) => setFilters({ specialty: value })} label="Specialties" className="mt-space-md flex-nowrap pb-1 md:flex-wrap" />
        </div>
      </PageHero>

      <Container as="section" className="pb-space-xl pt-space-lg" aria-busy={isLoading}>
        <div className="mb-space-md flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface" aria-live="polite">
              {activeSpecialty ? activeSpecialty.name : 'All Aesthetic Treatments'}
              {data ? <span className="font-body-md text-body-md text-on-surface-variant"> · {data.total}</span> : null}
            </h2>
            {activeSpecialty && <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">{activeSpecialty.description}</p>}
          </div>
        </div>
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !isLoading && data?.items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No treatments found"
            description="Try a different keyword or browse all specialties."
            action={
              <Button
                onClick={() => {
                  setKeyword('');
                  setFilters({ q: '', specialty: 'all' });
                }}
              >
                Show all treatments
              </Button>
            }
          />
        ) : (
          <div className={cn('grid grid-cols-1 gap-space-lg transition-opacity md:grid-cols-2 lg:grid-cols-3', isLoading && data && 'opacity-60')}>
            {isLoading && !data
              ? Array.from({ length: 6 }, (_, index) => <TreatmentCardSkeleton key={index} />)
              : data.items.map((treatment) => <TreatmentCard key={treatment.id} treatment={treatment} specialtyName={specialtyName(treatment.specialtyId)} />)}
          </div>
        )}
        {data && (
          <Pagination
            className="mt-space-xl"
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            onChange={(page) => {
              setFilters({ page: String(page) });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            itemLabel="treatments"
          />
        )}
      </Container>
    </div>
  );
}
