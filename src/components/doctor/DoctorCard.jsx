import { Link } from 'react-router';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { RatingValue } from '@/components/common/Rating';
import { Skeleton, SkeletonText } from '@/components/common/Skeleton';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { formatNumber, getInitials } from '@/utils/format';

/** Square portrait, or an initials panel for specialists without a photo. */
function Portrait({ doctor }) {
  if (doctor.photo) {
    return (
      <img
        src={doctor.photo}
        alt={`${doctor.name}, ${doctor.title}`}
        loading="lazy"
        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }
  return (
    <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary-fixed via-surface-container to-secondary-fixed/60">
      <span className="font-display-md text-display-md text-primary/70" aria-hidden="true">
        {getInitials(doctor.name)}
      </span>
    </div>
  );
}

/**
 * Specialist card — Stitch clinic profile "Resident Aesthetic Consultants":
 * square portrait, lead badge, Playfair name, plum title, bio, language tags,
 * consultation fee and a primary action ("Select Specialist" / "View Profile").
 */
export function DoctorCard({ doctor, action, showClinic = false, selected = false, className }) {
  return (
    <div
      className={cn(
        'group flex flex-col justify-between rounded-xl bg-surface-container-low p-5 transition-all hover:shadow-md',
        selected && 'ring-2 ring-primary',
        className,
      )}
    >
      <div className="space-y-4">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-surface-container">
          <Portrait doctor={doctor} />
          {doctor.badges?.[0] && (
            <Badge tone="goldSolid" className="absolute right-2 top-2 font-bold">
              {doctor.badges[0]}
            </Badge>
          )}
        </div>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            <Link to={ROUTES.doctor(doctor.id)} className="hover:text-primary">
              {doctor.name}
            </Link>
          </h3>
          <p className="font-label-md text-label-md font-semibold text-primary">{doctor.title}</p>
          {showClinic && doctor.clinic && (
            <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
              {doctor.clinic.name} • {doctor.clinic.districtLabel}
            </p>
          )}
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{doctor.bio}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 font-label-sm text-[11px] text-on-surface-variant">
          {doctor.tags?.map((tag) => (
            <span key={tag} className="rounded bg-surface px-2 py-0.5">
              {tag}
            </span>
          ))}
          {doctor.rating > 0 && <RatingValue value={doctor.rating} count={doctor.reviewCount} size="sm" />}
        </div>
      </div>
      <div className="mt-6 space-y-3 pt-4">
        <div className="flex items-center justify-between font-body-sm text-body-sm">
          <span className="text-on-surface-variant">Consultation Fee</span>
          <span className="font-title-md text-title-md text-on-surface">{formatNumber(doctor.consultationFee)} SAR</span>
        </div>
        {action}
      </div>
    </div>
  );
}

/** Compact specialist row (booking summary, dashboards). */
export function DoctorMiniCard({ doctor, className, right }) {
  return (
    <div className={cn('flex items-center gap-space-md rounded-xl bg-surface-container p-space-sm', className)}>
      <Avatar src={doctor.headshot ?? doctor.photo} name={doctor.name} size="xl" ring />
      <div className="min-w-0 flex-1">
        <p className="truncate font-title-lg text-title-lg text-on-surface">{doctor.name}</p>
        <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{doctor.headline ?? doctor.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {doctor.badges?.[1] && <Badge tone="rose">{doctor.badges[1]}</Badge>}
          {doctor.rating > 0 && (
            <span className="font-label-sm text-label-sm font-semibold text-secondary">
              ★ {doctor.rating} ({formatNumber(doctor.reviewCount)}+ Reviews)
            </span>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

export function DoctorCardSkeleton() {
  return (
    <div className="space-y-4 rounded-xl bg-surface-container-low p-5" aria-hidden="true">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <SkeletonText lines={2} />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
