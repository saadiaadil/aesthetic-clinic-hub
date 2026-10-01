import { Check, ChevronDown, MapPin } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Popover } from '@/components/common/Popover';
import { ALL_DISTRICTS, DISTRICTS, getDistrictName } from '@/constants/districts';
import { ROUTES } from '@/constants/routes';
import { useDisclosure } from '@/hooks/useDisclosure';
import { usePreferencesStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

/**
 * Header location pill ("Riyadh • Al Olaya"). Stores the preferred district,
 * which discovery uses as its default filter; on the clinics page it
 * updates the active filter directly.
 */
export function DistrictPicker({ className }) {
  const { isOpen, toggle, close } = useDisclosure();
  const district = usePreferencesStore((state) => state.district);
  const setDistrict = usePreferencesStore((state) => state.setDistrict);
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const choose = (id) => {
    setDistrict(id);
    close();
    if (location.pathname === ROUTES.clinics) {
      const next = new URLSearchParams(params);
      if (id === ALL_DISTRICTS) next.delete('district');
      else next.set('district', id);
      next.delete('page');
      navigate({ search: next.toString() }, { replace: true });
    }
  };

  const label = district === ALL_DISTRICTS ? 'All Districts' : getDistrictName(district);

  return (
    <Popover
      isOpen={isOpen}
      onClose={close}
      align="left"
      className={className}
      panelClassName="w-64"
      trigger={
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex items-center gap-space-xs rounded-full bg-secondary-fixed/40 px-space-sm py-1.5 font-label-md text-label-md text-on-secondary-fixed-variant transition-colors hover:bg-secondary-fixed/60"
        >
          <MapPin className="size-4 text-secondary" aria-hidden="true" />
          <span>Riyadh • {label}</span>
          <ChevronDown className={cn('size-4 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
        </button>
      }
    >
      <p className="px-3 py-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Your Riyadh district</p>
      <ul role="listbox" aria-label="Riyadh district" className="space-y-0.5">
        {[{ id: ALL_DISTRICTS, label: 'All Districts' }, ...DISTRICTS].map((item) => {
          const selected = item.id === district;
          return (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(item.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-body-sm text-body-sm transition-colors hover:bg-surface-container',
                  selected ? 'font-semibold text-primary' : 'text-on-surface',
                )}
              >
                {item.label}
                {selected && <Check className="size-4" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Popover>
  );
}
