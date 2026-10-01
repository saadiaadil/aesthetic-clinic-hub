/**
 * Status vocabularies from the database design (appointments.status,
 * reviews.status, clinics.verification_status, users) with the display
 * metadata used by <StatusBadge />.
 *
 * `checked_in` and `in_session` extend the stored appointment state machine
 * with the day-of-visit stages shown on the Stitch clinic dashboard queue.
 */

export const APPOINTMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  IN_SESSION: 'in_session',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
});

export const APPOINTMENT_STATUS_META = {
  pending: { label: 'Awaiting Approval', tone: 'gold', icon: 'hourglass' },
  confirmed: { label: 'Confirmed', tone: 'confirmed', icon: 'verified' },
  checked_in: { label: 'Checked-in', tone: 'goldSolid', icon: 'dot' },
  in_session: { label: 'In Consultation', tone: 'plum', icon: 'ping' },
  completed: { label: 'Completed', tone: 'muted', icon: 'check' },
  cancelled: { label: 'Cancelled', tone: 'danger', icon: 'x' },
  no_show: { label: 'No-show', tone: 'muted', icon: 'x' },
  rescheduled: { label: 'Rescheduled', tone: 'rose', icon: 'refresh' },
};

/** Statuses that still occupy a slot (report: double-booking prevention index). */
export const ACTIVE_APPOINTMENT_STATUSES = ['pending', 'confirmed', 'checked_in', 'in_session', 'rescheduled'];
export const UPCOMING_APPOINTMENT_STATUSES = ['pending', 'confirmed', 'rescheduled'];

export const REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const REVIEW_STATUS_META = {
  pending: { label: 'In Moderation', tone: 'gold', icon: 'hourglass' },
  approved: { label: 'Published', tone: 'success', icon: 'check' },
  rejected: { label: 'Rejected', tone: 'danger', icon: 'x' },
};

export const CLINIC_STATUS = Object.freeze({
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
});

export const CLINIC_STATUS_META = {
  pending: { label: 'Pending Review', tone: 'gold', icon: 'hourglass' },
  verified: { label: 'MOH Verified', tone: 'success', icon: 'verified' },
  rejected: { label: 'Rejected', tone: 'danger', icon: 'x' },
  suspended: { label: 'Suspended', tone: 'muted', icon: 'x' },
};

export const USER_STATUS_META = {
  active: { label: 'Active', tone: 'success', icon: 'check' },
  suspended: { label: 'Suspended', tone: 'danger', icon: 'x' },
};

export const PAYMENT_METHODS = [
  { id: 'clinic', label: 'Pay at Clinic', description: 'Apple Pay, Mada, Cash' },
  { id: 'installments', label: 'Tabby / Tamara', description: '4 interest-free installments' },
];
