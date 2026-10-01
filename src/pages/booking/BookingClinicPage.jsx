import { useState } from 'react';
import { ArrowRight, Check, Clock, MapPin, Search, SearchX } from 'lucide-react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router';
import { BookingSummary } from '@/components/appointment/BookingSummary';
import { BookingWorkspace } from '@/components/appointment/BookingWorkspace';
import { Button } from '@/components/common/Button';
import { SelectInput } from '@/components/common/Form';
import { RatingValue } from '@/components/common/Rating';
import { RowSkeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { nextAvailableLabel } from '@/components/clinic/ClinicCard';
import { ALL_DISTRICTS, DISTRICTS } from '@/constants/districts';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { searchClinics } from '@/services/clinicService';
import { useBookingStore } from '@/store/bookingStore';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';

/** Step 1 — choose a verified clinic (optionally filtered to one treatment). */
export default function BookingClinicPage() {
  useDocumentTitle('Book · Choose Clinic');
  const { booking, clinic, clinicLoading } = useOutletContext();
  const selectClinic = useBookingStore((state) => state.selectClinic);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const treatment = params.get('treatment') ?? '';
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState(ALL_DISTRICTS);
  const debounced = useDebouncedValue(query, 300);
  const { data, isLoading, error, reload } = useAsync(
    () => searchClinics({ q: debounced, district, treatment, pageSize: 50 }),
    [debounced, district, treatment],
    { keepPreviousData: true },
  );

  const next = () => navigate(`${ROUTES.booking.service}${treatment ? `?treatment=${treatment}` : ''}`);
  const choose = (clinicId) => {
    selectClinic(clinicId);
    next();
  };

  return (
    <BookingWorkspace
      overline="Step 01 · Choose Clinic"
      title="Select Your Aesthetic Sanctuary"
      description={treatment ? 'Showing verified clinics that offer your selected treatment.' : 'Every clinic is MOH-licensed and reviewed by our verification committee.'}
      aside={
        <BookingSummary clinic={clinic} loading={clinicLoading}>
          <Button fullWidth size="lg" rightIcon={ArrowRight} disabled={!booking.clinicId} onClick={next} className="py-4">
            Continue to Treatment
          </Button>
        </BookingSummary>
      }
    >
      <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 size-5 text-primary" aria-hidden="true" />
          <label htmlFor="booking-clinic-search" className="sr-only">
            Search clinics
          </label>
          <input
            id="booking-clinic-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clinic or treatment…"
            className="w-full rounded-lg bg-surface-container-low py-3 pl-11 pr-4 font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <SelectInput aria-label="District" leftIcon={MapPin} value={district} onChange={(event) => setDistrict(event.target.value)}>
          <option value={ALL_DISTRICTS}>All Riyadh Districts</option>
          {DISTRICTS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </SelectInput>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading && !data ? (
        <div className="space-y-space-sm">
          {Array.from({ length: 4 }, (_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState icon={SearchX} title="No clinics found" description="Try another district or search term." />
      ) : (
        <ul className={cn('space-y-space-sm transition-opacity', isLoading && 'opacity-60')} role="radiogroup" aria-label="Clinics">
          {data.items.map((item) => {
            const selected = item.id === booking.clinicId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(item.id)}
                  className={cn(
                    'flex w-full items-center gap-space-md rounded-xl bg-surface-container-low p-space-sm text-left transition-all hover:bg-surface-container sm:p-space-md',
                    selected && 'bg-surface-container ring-2 ring-primary',
                  )}
                >
                  <img src={item.coverImage} alt="" className="size-20 shrink-0 rounded-lg object-cover sm:size-24" />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-headline-sm text-[19px] leading-6 text-on-surface">{item.name}</span>
                      <RatingValue value={item.rating} count={item.reviewCount} size="sm" />
                    </span>
                    <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                      <MapPin className="size-3.5 text-secondary" aria-hidden="true" />
                      {item.districtLabel}
                    </span>
                    <span className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="flex items-center gap-1 font-label-md text-label-md text-secondary">
                        <Clock className="size-4" aria-hidden="true" />
                        {nextAvailableLabel(item.nextAvailable)}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Starts at <span className="font-title-md text-title-md text-on-surface">{formatNumber(item.startingPrice)}</span> SAR
                      </span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      'hidden size-9 shrink-0 items-center justify-center rounded-full sm:flex',
                      selected ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant',
                    )}
                    aria-hidden="true"
                  >
                    {selected ? <Check className="size-5" /> : <ArrowRight className="size-5" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </BookingWorkspace>
  );
}
