import { ArrowRight, BadgeCheck, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RatingValue } from '@/components/common/Rating';
import { Skeleton, SkeletonText } from '@/components/common/Skeleton';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { dayOfWeek, WEEKDAYS } from '@/utils/date';
import { formatNumber, formatSlot } from '@/utils/format';
import { FavoriteButton } from './FavoriteButton';

const BADGE_TONE = { gold: 'goldSolid', rose: 'rose', blush: 'blush', glass: 'glass' };

export function nextAvailableLabel(next) {
  if (!next) return 'Next: Call to book';
  const day = next.dayOffset === 0 ? 'Today' : next.dayOffset === 1 ? 'Tomorrow' : WEEKDAYS[dayOfWeek(next.dateKey)].slice(0, 3);
  return `Next: ${day}, ${formatSlot(next.slot).replace(/^0/, '')}`;
}

const licenseShort = (license) => `MOH #${license.replace(/^MOH-/, '').split('-')[0]}`;

/**
 * Discovery clinic card — Stitch "Main Luxury Clinic Cards Grid" article:
 * imagery with MOH badge, heart, rating and highlight badge; district, team
 * size, signature procedures, next slot, starting price, View Profile / Book.
 */
export function ClinicCard({ clinic }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-low shadow-sm transition-all duration-300 hover:bg-surface-container hover:shadow-xl">
      <div className="relative h-64 w-full overflow-hidden bg-surface-container-highest">
        <img
          src={clinic.coverImage}
          alt={`${clinic.name} interior in ${clinic.districtLabel}`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-black/20" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="rounded-full bg-surface/90 px-2.5 py-1 font-label-sm text-label-sm font-bold text-primary shadow-sm backdrop-blur-md">
            {licenseShort(clinic.licenseNumber)}
          </span>
          <FavoriteButton clinicId={clinic.id} clinicName={clinic.name} />
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 text-on-primary">
          <RatingValue value={clinic.rating} count={clinic.reviewCount} countLabel="reviews" light />
          {clinic.highlightBadge && (
            <Badge tone={BADGE_TONE[clinic.highlightBadge.tone] ?? 'goldSolid'} shape="tag" uppercase className="font-bold">
              {clinic.highlightBadge.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-space-md">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2 font-label-sm text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 text-secondary" aria-hidden="true" />
              {clinic.districtLabel}
            </span>
            <span>
              {clinic.teamSize} {clinic.teamLabel}
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">
            <Link to={ROUTES.clinic(clinic.id)} className="focus-visible:outline-none">
              {clinic.name}
            </Link>
          </h3>
          <div className="mt-space-xs flex flex-wrap gap-1.5">
            {clinic.signatureTreatments.map((item) => (
              <span key={item} className="rounded-full bg-surface px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-space-md pt-space-xs">
          <div className="flex items-center justify-between gap-2 pb-2">
            <span className="flex items-center gap-1 font-label-md text-label-md text-secondary">
              <Clock className="size-4" aria-hidden="true" />
              {nextAvailableLabel(clinic.nextAvailable)}
            </span>
            <span className="text-on-surface-variant">
              <span className="font-label-sm text-label-sm">Starts at </span>
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">{formatNumber(clinic.startingPrice)}</span>
              <span className="font-label-sm text-label-sm"> SAR</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-space-xs pt-2">
            <Button to={ROUTES.clinic(clinic.id)} variant="tonal" className="hover:bg-surface-dim">
              View Profile
            </Button>
            <Button to={`${ROUTES.booking.root}?clinic=${clinic.id}`} variant="primary" rightIcon={ArrowRight} className="shadow-none hover:bg-primary-container">
              Book
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Homepage "Premier Medical Aesthetic Centers" card (white card, MOH badge
 * bottom-left on the image, tag chips, "Consultation from", View Clinic).
 */
export function FeaturedClinicCard({ clinic }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-md transition-all duration-300 hover:shadow-xl">
      <div className="relative h-60 w-full overflow-hidden">
        <img
          src={clinic.featuredImage ?? clinic.coverImage}
          alt={`${clinic.name} reception lounge`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <FavoriteButton clinicId={clinic.id} clinicName={clinic.name} className="absolute right-4 top-4 text-on-surface" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-on-background/70 px-3 py-1 font-label-sm text-label-sm text-surface backdrop-blur-md">
          <BadgeCheck className="size-3.5 text-secondary-fixed" aria-hidden="true" />
          MOH Licensed #{clinic.licenseNumber.replace(/^MOH-/, '')}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between space-y-space-sm p-space-md">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">{clinic.districtLabel}</span>
            <RatingValue value={clinic.rating} count={clinic.reviewCount} size="lg" />
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{clinic.name}</h3>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{clinic.shortDescription}</p>
          <div className="mt-space-sm flex flex-wrap gap-1.5">
            {[...clinic.tags, `${clinic.teamSize} Board Doctors`].map((tag) => (
              <span key={tag} className="rounded-md bg-surface-container px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-space-sm">
          <div>
            <span className="block font-label-sm text-label-sm text-on-surface-variant">Consultation from</span>
            <span className="font-title-lg text-title-lg text-primary">{formatNumber(clinic.startingPrice)} SAR</span>
          </div>
          <Button to={ROUTES.clinic(clinic.id)} variant="tonal" size="sm" className="hover:bg-primary hover:text-on-primary">
            View Clinic
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ClinicCardSkeleton({ className }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl bg-surface-container-low shadow-sm', className)} aria-hidden="true">
      <Skeleton className="h-64 w-full rounded-none" />
      <div className="space-y-3 p-space-md">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-6 w-3/4" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <SkeletonText lines={1} />
        <div className="grid grid-cols-2 gap-space-xs pt-2">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
      </div>
    </div>
  );
}
