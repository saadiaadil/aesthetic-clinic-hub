import { BadgeCheck, CircleCheck, CircleX, Hourglass, RefreshCw } from 'lucide-react';
import {
  APPOINTMENT_STATUS_META,
  CLINIC_STATUS_META,
  REVIEW_STATUS_META,
  USER_STATUS_META,
} from '@/constants/status';
import { cn } from '@/utils/cn';
import { Badge } from './Badge';

const META = {
  appointment: APPOINTMENT_STATUS_META,
  review: REVIEW_STATUS_META,
  clinic: CLINIC_STATUS_META,
  user: USER_STATUS_META,
};

/** Status indicators as drawn on the Stitch dashboard queue (icon, dot or live ping). */
function StatusIcon({ icon }) {
  switch (icon) {
    case 'verified':
      return <BadgeCheck className="size-3.5 text-secondary" aria-hidden="true" />;
    case 'check':
      return <CircleCheck className="size-3.5" aria-hidden="true" />;
    case 'hourglass':
      return <Hourglass className="size-3.5" aria-hidden="true" />;
    case 'x':
      return <CircleX className="size-3.5" aria-hidden="true" />;
    case 'refresh':
      return <RefreshCw className="size-3.5" aria-hidden="true" />;
    case 'ping':
      return (
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
      );
    case 'dot':
      return <span className="size-2 rounded-full bg-secondary" aria-hidden="true" />;
    default:
      return null;
  }
}

export function StatusBadge({ type = 'appointment', status, label, size = 'md', className }) {
  const meta = META[type]?.[status] ?? { label: status, tone: 'neutral' };
  return (
    <Badge tone={meta.tone} size={size} className={cn('gap-1.5 font-semibold', className)}>
      <StatusIcon icon={meta.icon} />
      {label ?? meta.label}
    </Badge>
  );
}
