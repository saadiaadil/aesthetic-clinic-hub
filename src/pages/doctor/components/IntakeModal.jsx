import { DoorClosed, Lock, UsersRound } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Overlay';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PAYMENT_METHODS } from '@/constants/status';
import { cn } from '@/utils/cn';
import { fromDateKey } from '@/utils/date';
import { formatDate, formatPrice, formatSaudiPhone, formatSlot } from '@/utils/format';

function SectionLabel({ children }) {
  return <h3 className="mb-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">{children}</h3>;
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-surface-container-low px-3 py-2">
      <dt className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</dt>
      <dd className="mt-0.5 truncate font-body-sm text-body-sm font-semibold text-on-surface">{value}</dd>
    </div>
  );
}

function PreferenceItem({ icon: Icon, title, requested }) {
  return (
    <li className={cn('flex items-center gap-space-sm rounded-lg p-space-sm', requested ? 'bg-primary/5' : 'bg-surface-container-low')}>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          requested ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-surface-container text-outline',
        )}
      >
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-body-sm text-body-sm font-semibold text-on-surface">{title}</span>
        <span className={cn('block font-label-sm text-label-sm', requested ? 'text-primary' : 'text-on-surface-variant')}>
          {requested ? 'Requested by patient' : 'Not requested'}
        </span>
      </span>
    </li>
  );
}

/** Stitch "View Medical Intake": booking details, confidential notes and discretion preferences. */
export function IntakeModal({ appointment, isOpen, onClose }) {
  if (!appointment) return null;
  const { patient, service, preferences = {} } = appointment;
  const tier = patient?.tier ?? (patient?.fileNo ? `File #${patient.fileNo}` : null);
  const payment = PAYMENT_METHODS.find((method) => method.id === appointment.paymentMethod)?.label ?? 'Pay at Clinic';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Medical Intake"
      description={`${service?.title ?? 'Appointment'} • Confidential`}
      footer={
        <Button variant="soft" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-sm">
          <div className="flex min-w-0 items-center gap-space-sm">
            <Avatar src={patient?.avatar} name={patient?.name ?? 'Patient'} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-title-md text-title-md text-on-surface">{patient?.name}</p>
                {tier && <Badge tone={tier.includes('VIP') ? 'rose' : 'neutral'}>{tier}</Badge>}
              </div>
              {patient?.phone && <p className="font-body-sm text-body-sm text-on-surface-variant">{formatSaudiPhone(patient.phone)}</p>}
            </div>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <dl className="grid grid-cols-2 gap-space-xs sm:grid-cols-3">
          <Detail label="Date" value={formatDate(fromDateKey(appointment.dateKey))} />
          <Detail label="Time" value={`${formatSlot(appointment.slot)} AST`} />
          <Detail label="Duration" value={`${appointment.durationMinutes} mins`} />
          <Detail label="Suite" value={appointment.suite ?? 'To be assigned'} />
          <Detail label="Fee" value={formatPrice(appointment.priceCharged)} />
          <Detail label="Payment" value={payment} />
        </dl>

        <section>
          <SectionLabel>Treatment history & notes</SectionLabel>
          {appointment.patientNotes ? (
            <p className="rounded-lg bg-secondary-fixed/20 p-space-sm font-body-md text-body-md text-on-surface">{appointment.patientNotes}</p>
          ) : (
            <p className="rounded-lg bg-surface-container-low p-space-sm font-body-sm text-body-sm text-on-surface-variant">
              No intake notes were shared with this booking. Confirm allergies and recent treatments during consultation.
            </p>
          )}
        </section>

        <section>
          <SectionLabel>Discretion preferences</SectionLabel>
          <ul className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
            <PreferenceItem icon={DoorClosed} title="Private VIP suite & discreet arrival" requested={preferences.privateSuite} />
            <PreferenceItem icon={UsersRound} title="Female practitioner & staff only" requested={preferences.femaleStaff} />
          </ul>
        </section>

        {appointment.cancellationReason && (
          <section>
            <SectionLabel>Message sent to patient</SectionLabel>
            <p className="rounded-lg bg-error-container/40 p-space-sm font-body-sm text-body-sm text-on-error-container">{appointment.cancellationReason}</p>
          </section>
        )}

        <p className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
          <Lock className="size-3.5 shrink-0" aria-hidden="true" />
          Shared only with the treating team under MOH confidentiality rules and Saudi PDPL.
        </p>
      </div>
    </Modal>
  );
}
