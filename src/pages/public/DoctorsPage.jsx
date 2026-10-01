import { useEffect, useState } from 'react';
import { Search, UserSearch } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Layout';
import { Pagination } from '@/components/common/Navigation';
import { PageHero } from '@/components/common/PageHero';
import { EmptyState, ErrorState } from '@/components/common/States';
import { DoctorCard, DoctorCardSkeleton } from '@/components/doctor/DoctorCard';
import { PAGE_SIZE } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQueryState } from '@/hooks/useQueryState';
import { getDoctors, getSpecializations } from '@/services/doctorService';
import { cn } from '@/utils/cn';

const selectClass =
  'w-full cursor-pointer appearance-none rounded-lg bg-surface-container-low px-3 py-2.5 font-label-md text-label-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20';

export default function DoctorsPage() {
  useDocumentTitle('Specialists');
  const [filters, setFilters, resetFilters] = useQueryState({ q: '', specialization: 'all', gender: 'all', language: 'all', sort: 'rating', page: '1' });
  const [keyword, setKeyword] = useState(filters.q);
  const debounced = useDebouncedValue(keyword, 300);

  useEffect(() => {
    if (debounced !== filters.q) setFilters({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data: specializations = [] } = useAsync(getSpecializations, []);
  const { data, isLoading, error, reload } = useAsync(
    () => getDoctors({ ...filters, page: Number(filters.page), pageSize: PAGE_SIZE.doctors }),
    [filters],
    { keepPreviousData: true },
  );

  const selects = [
    { id: 'specialization', label: 'Specialization', options: [['all', 'All specializations'], ...specializations.map((item) => [item, item])] },
    { id: 'gender', label: 'Specialist', options: [['all', 'Any specialist'], ['female', 'Female specialists'], ['male', 'Male specialists']] },
    { id: 'language', label: 'Language', options: [['all', 'Any language'], ['ar', 'Arabic'], ['en', 'English'], ['fr', 'French']] },
    { id: 'sort', label: 'Sort', options: [['rating', 'Highest rated'], ['experience', 'Most experienced'], ['fee', 'Consultation fee'], ['name', 'Name A–Z']] },
  ];

  return (
    <div className="flex w-full flex-col">
      <PageHero
        pill="SCFHS Registered Practitioners"
        title="Board-Certified Aesthetic Specialists"
        description="Consultant dermatologists, facial plastic surgeons and laser specialists practising at Riyadh’s verified clinics — with credentials, languages and consultation fees up front."
      >
        <div className="mt-space-lg rounded-xl bg-surface p-space-md shadow-md">
          <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2 lg:grid-cols-12">
            <div className="flex items-center gap-space-xs rounded-lg bg-surface-container-low px-space-sm py-2.5 focus-within:bg-surface-container lg:col-span-4">
              <Search className="ml-1 size-5 text-primary" aria-hidden="true" />
              <label htmlFor="doctor-search" className="sr-only">
                Search specialists
              </label>
              <input
                id="doctor-search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search by name or expertise…"
                className="w-full border-0 bg-transparent p-0 font-title-md text-title-md text-on-surface outline-none placeholder:text-outline"
              />
            </div>
            {selects.map((select) => (
              <div key={select.id} className="lg:col-span-2">
                <label htmlFor={`doctor-${select.id}`} className="sr-only">
                  {select.label}
                </label>
                <select id={`doctor-${select.id}`} value={filters[select.id]} onChange={(event) => setFilters({ [select.id]: event.target.value })} className={selectClass}>
                  {select.options.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </PageHero>

      <Container as="section" className="pb-space-xl pt-space-lg" aria-busy={isLoading}>
        <h2 className="mb-space-md font-headline-sm text-headline-sm text-on-surface" aria-live="polite">
          {data ? `${data.total} Verified Specialists in Riyadh` : 'Finding specialists…'}
        </h2>
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !isLoading && data?.items.length === 0 ? (
          <EmptyState
            icon={UserSearch}
            title="No specialists match these filters"
            description="Try another specialization or language."
            action={
              <Button
                onClick={() => {
                  setKeyword('');
                  resetFilters();
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className={cn('grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3', isLoading && data && 'opacity-60')}>
            {isLoading && !data
              ? Array.from({ length: 6 }, (_, index) => <DoctorCardSkeleton key={index} />)
              : data.items.map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    showClinic
                    action={
                      <div className="grid grid-cols-2 gap-2">
                        <Button to={ROUTES.doctor(doctor.id)} variant="soft" size="sm" className="py-2.5">
                          View Profile
                        </Button>
                        <Button to={`${ROUTES.booking.root}?clinic=${doctor.primaryClinicId}&doctor=${doctor.id}`} size="sm" className="py-2.5 shadow-none">
                          Book
                        </Button>
                      </div>
                    }
                  />
                ))}
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
            itemLabel="specialists"
          />
        )}
      </Container>
    </div>
  );
}
