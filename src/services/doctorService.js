import { USE_MOCK_API } from '@/constants/config';
import { addDays, fromScheduledAt, todayKey } from '@/utils/date';
import { badRequest, generateId, http, mockRequest, notFound, paginate } from './apiClient';
import { db } from './mock/mockDb';
import { appointmentView, clinicServiceView, clinicSummary, doctorSummary, getNextAvailable, isPublicClinic, reviewView } from './mock/selectors';

/**
 * Doctors — public directory, profiles, clinic roster management, schedules
 * (doctor_schedule / doctor_leave) and the doctor workstation.
 * REST endpoints (Phase 5): GET /doctors, GET /doctors/:id, GET /clinics/:id/doctors,
 * POST/PATCH/DELETE /clinics/:id/doctors, GET|PUT /doctors/:id/schedule, GET /doctors/:id/dashboard
 */

const isListed = (doctor) =>
  doctor.status === 'active' && doctor.clinicIds.some((clinicId) => isPublicClinic(db.find('clinics', clinicId)));

export function getDoctors({ q = '', specialization = 'all', clinicId = 'all', gender = 'all', language = 'all', sort = 'rating', page = 1, pageSize = 9 } = {}) {
  if (!USE_MOCK_API) return http('/doctors', { params: { q, specialization, clinicId, gender, language, sort, page, pageSize } });
  return mockRequest(() => {
    const needle = q.trim().toLowerCase();
    let items = db
      .all('doctors')
      .filter(isListed)
      .filter((doc) => specialization === 'all' || doc.specialization === specialization)
      .filter((doc) => clinicId === 'all' || doc.clinicIds.includes(clinicId))
      .filter((doc) => gender === 'all' || doc.gender === gender)
      .filter((doc) => language === 'all' || doc.languages.includes(language))
      .filter((doc) => !needle || `${doc.name} ${doc.title} ${doc.specialization} ${doc.bio}`.toLowerCase().includes(needle))
      .map(doctorSummary);
    const sorters = {
      rating: (a, b) => b.rating - a.rating,
      experience: (a, b) => b.experienceYears - a.experienceYears,
      fee: (a, b) => a.consultationFee - b.consultationFee,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    items = [...items].sort(sorters[sort] ?? sorters.rating);
    return paginate(items, { page, pageSize });
  });
}

export function getSpecializations() {
  if (!USE_MOCK_API) return http('/doctors/specializations');
  return mockRequest(() => [...new Set(db.all('doctors').filter(isListed).map((doc) => doc.specialization))].sort(), { delay: 80 });
}

export function getDoctorById(id) {
  if (!USE_MOCK_API) return http(`/doctors/${id}`);
  return mockRequest(() => {
    const doctor = db.find('doctors', id);
    if (!doctor || !isListed(doctor)) throw notFound('Specialist');
    const clinics = doctor.clinicIds.map((clinicId) => db.find('clinics', clinicId)).filter(isPublicClinic).map((clinic) => clinicSummary(clinic, { withNextSlot: false }));
    const services = db.where('clinicServices', (service) => service.doctorIds.includes(id) && service.isAvailable).map(clinicServiceView);
    const reviews = db
      .where('reviews', (review) => review.doctorId === id && review.status === 'approved')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(reviewView);
    return {
      ...doctorSummary(doctor),
      about: doctor.about,
      credentials: doctor.credentials,
      scfhsLicense: doctor.scfhsLicense,
      clinics,
      services,
      reviews,
      nextAvailable: getNextAvailable(doctor.primaryClinicId, [id]),
    };
  });
}

// ── Clinic roster (clinic portal) ─────────────────────────────────────────

export function getClinicDoctors(clinicId) {
  if (!USE_MOCK_API) return http(`/clinics/${clinicId}/doctors`);
  return mockRequest(() =>
    db
      .where('doctors', (doc) => doc.clinicIds.includes(clinicId))
      .map((doc) => ({
        ...doctorSummary(doc),
        clinicRole: doc.clinicRole,
        scfhsLicense: doc.scfhsLicense,
        credentials: doc.credentials,
        serviceCount: db.where('clinicServices', (service) => service.clinicId === clinicId && service.doctorIds.includes(doc.id)).length,
        upcomingCount: db.where('appointments', (apt) => apt.doctorId === doc.id && ['pending', 'confirmed'].includes(apt.status) && apt.scheduledAt >= new Date().toISOString()).length,
      })),
  );
}

export function saveClinicDoctor(clinicId, data) {
  if (!USE_MOCK_API) {
    return data.id ? http(`/clinics/${clinicId}/doctors/${data.id}`, { method: 'PATCH', body: data }) : http(`/clinics/${clinicId}/doctors`, { method: 'POST', body: data });
  }
  return mockRequest(() => {
    const duplicate = db.all('doctors').find((doc) => doc.scfhsLicense?.toLowerCase() === data.scfhsLicense.trim().toLowerCase() && doc.id !== data.id);
    if (duplicate) throw badRequest('A specialist with this SCFHS license already exists.', { scfhsLicense: 'SCFHS license must be unique.' });
    const record = {
      name: data.name.startsWith('Dr.') ? data.name : `Dr. ${data.name}`,
      title: data.title,
      headline: data.title,
      specialization: data.specialization,
      gender: data.gender,
      experienceYears: Number(data.experienceYears),
      consultationFee: Number(data.consultationFee),
      languages: data.languages,
      bio: data.bio,
      about: data.bio,
      scfhsLicense: data.scfhsLicense.trim(),
      tags: data.languages.length ? [data.languages.map((code) => ({ ar: 'Arabic', en: 'English', fr: 'French' })[code]).join(' & ')] : [],
    };
    if (data.id) return doctorSummary(db.update('doctors', data.id, record));
    const id = generateId('doc');
    const doctor = db.insert('doctors', {
      id,
      userId: null,
      primaryClinicId: clinicId,
      clinicIds: [clinicId],
      clinicRole: 'doctor',
      credentials: [],
      rating: 0,
      reviewCount: 0,
      badges: [],
      photo: null,
      headshot: null,
      status: 'active',
      ...record,
    });
    db.insert('doctorSchedules', {
      id: generateId('sch'),
      doctorId: id,
      clinicId,
      blocks: [0, 1, 2, 3, 4].map((dayOfWeek) => ({ dayOfWeek, start: '10:00', end: '18:00' })),
    });
    return doctorSummary(doctor);
  });
}

export function removeClinicDoctor(clinicId, doctorId) {
  if (!USE_MOCK_API) return http(`/clinics/${clinicId}/doctors/${doctorId}`, { method: 'DELETE' });
  return mockRequest(() => {
    const upcoming = db.where('appointments', (apt) => apt.doctorId === doctorId && ['pending', 'confirmed', 'rescheduled'].includes(apt.status) && apt.scheduledAt >= new Date().toISOString()).length;
    if (upcoming > 0) throw badRequest(`This specialist has ${upcoming} upcoming appointment${upcoming > 1 ? 's' : ''}. Reassign them first.`);
    const doctor = db.find('doctors', doctorId);
    const clinicIds = doctor.clinicIds.filter((id) => id !== clinicId);
    if (clinicIds.length === 0) db.update('doctors', doctorId, { status: 'inactive', clinicIds });
    else db.update('doctors', doctorId, { clinicIds, primaryClinicId: clinicIds[0] });
    return { id: doctorId };
  });
}

// ── Schedules ─────────────────────────────────────────────────────────────

export function getDoctorSchedule(doctorId) {
  if (!USE_MOCK_API) return http(`/doctors/${doctorId}/schedule`);
  return mockRequest(() => {
    const doctor = db.find('doctors', doctorId);
    if (!doctor) throw notFound('Specialist');
    return {
      doctor: doctorSummary(doctor),
      schedules: db.where('doctorSchedules', (row) => row.doctorId === doctorId).map((row) => ({ ...row, clinic: db.find('clinics', row.clinicId)?.name })),
      leaves: db.where('doctorLeaves', (leave) => leave.doctorId === doctorId).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    };
  });
}

export function getClinicSchedules(clinicId) {
  if (!USE_MOCK_API) return http(`/clinics/${clinicId}/schedules`);
  return mockRequest(() =>
    db
      .where('doctors', (doc) => doc.clinicIds.includes(clinicId) && doc.status === 'active')
      .map((doc) => ({
        doctor: doctorSummary(doc),
        blocks: db.all('doctorSchedules').find((row) => row.doctorId === doc.id && row.clinicId === clinicId)?.blocks ?? [],
        leaves: db.where('doctorLeaves', (leave) => leave.doctorId === doc.id && leave.endDate >= todayKey()),
      })),
  );
}

/** Replace a doctor's weekly blocks at a clinic. Validates end_time > start_time. */
export function updateDoctorSchedule(doctorId, clinicId, blocks) {
  if (!USE_MOCK_API) return http(`/doctors/${doctorId}/schedule`, { method: 'PUT', body: { clinicId, blocks } });
  return mockRequest(() => {
    const invalid = blocks.find((block) => block.end <= block.start);
    if (invalid) throw badRequest('Each working block must end after it starts.');
    const existing = db.all('doctorSchedules').find((row) => row.doctorId === doctorId && row.clinicId === clinicId);
    const record = { id: existing?.id ?? generateId('sch'), doctorId, clinicId, blocks };
    db.replaceWhere('doctorSchedules', (row) => row.doctorId === doctorId && row.clinicId === clinicId, [record]);
    return record;
  });
}

export function addDoctorLeave(doctorId, { startDate, endDate, reason }) {
  if (!USE_MOCK_API) return http(`/doctors/${doctorId}/leave`, { method: 'POST', body: { startDate, endDate, reason } });
  return mockRequest(() => {
    if (endDate < startDate) throw badRequest('Leave end date must be on or after the start date.');
    // Overlapping range check is enforced at the application layer (database design note).
    const overlap = db.all('doctorLeaves').some((leave) => leave.doctorId === doctorId && startDate <= leave.endDate && endDate >= leave.startDate);
    if (overlap) throw badRequest('This leave overlaps an existing leave period.');
    return db.insert('doctorLeaves', { id: generateId('leave'), doctorId, startDate, endDate, reason, createdAt: new Date().toISOString() });
  });
}

export function removeDoctorLeave(leaveId) {
  if (!USE_MOCK_API) return http(`/doctor-leave/${leaveId}`, { method: 'DELETE' });
  return mockRequest(() => {
    db.remove('doctorLeaves', leaveId);
    return { id: leaveId };
  });
}

// ── Doctor workstation ────────────────────────────────────────────────────

export function getDoctorDashboard(doctorId) {
  if (!USE_MOCK_API) return http(`/doctors/${doctorId}/dashboard`);
  return mockRequest(() => {
    const doctor = db.find('doctors', doctorId);
    if (!doctor) throw notFound('Specialist');
    const today = todayKey();
    const weekEnd = addDays(today, 7);
    const mine = db.where('appointments', (apt) => apt.doctorId === doctorId);
    const dated = (apt) => fromScheduledAt(apt.scheduledAt).dateKey;
    const todays = mine.filter((apt) => dated(apt) === today && apt.status !== 'cancelled').sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    const week = mine.filter((apt) => dated(apt) > today && dated(apt) <= weekEnd && ['confirmed', 'pending', 'rescheduled'].includes(apt.status));
    const reviews = db.where('reviews', (review) => review.doctorId === doctorId && review.status === 'approved').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      doctor: doctorSummary(doctor),
      metrics: {
        today: todays.length,
        completedToday: todays.filter((apt) => apt.status === 'completed').length,
        week: week.length,
        pending: mine.filter((apt) => apt.status === 'pending').length,
        rating: doctor.rating,
        reviewCount: doctor.reviewCount,
      },
      queue: todays.map(appointmentView),
      upcoming: week.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)).slice(0, 5).map(appointmentView),
      reviews: reviews.slice(0, 3).map(reviewView),
    };
  });
}

export function updateDoctorProfile(doctorId, patch) {
  if (!USE_MOCK_API) return http(`/doctors/${doctorId}`, { method: 'PATCH', body: patch });
  return mockRequest(() => doctorSummary(db.update('doctors', doctorId, patch)));
}

// ── Admin ─────────────────────────────────────────────────────────────────

export function getAdminDoctors({ q = '', status = 'all' } = {}) {
  if (!USE_MOCK_API) return http('/admin/doctors', { params: { q, status } });
  return mockRequest(() =>
    db
      .all('doctors')
      .filter((doc) => status === 'all' || doc.status === status)
      .filter((doc) => !q || `${doc.name} ${doc.specialization} ${doc.scfhsLicense}`.toLowerCase().includes(q.toLowerCase()))
      .map((doc) => ({ ...doctorSummary(doc), scfhsLicense: doc.scfhsLicense, clinicRole: doc.clinicRole })),
  );
}

export function setDoctorStatus(doctorId, status) {
  if (!USE_MOCK_API) return http(`/admin/doctors/${doctorId}/status`, { method: 'PATCH', body: { status } });
  return mockRequest(() => doctorSummary(db.update('doctors', doctorId, { status })));
}
