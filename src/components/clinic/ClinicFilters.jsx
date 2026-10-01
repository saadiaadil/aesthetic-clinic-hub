import { useEffect, useState } from 'react';
import { Banknote, MapPin, Search, SlidersHorizontal, Star } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { SelectInput, Switch } from '@/components/common/Form';
import { FilterChip } from '@/components/common/Navigation';
import { Drawer } from '@/components/common/Overlay';
import { ALL_DISTRICTS, DISTRICTS } from '@/constants/districts';
import { CLINIC_FEATURE_FILTERS } from '@/data/clinics';
import { PRICE_RANGES, RATING_OPTIONS } from '@/data/content';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDisclosure } from '@/hooks/useDisclosure';
import { parseList, toggleInList } from '@/hooks/useQueryState';
import { cn } from '@/utils/cn';

const tile = 'flex items-center gap-space-xs rounded-lg bg-surface-container-low px-space-sm py-2 transition-all focus-within:bg-surface-container';
const bareSelect = 'w-full cursor-pointer appearance-none border-0 bg-transparent p-0 font-title-md text-title-md text-on-surface outline-none';

function FeatureChips({ filters, onChange, className }) {
  const active = parseList(filters.features);
  return (
    <div className={cn('flex flex-wrap items-center gap-space-xs', className)}>
      {CLINIC_FEATURE_FILTERS.map((feature) => (
        <FilterChip
          key={feature.id}
          active={active.includes(feature.id)}
          onClick={() => onChange({ features: toggleInList(filters.features, feature.id) })}
          iconNode={<DynamicIcon name={feature.icon} className="size-[15px]" />}
        >
          {feature.label}
        </FilterChip>
      ))}
    </div>
  );
}

/**
 * Stitch "Unified Luxury Search & Filter Engine" (desktop) with a filter
 * sheet on mobile. Keyword search is debounced; every control writes to the
 * URL through `onChange`.
 */
