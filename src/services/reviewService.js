import { USE_MOCK_API } from '@/constants/config';
import { badRequest, conflict, forbidden, generateId, http, mockRequest, notFound, paginate } from './apiClient';
import { db } from './mock/mockDb';
import { reviewView } from './mock/selectors';

/**
 * Reviews & ratings (FR-8) and moderation (admin "Moderate reviews").
 * REST endpoints (Phase 5): GET /clinics/:id/reviews, GET /doctors/:id/reviews,
 * GET /reviews/featured, GET /me/reviews, POST /reviews, POST /reviews/:id/reply,
 * PATCH /admin/reviews/:id/status
 */

const newest = (a, b) => b.createdAt.localeCompare(a.createdAt);

export function getFeaturedReviews(limit = 3) {
  if (!USE_MOCK_API) return http('/reviews/featured', { params: { limit } });
  return mockRequest(() => db.where('reviews', (review) => review.featured && review.status === 'approved').slice(0, limit).map(reviewView));
}

export function getClinicReviews(clinicId, { status = 'approved', rating = 'all', page = 1, pageSize = 10 } = {}) {
  if (!USE_MOCK_API) return http(`/clinics/${clinicId}/reviews`, { params: { status, rating, page, pageSize } });
  return mockRequest(() => {
    const items = db
      .where('reviews', (review) => review.clinicId === clinicId)
      .filter((review) => status === 'all' || review.status === status)
      .filter((review) => rating === 'all' || review.rating === Number(rating))
      .sort(newest)
      .map(reviewView);
    const approved = db.where('reviews', (review) => review.clinicId === clinicId && review.status === 'approved');
    const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: approved.filter((review) => review.rating === stars).length }));
    return { ...paginate(items, { page, pageSize }), distribution, awaitingReply: approved.filter((review) => !review.reply).length };
  });
}

export function getPatientReviews(userId) {
  if (!USE_MOCK_API) return http('/me/reviews');
  return mockRequest(() => db.where('reviews', (review) => review.userId === userId).sort(newest).map(reviewView));
}

/** Completed appointments of this patient that have no review yet. */
export function getReviewableAppointments(userId) {
  if (!USE_MOCK_API) return http('/me/reviewable-appointments');
  return mockRequest(() => {
    const reviewed = new Set(db.where('reviews', (review) => review.userId === userId).map((review) => review.appointmentId));
    return db
      .where('appointments', (apt) => apt.userId === userId && apt.status === 'completed' && !reviewed.has(apt.id))
      .map((apt) => ({
        id: apt.id,
        scheduledAt: apt.scheduledAt,
        clinicName: db.find('clinics', apt.clinicId)?.name,
        serviceTitle: db.find('clinicServices', apt.clinicServiceId)?.shortTitle,
        doctorName: db.find('doctors', apt.doctorId)?.name,
      }));
  });
}

export function createReview({ userId, appointmentId, rating, subRatings, description }) {
  if (!USE_MOCK_API) return http('/reviews', { method: 'POST', body: { appointmentId, rating, subRatings, description } });
  return mockRequest(() => {
    const appointment = db.find('appointments', appointmentId);
    if (!appointment) throw notFound('Appointment');
    if (appointment.userId !== userId) throw forbidden('You can only review your own visits.');
    // Precondition (FR-8): appointment completed.
    if (appointment.status !== 'completed') throw badRequest('Reviews open once your appointment is completed.');
    // UNIQUE(appointment_id, user_id): one review per patient per visit.
    if (db.all('reviews').some((review) => review.appointmentId === appointmentId && review.userId === userId)) {
      throw conflict('You have already reviewed this visit.');
    }
    const service = db.find('clinicServices', appointment.clinicServiceId);
    return reviewView(
      db.insert('reviews', {
        id: generateId('rev'),
        appointmentId,
        clinicId: appointment.clinicId,
        doctorId: appointment.doctorId,
        userId,
        rating,
        subRatings,
        treatmentLabel: service?.shortTitle ?? '',
        description: description.trim(),
        isVerifiedPatient: true,
        status: 'pending',
        reply: null,
        createdAt: new Date().toISOString(),
      }),
    );
  });
}

export function replyToReview(reviewId, { text, authorName }) {
  if (!USE_MOCK_API) return http(`/reviews/${reviewId}/reply`, { method: 'POST', body: { text } });
  return mockRequest(() => {
    const review = db.find('reviews', reviewId);
    if (!review) throw notFound('Review');
    return reviewView(db.update('reviews', reviewId, { reply: { text: text.trim(), authorName, createdAt: new Date().toISOString() } }));
  });
}

export function getAdminReviews({ status = 'pending', q = '' } = {}) {
  if (!USE_MOCK_API) return http('/admin/reviews', { params: { status, q } });
  return mockRequest(() => {
    const needle = q.trim().toLowerCase();
    const items = db
      .all('reviews')
      .filter((review) => status === 'all' || review.status === status)
      .sort(newest)
      .map(reviewView)
      .filter((review) => !needle || `${review.author.name} ${review.clinic?.name} ${review.description}`.toLowerCase().includes(needle));
    const counts = db.all('reviews').reduce((acc, review) => ({ ...acc, [review.status]: (acc[review.status] ?? 0) + 1 }), { all: db.all('reviews').length });
    return { items, counts };
  });
}

/**
 * Moderation decision. Approving updates the stored clinic aggregates the
 * way the API will ("Store review → Update rating").
 */
export function moderateReview(reviewId, status) {
  if (!USE_MOCK_API) return http(`/admin/reviews/${reviewId}/status`, { method: 'PATCH', body: { status } });
  return mockRequest(() => {
    const review = db.find('reviews', reviewId);
    if (!review) throw notFound('Review');
    const wasApproved = review.status === 'approved';
    const updated = db.update('reviews', reviewId, { status });
    const clinic = db.find('clinics', review.clinicId);
    const isApproved = status === 'approved';
    // Keep the clinic's published rating in step when a review enters or leaves the public profile.
    if (clinic && isApproved !== wasApproved) {
      const count = Math.max(0, clinic.reviewCount + (isApproved ? 1 : -1));
      const total = clinic.rating * clinic.reviewCount + (isApproved ? review.rating : -review.rating);
      db.update('clinics', clinic.id, { reviewCount: count, rating: count ? Math.round((total / count) * 100) / 100 : 0 });
    }
    return reviewView(updated);
  });
}
