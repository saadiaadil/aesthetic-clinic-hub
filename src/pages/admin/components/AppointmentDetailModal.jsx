import { Building2, CalendarCheck, CreditCard, ShieldCheck, Sparkles, Stethoscope, UserRound, Wallet } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Overlay';
import { Stars } from '@/components/common/Rating';
import { FormAlert } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PAYMENT_METHODS } from '@/constants/status';
import { fromDateKey } from '@/utils/date';
import { formatDate, formatLongDate, formatPrice, formatSaudiPhone, formatSlot } from '@/utils/format';
import { DetailRow, SectionLabel } from './AdminUI';
import { formatReference } from './adminMeta';

const PREFERENCE_LABELS = {
  privateSuite: 'Private VIP suite & garage escort',
  femaleStaff: 'Female practitioner & staff only',
};

function AppointmentDetails({ appointment }) {
  const { patient, clinic, doctor, treatment, service } = appointment;
  const payment = PAYMENT_METHODS.find((method) => method.id === appointment.paymentMethod);
  const preferences = Object.entries(appointment.preferences ?? {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => PREFERENCE_LABELS[key] ?? key);

  return (
    <div className="space-y-space-md">
      <div className="flex flex-col gap-3 rounded-xl bg-secondary-fixed/30 p-space-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-space-sm text-on-secondary-fixed">
          <CalendarCheck className="size-5 shrink-0 text-secondary" aria-hidden="true" />
          <div>
            <p className="font-title-md text-title-md">{formatLongDate(fromDateKey(appointment.dateKey))}</p>
            <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">
              {formatSlot(appointment.slot)} AST • {appointment.durationMinutes} mins{appointment.suite ? ` • ${appointment.suite}` : ''}
            </p>
          </div>
        </div>
        <StatusBadge status={appointment.status} className="self-start sm:self-auto" />
      </div>

      {appointment.status === 'cancelled' && (
        <FormAlert>
          Cancelled{appointment.cancelledAt ? ` on ${formatDate(appointment.cancelledAt)}` : ''}
          {appointment.cancellationReason ? ` — ${appointment.cancellationReason}` : '.'}
        </FormAlert>
      )}

      <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
        <DetailRow
          icon={UserRound}
          label="Patient"
          value={patient?.name ?? 'Unknown patient'}
          detail={[patient?.phone && formatSaudiPhone(patient.phone), patient?.email].filter(Boolean).join(' • ')}
        />
        <DetailRow icon={Building2} label="Clinic" value={clinic?.name ?? '—'} detail={clinic?.districtLabel} />
        <DetailRow icon={Stethoscope} label="Specialist" value={doctor?.name ?? '—'} detail={doctor?.title} />
        <DetailRow icon={Sparkles} label="Treatment" value={service?.title ?? treatment?.name ?? '—'} detail={treatment && service?.title !== treatment.name ? treatment.name : null} />
        <DetailRow icon={Wallet} label="Price charged" value={formatPrice(appointment.priceCharged, { currency: appointment.currency ?? 'SAR' })} detail="Locked at the time of booking" />
        <DetailRow icon={CreditCard} label="Payment method" value={payment?.label ?? appointment.paymentMethod ?? '—'} detail={payment?.description} />
      </div>

      <section>
        <SectionLabel>Discretion preferences</SectionLabel>
        {preferences.length ? (
          <ul className="flex flex-wrap gap-2">
            {preferences.map((label) => (
              <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface-variant">
                <ShieldCheck className="size-4 text-secondary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">Standard arrival — no special preferences.</p>
        )}
      </section>

      <section>
        <SectionLabel>Medical intake notes</SectionLabel>
        <p className="rounded-lg bg-surface-container-low p-space-sm font-body-md text-body-md text-on-surface-variant">
          {appointment.patientNotes || 'No intake notes were shared with this booking.'}
        </p>
      </section>

      {appointment.review && (
        <section>
          <SectionLabel>Patient review</SectionLabel>
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-container-low p-space-sm">
            <Stars value={appointment.review.rating} size="sm" />
            <StatusBadge type="review" status={appointment.review.status} size="sm" />
          </div>
        </section>
      )}
    </div>
  );
}

/** Read-only booking record for admins: schedule, parties, intake notes, preferences and payment. */
export function AppointmentDetailModal({ appointment, onClose }) {
  return (
    <Modal
      isOpen={Boolean(appointment)}
      onClose={onClose}
      size="lg"
      title={appointment ? (appointment.service?.title ?? 'Appointment') : undefined}
      description={appointment ? `Reference ${formatReference(appointment.id)} • Booked ${formatDate(appointment.createdAt)}` : undefined}
      footer={
        <Button variant="soft" onClick={onClose}>
          Close
        </Button>
      }
    >
      {appointment && <AppointmentDetails appointment={appointment} />}
    </Modal>
  );
}
