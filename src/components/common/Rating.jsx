import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatNumber, formatRating } from '@/utils/format';

/** Row of filled champagne stars (Stitch testimonials & review cards). */
export function Stars({ value = 5, size = 'md', className }) {
  const iconSize = { sm: 'size-3.5', md: 'size-[18px]', lg: 'size-5' }[size];
  const rounded = Math.round(value);
  return (
    <span className={cn('inline-flex items-center text-secondary', className)} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={cn(iconSize, index <= rounded ? 'fill-current' : 'text-outline-variant')}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** "★ 4.90 (320 reviews)" rating summary. */
export function RatingValue({ value, count, countLabel = '', size = 'md', className, light = false }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <Star className={cn('shrink-0 fill-current', light ? 'text-secondary-fixed' : 'text-secondary', size === 'sm' ? 'size-3.5' : 'size-4')} aria-hidden="true" />
      <span className={cn('font-bold', size === 'lg' ? 'font-title-md text-title-md' : 'font-label-md text-label-md', light ? 'text-on-primary' : 'text-on-surface')}>
        {count === 0 ? 'New' : formatRating(value)}
      </span>
      {count > 0 && (
        <span className={cn('font-body-sm text-body-sm', light ? 'text-on-primary/80' : 'text-on-surface-variant')}>
          ({formatNumber(count)}{countLabel ? ` ${countLabel}` : ''})
        </span>
      )}
    </span>
  );
}

/** Accessible 1–5 star picker (radio group) for the review form. */
export function StarRatingInput({ value, onChange, name = 'rating', size = 'lg', label = 'Overall rating', invalid = false }) {
  const [hovered, setHovered] = useState(0);
  const iconSize = size === 'lg' ? 'size-8' : 'size-6';
  const display = hovered || value || 0;
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className="cursor-pointer" onMouseEnter={() => setHovered(star)}>
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="peer sr-only"
              aria-invalid={invalid || undefined}
            />
            <span className="sr-only">{star} star{star > 1 ? 's' : ''}</span>
            <Star
              className={cn(
                iconSize,
                'rounded-sm transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary-container',
                star <= display ? 'fill-current text-secondary' : 'text-outline-variant',
              )}
              aria-hidden="true"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
