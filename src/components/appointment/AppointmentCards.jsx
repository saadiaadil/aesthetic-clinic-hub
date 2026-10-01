import { CalendarDays, Clock, MapPin, Stethoscope } from 'lucide-react';
import { Link } from 'react-router';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { fromDateKey } from '@/utils/date';
import { formatLongDate, formatPrice, formatSlot } from '@/utils/format';

/** Time block from the Stitch queue ("10:00 / AM"), tinted by status. */
export function TimeBlock({ slot, tone = 'default' }) {
  const [time, period] = formatSlot(slot).split(' ');
  return (
    <div
      className={cn(
        'flex w-16 shrink-0 flex-col items-center justify-center rounded-lg px-2 py-1',
        tone === 'active' && 'bg-primary-container text-on-primary-container',
        tone === 'gold' && 'bg-secondary-fixed/40 text-on-secondary-fixed',
        tone === 'default' && 'bg-surface-container text-on-surface-variant',
      )}
    >
      <span className={cn('font-label-md text-label-md font-semibold', tone === 'default' && 'text-on-surface')}>{time}</span>
      <span className={cn('font-label-sm text-label-sm uppercase', tone === 'default' && 'text-outline')}>{period}</span>
    </div>
  );
}

const ACCENT = { in_session: 'bg-primary', checked_in: 'bg-secondary' };
const TIME_TONE = { in_session: 'active', checked_in: 'gold' };

/**
 * Patient queue row — Stitch clinic dashboard "Real-Time Patient Schedule &
 * Queue": time block, patient portrait, name + tier/file chip, treatment •
 * suite, practitioner, status pill and contextual actions (`actions`).
 */
export function QueueRow({ appointment, actions, showDate = false, showDoctor = true, className }) {
  const accent = ACCENT[appointment.status];
  const tier = appointment.patient?.tier ?? (appointment.patient?.fileNo ? `File #${appointment.patient.fileNo}` : null);
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between gap-space-sm overflow-hidden rounded-xl bg-surface-container-low p-space-md transition-all hover:bg-surface-container lg:flex-row lg:items-center',
        className,
      )}
    >
      {accent && <div className={cn('absolute bottom-0 left-0 top-0 w-1.5', accent)} aria-hidden="true" />}
      <div className={cn('flex min-w-0 items-start gap-space-md sm:items-center', accent && 'pl-1')}>
        <TimeBlock slot={appointment.slot} tone={TIME_TONE[appointment.status] ?? 'default'} />
        <Avatar src={appointment.patient?.avatar} name={appointment.patient?.name ?? 'Patient'} size="md" className="size-11" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-title-md text-title-md font-semibold text-on-surface">{appointment.patient?.name}</span>
            {tier && (
              <Badge tone={tier.includes('Royal') ? 'goldSolid' : tier.includes('VIP') ? 'rose' : 'neutral'} className={tier.includes('Royal') ? 'bg-secondary-container font-semibold text-on-secondary-container' : ''}>
                {tier}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate font-body-sm text-body-sm font-medium text-primary">
            {appointment.service?.title}
            {appointment.suite ? ` • ${appointment.suite}` : ''}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
            {showDoctor && appointment.doctor && (
              <span className="flex items-center gap-1.5">
                <Stethoscope className="size-[15px] text-outline" aria-hidden="true" />
                {appointment.doctor.name}
              </span>
            )}
            {showDate && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-[15px] text-outline" aria-hidden="true" />
                {formatLongDate(fromDateKey(appointment.dateKey))}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className={cn('flex flex-wrap items-center justify-between gap-space-sm pt-2 lg:justify-end lg:pt-0', accent && 'pl-1')}>
        <StatusBadge status={appointment.status} label={appointment.status === 'checked_in' && appointment.patient?.tier?.includes('VIP') ? 'Checked-in VIP' : undefined} />
        {actions && <div className="flex flex-wrap items-center gap-1">{actions}</div>}
      </div>
    </div>
  );
}

/** Patient-facing appointment card (patient dashboard & appointments list). */
export function AppointmentCard({ appointment, actions, compact = false, className }) {
  return (
    <article className={cn('flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md transition-colors hover:bg-surface-container sm:flex-row', className)}>
      {!compact && (
        <img src={appointment.clinic?.coverImage} alt="" className="h-32 w-full shrink-0 rounded-lg object-cover sm:h-auto sm:w-40" />
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-space-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-title-lg text-title-lg text-on-surface">
              <Link to={ROUTES.patient.appointment(appointment.id)} className="hover:text-primary">
                {appointment.service?.title}
              </Link>
            </h3>
            <StatusBadge status={appointment.status} />
          </div>
          <p className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
            <MapPin className="size-4 text-secondary" aria-hidden="true" />
            {appointment.clinic?.name} • {appointment.clinic?.districtLabel}
          </p>
          <p className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
            <Stethoscope className="size-4 text-primary" aria-hidden="true" />
            {appointment.doctor?.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed/30 px-3 py-1.5 font-label-md text-label-md text-on-secondary-fixed">
              <CalendarDays className="size-4 text-secondary" aria-hidden="true" />
              {formatLongDate(fromDateKey(appointment.dateKey))}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 font-label-md text-label-md text-on-surface">
              <Clock className="size-4 text-primary" aria-hidden="true" />
              {formatSlot(appointment.slot)}
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">{formatPrice(appointment.priceCharged)}</span>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    </article>
  );
}
