import { BadgeCheck } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { ProgressBar } from '@/components/dashboard/DashboardUI';
import { Stars } from '@/components/common/Rating';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/utils/cn';
import { formatRating, formatRelative } from '@/utils/format';

/** Homepage "Verified Patient Experiences" testimonial. */
export function TestimonialCard({ review, className }) {
  return (
    <figure className={cn('flex flex-col justify-between rounded-2xl bg-surface-container-low p-space-lg shadow-sm', className)}>
      <div className="space-y-space-sm">
        <div className="flex items-center justify-between gap-2">
          <Stars value={review.rating} />
          <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary">
            <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified Booking
          </span>
        </div>
        <blockquote className="font-body-md text-body-md italic text-on-surface">“{review.description}”</blockquote>
      </div>
      <figcaption className="pt-space-md">
        <p className="font-title-md text-title-md text-on-surface">{review.author.name}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {review.treatmentLabel} • {review.clinic?.name}
        </p>
      </figcaption>
    </figure>
  );
}

/**
 * Review card — Stitch clinic profile "Patient Reviews & Scores": initials
 * avatar, name, "Verified Resident • district", stars, quote, doctor and
 * treatment tags, relative date; optional clinic reply and actions.
 */
export function ReviewCard({ review, showStatus = false, showClinic = false, actions, className }) {
  return (
    <article className={cn('space-y-3 rounded-xl bg-surface p-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={review.author.avatar} name={review.author.name} size="md" />
          <div>
            <h4 className="font-title-md text-title-md text-on-surface">{review.author.name}</h4>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {review.isVerifiedPatient ? 'Verified Resident' : 'Patient'}
              {review.author.district ? ` • ${review.author.district}, Riyadh` : ''}
              {showClinic && review.clinic ? ` • ${review.clinic.name}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showStatus && <StatusBadge type="review" status={review.status} size="sm" />}
          <Stars value={review.rating} size="sm" />
        </div>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant">“{review.description}”</p>
      <div className="flex flex-wrap items-center gap-2 pt-1 font-label-sm text-label-sm">
        {review.doctor && <span className="rounded bg-surface-container px-2 py-0.5 text-on-surface-variant">Treated by {review.doctor.name}</span>}
        {review.treatmentLabel && <span className="rounded bg-surface-container px-2 py-0.5 text-on-surface-variant">{review.treatmentLabel}</span>}
        <span className="text-outline">• {formatRelative(review.createdAt)}</span>
      </div>
      {review.reply && (
        <div className="rounded bg-surface-container p-3 font-body-sm text-body-sm text-on-surface-variant">
          <span className="font-label-sm text-label-sm font-semibold uppercase text-primary">Replied by {review.reply.authorName}:</span>
          <p className="mt-0.5">“{review.reply.text}”</p>
        </div>
      )}
      {actions}
    </article>
  );
}

const METRICS = [
  { key: 'cleanliness', label: 'Cleanliness & Hygiene' },
  { key: 'consultation', label: 'Doctor Consultation' },
  { key: 'results', label: 'Natural Results' },
  { key: 'punctuality', label: 'Punctuality' },
];

/** Quality metric bars (Stitch "Cleanliness & Hygiene 5.0 ▬▬▬"). */
export function RatingBreakdown({ breakdown, className }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {METRICS.map((metric) => (
        <div key={metric.key} className="space-y-2 rounded-lg bg-surface p-4">
          <div className="flex items-center justify-between font-label-md text-label-md text-on-surface">
            <span>{metric.label}</span>
            <span className="font-bold text-primary">{formatRating(breakdown[metric.key] ?? 0)}</span>
          </div>
          <ProgressBar value={breakdown[metric.key] ?? 0} max={5} label={`${metric.label} score`} />
        </div>
      ))}
    </div>
  );
}
