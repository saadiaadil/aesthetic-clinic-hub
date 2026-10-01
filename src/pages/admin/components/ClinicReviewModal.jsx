import { useEffect, useId, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Ban, BadgeCheck, Building2, ExternalLink, EyeOff, Eye, FileText, RotateCcw, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { Field, Textarea } from '@/components/common/Form';
import { Modal } from '@/components/common/Overlay';
import { FormAlert } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { AMENITIES } from '@/data/clinics';
import { formatDate, formatRelative, formatSaudiPhone } from '@/utils/format';
import { requiredText } from '@/utils/validation';
import { DetailItem, PolicyNote, SectionLabel } from './AdminUI';

const rejectSchema = z.object({
  reason: requiredText('A rejection reason', 10).max(500, 'Keep the reason under 500 characters.'),
});

function DocumentList({ documents, onView }) {
  if (!documents.length) {
    return <p className="rounded-lg bg-surface-container-low p-space-sm font-body-sm text-body-sm text-on-surface-variant">No documents on file for this clinic.</p>;
  }
  return (
    <ul className="space-y-space-xs">
      {documents.map((doc) => (
        <li key={doc.type} className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-title-md text-title-md text-on-surface">{doc.type}</p>
            <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
              {doc.fileName} · {doc.size}
            </p>
          </div>
          <Button variant="soft" size="xs" leftIcon={Eye} onClick={() => onView(doc)} aria-label={`View ${doc.type} (${doc.fileName})`}>
            View
          </Button>
        </li>
      ))}
    </ul>
  );
}

function ClinicDetails({ clinic, onViewDocument }) {
  const status = clinic.verificationStatus;
  const amenities = (clinic.amenities ?? []).filter((key) => AMENITIES[key]);
  return (
    <div className="space-y-space-md">
      <div className="relative h-36 overflow-hidden rounded-xl bg-surface-container sm:h-44">
        {clinic.coverImage ? (
          <img src={clinic.coverImage} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-outline">
            <Building2 className="size-10" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent" aria-hidden="true" />
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
          <Badge tone="glass" size="md" uppercase>
            {clinic.category}
          </Badge>
          <Badge tone="glass" size="md">
            {clinic.districtLabel}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-space-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Current status</span>
          <StatusBadge type="clinic" status={status} />
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {status === 'verified' && clinic.verifiedAt
            ? `Verified ${formatDate(clinic.verifiedAt)}`
            : `Submitted ${formatDate(clinic.submittedAt)} · ${formatRelative(clinic.submittedAt)}`}
        </p>
      </div>

      {status === 'rejected' && clinic.rejectionReason && <FormAlert>Rejection reason: {clinic.rejectionReason}</FormAlert>}
      {status === 'suspended' && (
        <PolicyNote icon={EyeOff}>This clinic is suspended — hidden from public search and unable to accept new bookings until reinstated.</PolicyNote>
      )}

      <section>
        <SectionLabel>Licensing & registration</SectionLabel>
        <dl className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
          <DetailItem label="MOH facility license">{clinic.licenseNumber}</DetailItem>
          <DetailItem label="Commercial registration (CR)">{clinic.crNumber ?? '—'}</DetailItem>
          <DetailItem label="Specialty">{clinic.category}</DetailItem>
          <DetailItem label="Clinical team">
            {clinic.teamSize} {clinic.teamLabel}
          </DetailItem>
        </dl>
      </section>

      <section>
        <SectionLabel>Owner & contact</SectionLabel>
        <dl className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
          <DetailItem label="Account owner">{clinic.owner?.name ?? 'Not linked'}</DetailItem>
          <DetailItem label="Owner email">
            {clinic.owner?.email ? (
              <a href={`mailto:${clinic.owner.email}`} className="text-primary hover:underline">
                {clinic.owner.email}
              </a>
            ) : (
              '—'
            )}
          </DetailItem>
          <DetailItem label="Clinic phone">{clinic.contactNo ? formatSaudiPhone(clinic.contactNo) : '—'}</DetailItem>
          <DetailItem label="District">{clinic.districtLabel}</DetailItem>
          <DetailItem label="Address" className="sm:col-span-2">
            {clinic.address}
          </DetailItem>
        </dl>
      </section>

      <section>
        <SectionLabel>Amenities</SectionLabel>
        {amenities.length ? (
          <ul className="flex flex-wrap gap-2">
            {amenities.map((key) => (
              <li key={key} className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface-variant">
                <DynamicIcon name={AMENITIES[key].icon} className="size-4 text-secondary" />
                {AMENITIES[key].label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">No amenities declared.</p>
        )}
      </section>

      <section>
        <SectionLabel>Submitted documents</SectionLabel>
        <DocumentList documents={clinic.documents ?? []} onView={onViewDocument} />
      </section>

      <PolicyNote>Business rule: only verified clinics appear in public search and can receive bookings.</PolicyNote>
    </div>
  );
}

/**
 * Clinic application review (FR-3): full registration details, submitted
 * documents and the verification decision — approve, reject with a reason,
 * suspend (confirmed by the page) or reinstate.
 */
export function ClinicReviewModal({ clinic, onClose, onDecision, onSuspend, onViewDocument, pendingAction }) {
  const formId = useId();
  const [mode, setMode] = useState('details');
  const [trackedId, setTrackedId] = useState(clinic?.id);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } });

  // Every clinic opens on its details view.
  if (clinic?.id !== trackedId) {
    setTrackedId(clinic?.id);
    setMode('details');
  }

  useEffect(() => {
    if (mode === 'reject') setFocus('reason');
  }, [mode, setFocus]);

  const busy = Boolean(pendingAction);
  const status = clinic?.verificationStatus;

  const startReject = () => {
    reset({ reason: '' });
    setMode('reject');
  };
  const submitReject = handleSubmit(({ reason }) => onDecision(clinic, 'rejected', reason));

  const footer =
    mode === 'reject' ? (
      <>
        <Button variant="soft" leftIcon={ArrowLeft} onClick={() => setMode('details')} disabled={busy}>
          Back to details
        </Button>
        <Button type="submit" form={formId} variant="danger" leftIcon={X} loading={pendingAction === 'rejected'}>
          Reject application
        </Button>
      </>
    ) : (
      <>
        <Button variant="soft" onClick={onClose} disabled={busy}>
          Close
        </Button>
        {status === 'pending' && (
          <>
            <Button variant="danger-soft" leftIcon={X} onClick={startReject} disabled={busy}>
              Reject
            </Button>
            <Button leftIcon={BadgeCheck} onClick={() => onDecision(clinic, 'verified')} loading={pendingAction === 'verified'}>
              Approve & verify
            </Button>
          </>
        )}
        {status === 'verified' && (
          <>
            <Button variant="tonal" rightIcon={ExternalLink} href={ROUTES.clinic(clinic.id)} target="_blank" rel="noopener noreferrer">
              Public profile
            </Button>
            <Button variant="danger-soft" leftIcon={Ban} onClick={() => onSuspend(clinic)} disabled={busy}>
              Suspend clinic
            </Button>
          </>
        )}
        {(status === 'suspended' || status === 'rejected') && (
          <Button leftIcon={RotateCcw} onClick={() => onDecision(clinic, 'verified')} loading={pendingAction === 'verified'}>
            Reinstate
          </Button>
        )}
      </>
    );

  return (
    <Modal
      isOpen={Boolean(clinic)}
      onClose={busy ? () => {} : onClose}
      size="lg"
      title={clinic ? (mode === 'reject' ? `Reject ${clinic.name}` : clinic.name) : undefined}
      description={clinic ? (mode === 'reject' ? 'The reason is saved on the application so the clinic can correct it and resubmit.' : `${clinic.licenseNumber} • Owner: ${clinic.owner?.name ?? 'Not linked'}`) : undefined}
      footer={clinic ? footer : null}
    >
      {clinic &&
        (mode === 'reject' ? (
          <form id={formId} onSubmit={submitReject} noValidate className="space-y-space-md">
            <Field label="Reason for rejection" required error={errors.reason?.message} hint="At least 10 characters. Be specific about what must be corrected.">
              <Textarea rows={5} placeholder="e.g. The Balady municipal permit has expired — please upload the renewed permit." {...register('reason')} />
            </Field>
            <PolicyNote icon={EyeOff}>Rejected clinics stay hidden from public search and cannot receive bookings.</PolicyNote>
          </form>
        ) : (
          <ClinicDetails clinic={clinic} onViewDocument={onViewDocument} />
        ))}
    </Modal>
  );
}
