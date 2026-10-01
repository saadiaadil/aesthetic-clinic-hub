import { useState } from 'react';
import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/format';

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-label-md',
  lg: 'size-12 text-label-md',
  xl: 'size-16 text-title-md',
};

// Stitch reviewer initials circles alternate plum, champagne and blush washes.
const FALLBACK_TONES = [
  'bg-primary-fixed text-on-primary-fixed',
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed',
  'bg-surface-container-highest text-on-surface',
];

function toneFor(name = '') {
  const code = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_TONES[code % FALLBACK_TONES.length];
}

/** Photo avatar with an initials fallback (also used when an image fails to load). */
export function Avatar({ src, name = '', size = 'md', status, className, ring = false }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {showImage ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn('rounded-full object-cover', SIZES[size], ring && 'ring-2 ring-primary/20')}
        />
      ) : (
        <span
          role="img"
          aria-label={name}
          className={cn('flex items-center justify-center rounded-full font-bold', SIZES[size], toneFor(name), ring && 'ring-2 ring-primary/20')}
        >
          {getInitials(name)}
        </span>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface-container-lowest',
            { primary: 'bg-primary', secondary: 'bg-secondary', outline: 'bg-outline' }[status] ?? 'bg-outline',
          )}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