export function ClinicFilters({ filters, onChange, resultCount }) {
  const [keyword, setKeyword] = useState(filters.q);
  const debouncedKeyword = useDebouncedValue(keyword, 350);
  const sheet = useDisclosure();

  useEffect(() => {
    if (debouncedKeyword !== filters.q) onChange({ q: debouncedKeyword });
    // Only react to the user's typing, not to external filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  const activeCount =
    parseList(filters.features).length +
    (filters.district !== ALL_DISTRICTS ? 1 : 0) +
    (filters.price !== 'all' ? 1 : 0) +
    (filters.rating !== 'any' ? 1 : 0) +
    (filters.instant === '1' ? 1 : 0);

  const submit = (event) => {
    event.preventDefault();
    onChange({ q: keyword.trim() });
    document.getElementById('clinic-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const districtSelect = (id, variant) => (
    <select
      id={id}
      value={filters.district}
      onChange={(event) => onChange({ district: event.target.value })}
      className={variant === 'bare' ? bareSelect : undefined}
    >
      <option value={ALL_DISTRICTS}>All Riyadh Prime Districts</option>
      {DISTRICTS.map((district) => (
        <option key={district.id} value={district.id}>
          {district.label}
        </option>
      ))}
    </select>
  );

  return (
    <div id="filters" className="mt-space-lg scroll-mt-28 rounded-xl bg-surface p-space-md shadow-md">
      {/* Desktop engine */}
      <form onSubmit={submit} className="hidden grid-cols-12 gap-space-sm md:grid" role="search" aria-label="Filter clinics">
        <div className={cn(tile, 'col-span-12 lg:col-span-4')}>
          <Search className="ml-2 size-[22px] text-primary" aria-hidden="true" />
          <div className="flex w-full flex-col pr-2">
            <label htmlFor="clinic-keyword" className="font-label-sm text-label-sm uppercase text-on-surface-variant">
              Treatment or Clinic
            </label>
            <input
              id="clinic-keyword"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="e.g. Profhilo, Morpheus8, DermaArt…"
              className="w-full border-0 bg-transparent p-0 font-title-md text-title-md text-on-surface outline-none placeholder:text-outline"
            />
          </div>
        </div>
        <div className={cn(tile, 'col-span-6 lg:col-span-3')}>
          <MapPin className="size-[22px] text-secondary" aria-hidden="true" />
          <div className="flex w-full flex-col">
            <label htmlFor="clinic-district" className="font-label-sm text-label-sm uppercase text-on-surface-variant">
              Riyadh District
            </label>
            {districtSelect('clinic-district', 'bare')}
          </div>
        </div>
        <div className={cn(tile, 'col-span-6 lg:col-span-3')}>
          <Banknote className="size-[22px] text-outline" aria-hidden="true" />
          <div className="flex w-full flex-col">
            <label htmlFor="clinic-price" className="font-label-sm text-label-sm uppercase text-on-surface-variant">
              Price Range (SAR)
            </label>
            <div className="flex items-center justify-between gap-2">
              <select id="clinic-price" value={filters.price} onChange={(event) => onChange({ price: event.target.value })} className={bareSelect}>
                {PRICE_RANGES.map((range) => (
                  <option key={range.id} value={range.id}>
                    {range.label}
                  </option>
                ))}
              </select>
              <label htmlFor="clinic-rating" className="sr-only">
                Minimum rating
              </label>
              <select
                id="clinic-rating"
                value={filters.rating}
                onChange={(event) => onChange({ rating: event.target.value })}
                className="shrink-0 cursor-pointer appearance-none rounded bg-secondary-fixed px-1.5 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-fixed outline-none"
              >
                {RATING_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id === 'any' ? 'Any ★' : option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="col-span-12 flex items-center lg:col-span-2">
          <Button type="submit" rightIcon={SlidersHorizontal} fullWidth className="h-full min-h-[52px] shadow-sm hover:bg-primary-container">
            Filter Clinics
          </Button>
        </div>
      </form>

      {/* Mobile toolbar */}
      <form onSubmit={submit} className="flex items-center gap-2 md:hidden" role="search" aria-label="Search clinics">
        <div className={cn(tile, 'flex-1 py-2.5')}>
          <Search className="size-5 text-primary" aria-hidden="true" />
          <label htmlFor="clinic-keyword-mobile" className="sr-only">
            Treatment or clinic
          </label>
          <input
            id="clinic-keyword-mobile"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Treatment or clinic…"
            className="w-full border-0 bg-transparent p-0 font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
          />
        </div>
        <Button variant="primary" leftIcon={SlidersHorizontal} onClick={sheet.open} className="shrink-0 px-4 shadow-sm" aria-haspopup="dialog">
          Filters{activeCount ? ` (${activeCount})` : ''}
        </Button>
      </form>

      <div className="mt-space-md hidden flex-wrap items-center justify-between gap-space-sm pt-space-sm md:flex">
        <FeatureChips filters={filters} onChange={onChange} />
        <Switch
          label="Instant Confirmation Only"
          checked={filters.instant === '1'}
          onChange={(event) => onChange({ instant: event.target.checked ? '1' : '' })}
        />
      </div>

      <Drawer
        isOpen={sheet.isOpen}
        onClose={sheet.close}
        side="bottom"
        title="Filter Clinics"
        footer={
          <div className="flex gap-2">
            <Button
              variant="soft"
              onClick={() => onChange({ district: ALL_DISTRICTS, price: 'all', rating: 'any', features: '', instant: '' })}
              className="flex-1"
            >
              Clear
            </Button>
            <Button onClick={sheet.close} className="flex-[2]">
              Show {resultCount ?? ''} clinics
            </Button>
          </div>
        }
      >
        <div className="space-y-space-md p-space-md">
          <div className="space-y-1.5">
            <label htmlFor="sheet-district" className="font-label-md text-label-md uppercase tracking-wider text-on-surface">
              Riyadh District
            </label>
            <SelectInput id="sheet-district" leftIcon={MapPin} value={filters.district} onChange={(event) => onChange({ district: event.target.value })}>
              <option value={ALL_DISTRICTS}>All Riyadh Prime Districts</option>
              {DISTRICTS.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.label}
                </option>
              ))}
            </SelectInput>
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="space-y-1.5">
              <label htmlFor="sheet-price" className="font-label-md text-label-md uppercase tracking-wider text-on-surface">
                Price
              </label>
              <SelectInput id="sheet-price" value={filters.price} onChange={(event) => onChange({ price: event.target.value })}>
                {PRICE_RANGES.map((range) => (
                  <option key={range.id} value={range.id}>
                    {range.label}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sheet-rating" className="font-label-md text-label-md uppercase tracking-wider text-on-surface">
                Rating
              </label>
              <SelectInput id="sheet-rating" leftIcon={Star} value={filters.rating} onChange={(event) => onChange({ rating: event.target.value })}>
                {RATING_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-label-md text-label-md uppercase tracking-wider text-on-surface">Clinic Features</p>
            <FeatureChips filters={filters} onChange={onChange} />
          </div>
          <Switch
            label="Instant Confirmation Only"
            checked={filters.instant === '1'}
            onChange={(event) => onChange({ instant: event.target.checked ? '1' : '' })}
          />
        </div>
      </Drawer>
    </div>
  );
}
