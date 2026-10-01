import { useState } from 'react';
import { Compass, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router';
import { images } from '@/assets/images';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { formatNumber, formatRating } from '@/utils/format';

// Approximate geographic bounds of the Stitch static map of central Riyadh.
const BOUNDS = { north: 24.84, south: 24.6, west: 46.55, east: 46.8 };

function toPosition({ latitude, longitude }) {
  const x = ((longitude - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 100;
  const y = ((BOUNDS.north - latitude) / (BOUNDS.north - BOUNDS.south)) * 100;
  return { left: `${Math.min(94, Math.max(6, x))}%`, top: `${Math.min(92, Math.max(8, y))}%` };
}

/**
 * Stitch "Interactive Medical Hubs Across Riyadh" map view. Pins are placed
 * from clinic latitude/longitude on the static map; a real map provider can
 * replace the background in Phase 5 without changing the component API.
 */
export function ClinicMap({ clinics }) {
  const [activeId, setActiveId] = useState(clinics[0]?.id ?? null);
  const active = clinics.find((clinic) => clinic.id === activeId);

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-surface-container shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-high p-space-md">
        <div className="flex items-center gap-space-xs">
          <Compass className="size-5 text-primary" aria-hidden="true" />
          <span className="font-title-md text-title-md text-on-surface">Interactive Medical Hubs Across Riyadh</span>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">Select a pin to preview the clinic</span>
      </div>
      <div className="relative h-[26rem] w-full bg-cover bg-center" style={{ backgroundImage: `url(${images.misc.riyadhMap})` }}>
        {clinics.map((clinic) => {
          const selected = clinic.id === activeId;
          return (
            <button
              key={clinic.id}
              type="button"
              onClick={() => setActiveId(clinic.id)}
              aria-pressed={selected}
              aria-label={`${clinic.name}, ${clinic.districtLabel}`}
              style={toPosition(clinic)}
              className="group absolute -translate-x-1/2 -translate-y-full"
            >
              <span
                className={cn(
                  'flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 font-label-sm text-label-sm shadow-lg transition-all',
                  selected ? 'scale-110 bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface group-hover:bg-primary-fixed',
                )}
              >
                <MapPin className="size-3.5" aria-hidden="true" />
                {formatNumber(clinic.startingPrice)} SAR
              </span>
            </button>
          );
        })}
        {active && (
          <Link
            to={ROUTES.clinic(active.id)}
            className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-surface/95 p-3 shadow-md backdrop-blur-md transition-colors hover:bg-surface sm:right-auto sm:w-96"
          >
            <img src={active.coverImage} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
            <span className="min-w-0">
              <span className="block truncate font-title-md text-title-md text-on-surface">{active.name}</span>
              <span className="block truncate font-body-sm text-body-sm text-on-surface-variant">{active.address}</span>
              <span className="mt-0.5 flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                <Star className="size-3.5 fill-current" aria-hidden="true" />
                {formatRating(active.rating)} • From {formatNumber(active.startingPrice)} SAR
              </span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
