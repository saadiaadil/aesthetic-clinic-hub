import { USE_MOCK_API } from '@/constants/config';
import { ROLES } from '@/constants/roles';
import { fromScheduledAt, todayKey } from '@/utils/date';
import { http, mockRequest, notFound, paginate } from './apiClient';
import { db } from './mock/mockDb';
import { clinicSummary, publicUser, reviewView } from './mock/selectors';

/**
 * Admin user management and platform overview (FR-9).
 * REST endpoints (Phase 5): GET /admin/users, PATCH /admin/users/:id/status, GET /admin/overview
 */

export function getUsers({ role = 'all', status = 'all', q = '', page = 1, pageSize = 8 } = {}) {
  if (!USE_MOCK_API) return http('/admin/users', { params: { role, status, q, page, pageSize } });
  return mockRequest(() => {
    const needle = q.trim().toLowerCase();
    const items = db
      .all('users')
      .filter((user) => role === 'all' || user.role === role)
      .filter((user) => status === 'all' || user.status === status)
      .filter((user) => !needle || `${user.name} ${user.email} ${user.phone ?? ''}`.toLowerCase().includes(needle))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((user) => ({
        ...publicUser(user),
        clinicName: user.clinicId ? db.find('clinics', user.clinicId)?.name : null,
        appointmentCount: db.where('appointments', (apt) => apt.userId === user.id).length,
      }));
    const counts = Object.values(ROLES).reduce((acc, value) => ({ ...acc, [value]: db.where('users', (user) => user.role === value).length }), { all: db.all('users').length });
    return { ...paginate(items, { page, pageSize }), counts };
  });
}

export function setUserStatus(userId, status) {
  if (!USE_MOCK_API) return http(`/admin/users/${userId}/status`, { method: 'PATCH', body: { status } });
  return mockRequest(() => {
    if (!db.find('users', userId)) throw notFound('User');
    return publicUser(db.update('users', userId, { status }));
  });
}

export function getAdminOverview() {
  if (!USE_MOCK_API) return http('/admin/overview');
  return mockRequest(() => {
    const clinics = db.all('clinics');
    const appointments = db.all('appointments');
    const reviews = db.all('reviews');
    const users = db.all('users');
    const monthPrefix = todayKey().slice(0, 7);
    const thisMonth = appointments.filter((apt) => fromScheduledAt(apt.scheduledAt).dateKey.startsWith(monthPrefix));
    const statusBreakdown = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map((status) => ({
      status,
      count: appointments.filter((apt) => apt.status === status).length,
    }));
    const gmv = appointments.filter((apt) => apt.status === 'completed').reduce((sum, apt) => sum + apt.priceCharged, 0);
    return {
      metrics: {
        verifiedClinics: clinics.filter((clinic) => clinic.verificationStatus === 'verified').length,
        pendingClinics: clinics.filter((clinic) => clinic.verificationStatus === 'pending').length,
        patients: users.filter((user) => user.role === 'patient').length,
        doctors: db.where('doctors', (doc) => doc.status === 'active').length,
        appointmentsThisMonth: thisMonth.length,
        pendingReviews: reviews.filter((review) => review.status === 'pending').length,
        completedValue: gmv,
      },
      statusBreakdown,
      pendingClinics: clinics
        .filter((clinic) => clinic.verificationStatus === 'pending')
        .map((clinic) => ({ ...clinicSummary(clinic, { withNextSlot: false }), submittedAt: clinic.submittedAt, documents: clinic.documents ?? [] })),
      moderationQueue: reviews.filter((review) => review.status === 'pending').map(reviewView),
      topClinics: clinics
        .filter((clinic) => clinic.verificationStatus === 'verified')
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5)
        .map((clinic) => ({
          ...clinicSummary(clinic, { withNextSlot: false }),
          bookings: appointments.filter((apt) => apt.clinicId === clinic.id).length,
        })),
      recentUsers: [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(publicUser),
    };
  });
}
