import { useState } from 'react';
import { ArrowRight, Building2, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Modal } from '@/components/common/Overlay';
import { Spinner } from '@/components/common/States';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getSearchSuggestions } from '@/services/treatmentService';
import { pluralize } from '@/utils/format';

/** Header search: treatments and clinics autocomplete, Enter searches clinics. */
export function SearchDialog({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 200);
  const navigate = useNavigate();
  const { data, isLoading } = useAsync(() => (isOpen ? getSearchSuggestions(debounced) : Promise.resolve(null)), [debounced, isOpen], {
    keepPreviousData: true,
  });

  const go = (path) => {
    onClose();
    setQuery('');
    navigate(path);
  };

  const submit = (event) => {
    event.preventDefault();
    go(query.trim() ? `${ROUTES.clinics}?q=${encodeURIComponent(query.trim())}` : ROUTES.clinics);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Search Riyadh’s verified clinics"
      description="Find a treatment, a clinic or a district."
      className="sm:mt-[-10vh]"
    >
      <form onSubmit={submit} role="search" className="pt-2">
        <label htmlFor="global-search" className="font-label-md text-label-md uppercase tracking-wider text-on-surface">
          Treatment or Clinic
        </label>
        <div className="relative mt-2 flex items-center">
          <Search className="pointer-events-none absolute left-3.5 size-5 text-primary" aria-hidden="true" />
          <input
            id="global-search"
            data-autofocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
            placeholder="e.g. Morpheus8, Profhilo, Hydrafacial, DermaArt…"
            className="w-full rounded-lg bg-surface-container-low py-3.5 pl-11 pr-12 font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/25"
          />
          <span className="absolute right-3">{isLoading && <Spinner />}</span>
        </div>
      </form>

      <div className="mt-space-md space-y-space-md">
        <div>
          <p className="px-1 pb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            {query ? 'Treatments' : 'Top Verified Searches'}
          </p>
          {data?.treatments?.length ? (
            <ul className="space-y-1">
              {data.treatments.map((treatment) => (
                <li key={treatment.id}>
                  <button
                    type="button"
                    onClick={() => go(ROUTES.treatment(treatment.id))}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-container"
                  >
                    <span className="flex items-center gap-2.5 font-body-md text-body-md text-on-surface">
                      <Sparkles className="size-[18px] text-primary" aria-hidden="true" />
                      {treatment.name}
                    </span>
                    <span className="shrink-0 font-label-sm text-label-sm text-secondary">{pluralize(treatment.clinicCount, 'Clinic')}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && <p className="px-3 py-2 font-body-sm text-body-sm text-on-surface-variant">No treatments match “{query}”.</p>
          )}
        </div>

        {data?.clinics?.length > 0 && (
          <div>
            <p className="px-1 pb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Clinics</p>
            <ul className="space-y-1">
              {data.clinics.map((clinic) => (
                <li key={clinic.id}>
                  <button
                    type="button"
                    onClick={() => go(ROUTES.clinic(clinic.id))}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-container"
                  >
                    <span className="flex items-center gap-2.5 font-body-md text-body-md text-on-surface">
                      <Building2 className="size-[18px] text-secondary" aria-hidden="true" />
                      {clinic.name}
                    </span>
                    <span className="shrink-0 font-label-sm text-label-sm text-on-surface-variant">{clinic.districtLabel}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          className="flex w-full items-center justify-between rounded-lg bg-primary px-4 py-3 font-title-md text-title-md text-on-primary transition-colors hover:bg-tertiary"
        >
          {query ? `Search clinics for “${query}”` : 'Browse all verified clinics'}
          <ArrowRight className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    </Modal>
  );
}
