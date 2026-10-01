import { ArrowRight, BadgeCheck, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RatingValue } from '@/components/common/Rating';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { formatPriceRange } from '@/utils/format';

function Highlights({ offer, cheapestId, topRatedId }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {offer.id === cheapestId && <Badge tone="gold">Best Value</Badge>}
      {offer.id === topRatedId && <Badge tone="rose">Highest Rated</Badge>}
      {offer.clinic.features.instantConfirmation && <Badge tone="neutral">Instant Confirmation</Badge>}
    </div>
  );
}

/**
 * Clinic price matrix for one treatment (requirements: "Compare clinics
 * based on Price, Ratings, Services"). DESIGN.md "Pricing & Tier Matrices":
 * clean divider rows, the recommended option framed in champagne.
 * Table on desktop, cards on mobile.
 */
export function PriceComparison({ offers, treatmentName }) {
  if (!offers.length) return null;
  const cheapestId = offers[0]?.id;
  const topRatedId = [...offers].sort((a, b) => b.clinic.rating - a.clinic.rating)[0]?.id;
  const bookHref = (offer) => `${ROUTES.booking.root}?clinic=${offer.clinicId}&service=${offer.id}`;

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm md:block">
        <table className="w-full text-left">
          <caption className="sr-only">Price comparison for {treatmentName} across verified clinics</caption>
          <thead className="bg-surface-container-low">
            <tr className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              <th scope="col" className="px-5 py-3">Clinic</th>
              <th scope="col" className="px-5 py-3">Clinic protocol</th>
              <th scope="col" className="px-5 py-3">Specialists</th>
              <th scope="col" className="px-5 py-3 text-right">Price (VAT incl.)</th>
              <th scope="col" className="px-5 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {offers.map((offer) => (
              <tr key={offer.id} className={cn('align-middle transition-colors hover:bg-surface-container-low', offer.id === topRatedId && 'bg-secondary-fixed/10')}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img src={offer.clinic.coverImage} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <Link to={ROUTES.clinic(offer.clinicId)} className="font-title-md text-title-md text-on-surface hover:text-primary">
                        {offer.clinic.name}
                      </Link>
                      <p className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                        <MapPin className="size-3.5 text-secondary" aria-hidden="true" />
                        {offer.clinic.districtLabel}
                      </p>
                      <RatingValue value={offer.clinic.rating} count={offer.clinic.reviewCount} size="sm" />
                    </div>
                  </div>
                </td>
                <td className="max-w-xs px-5 py-4">
                  <p className="font-body-sm text-body-sm font-semibold text-on-surface">{offer.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                    <Clock className="size-3.5 text-primary" aria-hidden="true" />
                    {offer.durationMinutes} mins • {offer.priceNote}
                  </p>
                  <div className="mt-1.5">
                    <Highlights offer={offer} cheapestId={cheapestId} topRatedId={topRatedId} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex -space-x-2">
                    {offer.doctors.slice(0, 3).map((doctor) => (
                      <Avatar key={doctor.id} src={doctor.headshot} name={doctor.name} size="sm" className="ring-2 ring-surface-container-lowest" />
                    ))}
                  </div>
                  <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">{offer.doctors.length} performing</p>
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="font-headline-sm text-headline-sm font-bold text-primary">{formatPriceRange(offer.priceMin, offer.priceMax)}</span>
                </td>
                <td className="px-5 py-4">
                  <Button to={bookHref(offer)} size="sm" rightIcon={ArrowRight} className="shadow-none">
                    Book
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-space-sm md:hidden">
        {offers.map((offer) => (
          <li
            key={offer.id}
            className={cn('space-y-3 rounded-xl bg-surface-container-lowest p-space-sm shadow-sm', offer.id === topRatedId && 'ring-1 ring-brand-champagne')}
          >
            <div className="flex items-center gap-3">
              <img src={offer.clinic.coverImage} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <Link to={ROUTES.clinic(offer.clinicId)} className="font-title-md text-title-md text-on-surface">
                  {offer.clinic.name}
                </Link>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{offer.clinic.districtLabel}</p>
              </div>
              <BadgeCheck className="size-5 text-secondary" aria-label="MOH verified" />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface">{offer.title}</p>
            <Highlights offer={offer} cheapestId={cheapestId} topRatedId={topRatedId} />
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-headline-sm text-headline-sm font-bold text-primary">{formatPriceRange(offer.priceMin, offer.priceMax)}</span>
                <span className="block font-label-sm text-label-sm text-on-surface-variant">{offer.durationMinutes} mins • VAT incl.</span>
              </div>
              <Button to={bookHref(offer)} size="sm" rightIcon={ArrowRight} className="shadow-none">
                Book
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
