import { CircleCheck, CircleMinus, CircleX, Hourglass } from 'lucide-react';
import { ROLES } from '@/constants/roles';

/** Badge tone per platform role (users table, newest accounts list). */
export const ROLE_TONES = {
  [ROLES.PATIENT]: 'neutral',
  [ROLES.CLINIC]: 'gold',
  [ROLES.DOCTOR]: 'plum',
  [ROLES.ADMIN]: 'plumSolid',
};

/** Doctor account states (doctors.status) as shown in the admin registry. */
export const DOCTOR_STATUS_META = {
  active: { label: 'Active', tone: 'success', icon: CircleCheck },
  pending: { label: 'Pending Approval', tone: 'gold', icon: Hourglass },
  inactive: { label: 'Inactive', tone: 'muted', icon: CircleMinus },
  suspended: { label: 'Suspended', tone: 'danger', icon: CircleX },
};

/** "apt-1001" → "#APT-1001" (booking reference shown to admins and patients). */
export const formatReference = (id = '') => `#${id.toUpperCase()}`;

/** Provenance line under a review in moderation (every review must come from a completed booking). */
export const reviewProvenance = (review) =>
  review.appointmentId ? `Verified booking ${formatReference(review.appointmentId)}` : 'No linked booking';

/** Toast copy for review moderation decisions, keyed by `${from}>${to}`. */
export const REVIEW_DECISION_TOASTS = {
  'pending>approved': { title: 'Review published', text: (clinic) => `Now visible on ${clinic} and counted in its rating.` },
  'pending>rejected': { title: 'Review rejected', text: (clinic) => `It will not appear on ${clinic}.` },
  'approved>rejected': { title: 'Review unpublished', text: (clinic) => `Removed from ${clinic}’s public profile.` },
  'rejected>approved': { title: 'Review restored', text: (clinic) => `Published on ${clinic}’s public profile.` },
};
