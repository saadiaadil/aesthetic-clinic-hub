import { ArrowRight, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton, SkeletonText } from '@/components/common/Skeleton';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { formatNumber, pluralize } from '@/utils/format';

/**
 * Homepage "Curated Aesthetic Specialties" editorial tile (image 16:11,
 * "01 • Facial Contouring", verified clinic count, "From 850 SAR · Explore").
 */
export function SpecialtyTile({ specialty }) {
  return (
    <Link
      to={`${ROUTES.treatments}?specialty=${specialty.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-surface-container-low shadow-sm transition-all duration-500 hover:shadow-xl"
    >
      <div className="aspect-[16/11] w-full overflow-hidden">
        <img src={specialty.image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="space-y-2 p-space-md">
        <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
          <span className="uppercase text-secondary">
            {specialty.index} • {specialty.overline}
          </span>
          <span>{pluralize(specialty.clinicCount ?? 0, 'Verified Clinic')}</span>
        </div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">{specialty.name}</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{specialty.description}</p>
        <div className="flex items-center justify-between pt-2 font-label-md text-label-md">
          <span className="font-bold text-primary">{specialty.priceFrom ? `From ${formatNumber(specialty.priceFrom)} SAR` : 'Pricing on request'}</span>
          <span className="inline-flex items-center gap-1 text-on-surface-variant transition-transform group-hover:translate-x-1">
            Explore <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Treatment listing card (Treatments page) — same editorial language as the specialty tiles. */
export function TreatmentCard({ treatment, specialtyName }) {
  return (
    <Link
      to={ROUTES.treatment(treatment.id)}
      className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-low shadow-sm transition-all duration-500 hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img src={treatment.image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
        {treatment.popular && (
          <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary backdrop-blur-md">
            Most Requested
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-space-md">
        <div className="flex items-center justify-between gap-2 font-label-sm text-label-sm">
          <span className="uppercase text-secondary">{specialtyName}</span>
          <span className="text-on-surface-variant">{pluralize(treatment.clinicCount, 'Clinic')}</span>
        </div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">{treatment.name}</h3>
        <p className="flex-1 font-body-sm text-body-sm text-on-surface-variant">{treatment.shortDescription}</p>
        <div className="flex flex-wrap items-center gap-4 pt-1 font-label-sm text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Clock className="size-[15px] text-primary" aria-hidden="true" />
            {treatment.durationMinutes} mins
          </span>
          <span className="flex items-center gap-1">
            <Zap className="size-[15px] text-primary" aria-hidden="true" />
            {treatment.downtime}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 font-label-md text-label-md">
          <span className={cn('font-bold', treatment.priceFrom ? 'text-primary' : 'text-on-surface-variant')}>
            {treatment.priceFrom ? `From ${formatNumber(treatment.priceFrom)} SAR` : 'Not currently offered'}
          </span>
          <span className="inline-flex items-center gap-1 text-on-surface-variant transition-transform group-hover:translate-x-1">
            Compare clinics <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function TreatmentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface-container-low shadow-sm" aria-hidden="true">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-space-md">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
        <SkeletonText lines={2} />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
