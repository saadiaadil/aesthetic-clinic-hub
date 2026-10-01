import { ClipboardList, CreditCard, Receipt, ShieldCheck } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Modal } from '@/components/common/Overlay';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PAYMENT_METHODS } from '@/constants/status';
import { includedVat } from '@/utils/clinic';
import { fromDateKey } from '@/utils/date';
import { formatLongDate, formatPrice, formatSaudiPhone, formatSlot } from '@/utils/format';

/**
 * Clinic-side appointment details: confidential medical intake, discretion
 * preferences and the receipt summary (Stitch "View Medical Intake" and
 * "Receipt & Summary" actions).
 */
export function AppointmentDetailsModal({ appointment, isOpen, onClose, view = 'intake' }) {
  if (!appointment) return null;
  const payment = PAYMENT_METHODS.find((method) => method.id === appointment.paymentMethod);
  const vat = includedVat(appointment.priceCharged);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={view === 'receipt' ? 'Receipt & Summary' : 'Confidential Medical Intake'}
      description={`${appointment.patient?.name} • ${formatLongDate(fromDateKey(appointment.dateKey))} at ${formatSlot(appointment.slot)}`}
    >
      <div className="space-y-space-md">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low p-space-sm">
          <div className="flex items-center gap-3">
            <Avatar src={appointment.patient?.avatar} name={appointment.patient?.name ?? ''} size="md" />
            <div>
              <p className="font-title-md text-title-md text-on-surface">{appointment.patient?.name}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {appointment.patient?.phone ? formatSaudiPhone(appointment.patient.phone) : 'No phone on file'}
                {appointment.patient?.fileNo ? ` • File #${appointment.patient.fileNo}` : ''}
              </p>
            </div>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        {view === 'receipt' ? (
          <dl className="space-y-2 rounded-lg bg-surface-container-low p-space-md font-body-sm text-body-sm">
            <div className="flex items-center gap-2 pb-2 font-title-md text-title-md text-on-surface">
              <Receipt className="size-5 text-primary" aria-hidden="true" /> {appointment.service?.title}
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <dt>Practitioner</dt>
              <dd className="text-on-surface">{appointment.doctor?.name}</dd>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <dt>Price (excl. VAT)</dt>
              <dd className="text-on-surface">{formatPrice(appointment.priceCharged - vat)}</dd>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <dt>VAT 15%</dt>
              <dd className="text-on-surface">{formatPrice(vat)}</dd>
            </div>
            <div className="flex justify-between border-t border-surface-container-high pt-2 font-title-md text-title-md text-on-surface">
              <dt>Total</dt>
              <dd className="text-primary">{formatPrice(appointment.priceCharged)}</dd>
            </div>
            <div className="flex items-center gap-2 pt-2 text-on-surface-variant">
              <CreditCard className="size-4 text-secondary" aria-hidden="true" /> {payment?.label ?? 'Pay at Clinic'} — {payment?.description}
            </div>
          </dl>
        ) : (
          <>
            <div className="rounded-lg bg-surface-container-low p-space-md">
              <p className="mb-1 flex items-center gap-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                <ClipboardList className="size-4 text-primary" aria-hidden="true" /> Treatment history & allergies
              </p>
              <p className="font-body-md text-body-md text-on-surface">{appointment.patientNotes || 'The patient did not add intake notes.'}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-space-md">
              <p className="mb-1 flex items-center gap-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                <ShieldCheck className="size-4 text-secondary" aria-hidden="true" /> Discretion preferences
              </p>
              <ul className="space-y-1 font-body-md text-body-md text-on-surface">
                <li>{appointment.preferences?.privateSuite ? '✓ Private VIP room & garage escort' : '• Standard arrival'}</li>
                <li>{appointment.preferences?.femaleStaff ? '✓ Female practitioner & staff only' : '• No gender preference'}</li>
              </ul>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Confidential — visible to the treating clinic only (Saudi PDPL).</p>
          </>
        )}
      </div>
    </Modal>
  );
}
