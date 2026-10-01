import { images } from '@/assets/images';
import { USE_MOCK_API } from '@/constants/config';
import { AMENITIES } from '@/data/clinics';
import { PRICE_RANGES } from '@/data/content';
import { addDays, dayOfWeek, fromScheduledAt, slotToMinutes, todayKey } from '@/utils/date';
import { badRequest, conflict, generateId, http, mockRequest, notFound, paginate } from './apiClient';
import { getDoctorSlots } from './mock/availability';
import { db } from './mock/mockDb';
import {
  appointmentView,
  clinicServiceView,
  clinicSummary,
  doctorSummary,
  getNextAvailable,
  isPublicClinic,
  reviewView,
} from './mock/selectors';

/**
 * Clinics — discovery (FR-4), profiles, clinic portal operations (FR-6) and
 * registration/approval (FR-3).
 * REST endpoints (Phase 5): GET /clinics, GET /clinics/:id,
 * GET /clinics/:id/dashboard, PATCH /clinics/:id, POST /clinics/register,
 * GET|POST|PATCH|DELETE /clinics/:id/services, PATCH /admin/clinics/:id/status
 */

function matchesText(clinic, q) {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  const serviceText = db
    .where('clinicServices', (service) => service.clinicId === clinic.id)
    .map((service) => `${service.title} ${db.find('treatments', service.treatmentId)?.name ?? ''}`)
    .join(' ');
  return [clinic.name, clinic.districtLabel, clinic.category, clinic.shortDescription, ...clinic.signatureTreatments, serviceText]
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

// ── Public discovery ──────────────────────────────────────────────────────

export function searchClinics({
  q = '',
  district = 'all',
  specialty = 'all',
  treatment = '',
  price = 'all',
  minRating = 0,
  features = [],
  instantOnly = false,
  availability = 'any',
  sort = 'recommended',
  page = 1,
  pageSize = 6,
} = {}) {
  if (!USE_MOCK_API) {
    return http('/clinics', { params: { q, district, specialty, treatment, price, minRating, features, instantOnly, availability, sort, page, pageSize } });
  }
  return mockRequest(() => {
    const priceRange = PRICE_RANGES.find((range) => range.id === price) ?? PRICE_RANGES[0];
    let items = db
      .all('clinics')
      // FR-3 business rule: only approved clinics can appear in search.
      .filter(isPublicClinic)
      .filter((clinic) => district === 'all' || clinic.districtId === district)
      .filter((clinic) => matchesText(clinic, q))
      .filter((clinic) => clinic.startingPrice >= priceRange.min && clinic.startingPrice <= priceRange.max)
      .filter((clinic) => clinic.rating >= Number(minRating || 0))
      .filter((clinic) => features.every((feature) => clinic.features[feature]))
      .filter((clinic) => !instantOnly || clinic.features.instantConfirmation)
      .map((clinic) => clinicSummary(clinic))
      .filter((clinic) => specialty === 'all' || clinic.specialtyIds.includes(specialty))
      .filter((clinic) => !treatment || clinic.treatmentIds.includes(treatment))
      .filter((clinic) => {
        if (availability === 'any' || !clinic.nextAvailable) return availability === 'any';
        if (availability === 'soon') return clinic.nextAvailable.dayOffset <= 1;
        if (availability === 'week') return clinic.nextAvailable.dayOffset <= 7;
        if (availability === 'weekend') return clinic.features.weekend;
        return true;
      });

    const sorters = {
      recommended: (a, b) => b.rating * Math.log10(b.reviewCount + 10) - a.rating * Math.log10(a.reviewCount + 10),
      rating: (a, b) => b.rating - a.rating,
      price: (a, b) => a.startingPrice - b.startingPrice,
      reviews: (a, b) => b.reviewCount - a.reviewCount,
    };
    items = [...items].sort(sorters[sort] ?? sorters.recommended);
    return paginate(items, { page, pageSize });
  });
}

/** Alias kept for readability in components that list without filters. */
export const getClinics = (params) => searchClinics(params);

export function getFeaturedClinics(limit = 3) {
  if (!USE_MOCK_API) return http('/clinics/featured', { params: { limit } });
  return mockRequest(() =>
    ['dermaart', 'laura-skin', 'elysian']
      .map((id) => db.find('clinics', id))
      .filter(isPublicClinic)
      .slice(0, limit)
      .map((clinic) => clinicSummary(clinic, { withNextSlot: false })),
  );
}

export function getClinicById(id, { includeUnverified = false } = {}) {
  if (!USE_MOCK_API) return http(`/clinics/${id}`);
  return mockRequest(() => {
    const clinic = db.find('clinics', id);
    if (!clinic || (!includeUnverified && !isPublicClinic(clinic))) throw notFound('Clinic');
    const services = db
      .where('clinicServices', (service) => service.clinicId === id && service.isAvailable)
      .map(clinicServiceView);
    const doctors = db
      .where('doctors', (doc) => doc.clinicIds.includes(id) && doc.status === 'active')
      .map(doctorSummary);
    const reviews = db
      .where('reviews', (review) => review.clinicId === id && review.status === 'approved')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(reviewView);
    return {
      ...clinicSummary(clinic),
      ...clinic,
      amenityDetails: clinic.amenities.map((key) => ({ id: key, ...AMENITIES[key] })).filter((item) => item.label),
      services,
      doctors,
      reviews,
      nextAvailable: getNextAvailable(id),
    };
  });
}

export function getClinicServices(clinicId, { includeUnavailable = false } = {}) {
  if (!USE_MOCK_API) return http(`/clinics/${clinicId}/services`, { params: { includeUnavailable } });
  return mockRequest(() =>
    db
      .where('clinicServices', (service) => service.clinicId === clinicId && (includeUnavailable || service.isAvailable))
      .map((service) => ({
        ...clinicServiceView(service),
        doctors: service.doctorIds.map((doctorId) => doctorSummary(db.find('doctors', doctorId))).filter(Boolean),
      })),
  );
}

// ── Clinic portal ─────────────────────────────────────────────────────────

function hash(text) {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) value = (value * 33 + text.charCodeAt(i)) >>> 0;
  return value;
}

/** Stitch "Weekly Suite Capacity & Category Utilization" heatmap. */
function buildUtilization(clinic) {
  const days = [];
  let cursor = todayKey();
  while (days.length < 6) {
    if (!clinic.openingHours.closedDays.includes(dayOfWeek(cursor))) days.unshift(cursor);
    cursor = addDays(cursor, -1);
  }
  const clinicAppointments = db.where('appointments', (apt) => apt.clinicId === clinic.id && apt.status !== 'cancelled');
  const rows = clinic.suites.map((suite) => ({
    suite,
    values: days.map((dateKey) => {
      const booked = clinicAppointments.filter((apt) => apt.suite === suite && fromScheduledAt(apt.scheduledAt).dateKey === dateKey).length;
      const base = 58 + (hash(`${suite}|${dateKey}`) % 38);
      return Math.min(100, base + booked * 6);
    }),
  }));
  const peak = rows.reduce((best, row) => {
    const average = row.values.reduce((sum, value) => sum + value, 0) / row.values.length;
    return average > best.average ? { suite: row.suite, average } : best;
  }, { suite: null, average: 0 });
  return { days, rows, insight: peak.suite ? `${peak.suite} averages ${Math.round(peak.average)}% capacity this week.` : '' };
}

export function getClinicDashboard(clinicId) {
  if (!USE_MOCK_API) return http(`/clinics/${clinicId}/dashboard`);
  return mockRequest(() => {
    const clinic = db.find('clinics', clinicId);
    if (!clinic) throw notFound('Clinic');
    const today = todayKey();
    const yesterday = addDays(today, -1);
    const all = db.where('appointments', (apt) => apt.clinicId === clinicId);
    const onDate = (dateKey) => all.filter((apt) => fromScheduledAt(apt.scheduledAt).dateKey === dateKey && apt.status !== 'cancelled');
    const todays = onDate(today).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    const revenue = (list) => list.reduce((sum, apt) => sum + apt.priceCharged, 0);

    const doctors = db.where('doctors', (doc) => doc.clinicIds.includes(clinicId) && doc.status === 'active');
    const workingToday = doctors.filter((doc) => getDoctorSlots({ clinicId, doctorId: doc.id, dateKey: today }).length > 0);
    const bookedMinutes = todays.reduce((sum, apt) => sum + apt.durationMinutes, 0);
    const capacityMinutes = Math.max(1, workingToday.length * 8 * 60);

    const reviews = db
      .where('reviews', (review) => review.clinicId === clinicId && review.status === 'approved')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const nowMinutes = ((new Date().getUTCHours() + 3) % 24) * 60 + new Date().getUTCMinutes();
    const specialists = doctors.map((doc) => {
      const session = todays.find((apt) => apt.doctorId === doc.id && apt.status === 'in_session');
      const next = todays.find(
        (apt) => apt.doctorId === doc.id && ['confirmed', 'checked_in'].includes(apt.status) && slotToMinutes(fromScheduledAt(apt.scheduledAt).slot) >= nowMinutes,
      );
      const works = workingToday.some((item) => item.id === doc.id);
      let state = { tone: 'outline', label: 'Off today', action: 'Open' };
      if (session) state = { tone: 'primary', label: `In Session (${(session.suite ?? 'Suite').split(' (')[0]})`, action: 'Queue' };
      else if (next) {
        const minutes = slotToMinutes(fromScheduledAt(next.scheduledAt).slot) - nowMinutes;
        state = { tone: 'secondary', label: minutes > 0 ? `Available (Next in ${minutes >= 60 ? `${Math.round(minutes / 60)}h` : `${minutes}m`})` : 'Patient waiting', action: 'Manage' };
      } else if (works) state = { tone: 'secondary', label: 'Available for walk-ins', action: 'Manage' };
      return { ...doctorSummary(doc), state };
    });

    return {
      clinic: clinicSummary(clinic, { withNextSlot: false }),
      date: today,
      metrics: {
        todaysAppointments: {
          total: todays.length,
          confirmed: todays.filter((apt) => ['confirmed', 'rescheduled'].includes(apt.status)).length,
          active: todays.filter((apt) => ['checked_in', 'in_session'].includes(apt.status)).length,
          done: todays.filter((apt) => apt.status === 'completed').length,
        },
        revenue: { today: revenue(todays), yesterday: revenue(onDate(yesterday)) },
        occupancy: { percent: Math.min(100, Math.round((bookedMinutes / capacityMinutes) * 100)), activeDoctors: workingToday.length, totalDoctors: doctors.length },
        satisfaction: { rating: clinic.rating, newReviews: reviews.filter((review) => review.createdAt >= weekAgo).length },
      },
      queue: todays.map(appointmentView),
      incoming: all
        .filter((apt) => apt.status === 'pending')
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
        .map(appointmentView),
      specialists,
      reviews: reviews.slice(0, 3).map(reviewView),
      utilization: buildUtilization(clinic),
      nextAvailable: getNextAvailable(clinicId),
    };
  });
}

export function updateClinicProfile(clinicId, patch) {
  if (!USE_MOCK_API) return http(`/clinics/${clinicId}`, { method: 'PATCH', body: patch });
  return mockRequest(() => {
    if (!db.find('clinics', clinicId)) throw notFound('Clinic');
    return db.update('clinics', clinicId, patch);
  });
}

export function saveClinicService(clinicId, data) {
  if (!USE_MOCK_API) {
    return data.id
      ? http(`/clinics/${clinicId}/services/${data.id}`, { method: 'PATCH', body: data })
      : http(`/clinics/${clinicId}/services`, { method: 'POST', body: data });
  }
  return mockRequest(() => {
    // UNIQUE(clinic_id, service_id): one listing per clinic per treatment.
    const duplicate = db
      .all('clinicServices')
      .find((service) => service.clinicId === clinicId && service.treatmentId === data.treatmentId && service.id !== data.id);
    if (duplicate) throw conflict('This treatment is already on your menu. Edit the existing listing instead.');
    if (Number(data.priceMax) < Number(data.priceMin)) throw badRequest('Maximum price must be greater than or equal to the minimum price.');

    const record = {
      ...data,
      clinicId,
      priceMin: Number(data.priceMin),
      priceMax: Number(data.priceMax || data.priceMin),
      durationMinutes: Number(data.durationMinutes),
      shortTitle: data.shortTitle || data.title,
    };
    if (data.id) return clinicServiceView(db.update('clinicServices', data.id, record));
    return clinicServiceView(
      db.insert('clinicServices', {
        id: generateId('cs'),
        highlights: [
          { icon: 'timer', label: `${record.durationMinutes} mins` },
          { icon: 'zap', label: 'Doctor Performed' },
        ],
        doctorIds: [],
        isAvailable: true,
        currency: 'SAR',
        ...record,
      }),
    );
  });
}

export function deleteClinicService(serviceId) {
  if (!USE_MOCK_API) return http(`/clinic-services/${serviceId}`, { method: 'DELETE' });
  return mockRequest(() => {
    const upcoming = db.where(
      'appointments',
      (apt) => apt.clinicServiceId === serviceId && ['pending', 'confirmed', 'rescheduled'].includes(apt.status),
    ).length;
    if (upcoming > 0) throw conflict(`This treatment has ${upcoming} upcoming booking${upcoming > 1 ? 's' : ''}. Pause it instead of deleting.`);
    db.remove('clinicServices', serviceId);
    return { id: serviceId };
  });
}

export function setClinicServiceAvailability(serviceId, isAvailable) {
  if (!USE_MOCK_API) return http(`/clinic-services/${serviceId}`, { method: 'PATCH', body: { isAvailable } });
  return mockRequest(() => clinicServiceView(db.update('clinicServices', serviceId, { isAvailable })));
}

// ── Registration & verification (FR-3) ───────────────────────────────────

export function registerClinic(data) {
  if (!USE_MOCK_API) return http('/clinics/register', { method: 'POST', body: data });
  return mockRequest(() => {
    const email = data.email.trim().toLowerCase();
    if (db.all('users').some((user) => user.email?.toLowerCase() === email)) {
      throw badRequest('An account with this email already exists.', { email: 'This email is already registered.' });
    }
    if (db.all('clinics').some((clinic) => clinic.licenseNumber.toLowerCase() === data.mohLicense.trim().toLowerCase())) {
      throw badRequest('This MOH license is already registered on the platform.', { mohLicense: 'License number must be unique.' });
    }
    const clinicId = generateId('clinic');
    const ownerId = generateId('usr');
    const now = new Date().toISOString();
    db.insert('users', {
      id: ownerId,
      name: data.directorName,
      email,
      phone: data.mobile,
      password: data.password,
      role: 'clinic',
      clinicId,
      jobTitle: 'Medical Director',
      status: 'active',
      avatar: null,
      createdAt: now,
      lastLoginAt: now,
    });
    const clinic = db.insert('clinics', {
      id: clinicId,
      name: data.nameEn,
      nameAr: data.nameAr,
      category: data.specialtyLabel,
      shortDescription: `${data.specialtyLabel} clinic in ${data.districtName}, Riyadh.`,
      description: `${data.nameEn} is a ${data.specialtyLabel.toLowerCase()} clinic in ${data.districtName}, Riyadh, licensed by the Saudi Ministry of Health.`,
      philosophyTitle: `About ${data.nameEn}`,
      standards: [],
      districtId: data.district,
      districtLabel: data.districtName,
      address: data.address,
      latitude: 24.7136,
      longitude: 46.6753,
      travelNote: '',
      contactNo: data.mobile,
      whatsapp: data.mobile.replace('+', ''),
      licenseNumber: data.mohLicense.trim(),
      crNumber: data.crNumber,
      scfhsLicense: data.scfhsLicense,
      verificationStatus: 'pending',
      verifiedAt: null,
      ownerId,
      rating: 0,
      reviewCount: 0,
      ratingBreakdown: { cleanliness: 0, consultation: 0, results: 0, punctuality: 0 },
      teamSize: 1,
      teamLabel: 'Doctors',
      startingPrice: 500,
      highlightBadge: null,
      signatureTreatments: [],
      tags: [data.specialtyLabel],
      amenities: data.amenities,
      features: {
        mohLicensed: true,
        vipLounge: data.amenities.includes('privateLounges'),
        valet: data.amenities.includes('valet'),
        femaleDermatologists: data.amenities.includes('femaleWing'),
        weekend: false,
        instantConfirmation: false,
      },
      languages: ['Arabic', 'English'],
      openingHours: { open: '10:00', close: '22:00', closedDays: [5] },
      suites: ['Suite 1'],
      // Branded placeholder until the clinic uploads its own photography.
      coverImage: images.clinics.newClinicPlaceholder,
      gallery: [],
      featuredImage: null,
      documents: data.documents,
      submittedAt: now,
      createdAt: now,
    });
    return { clinicId: clinic.id, status: clinic.verificationStatus };
  });
}

export function getAdminClinics({ status = 'all', q = '' } = {}) {
  if (!USE_MOCK_API) return http('/admin/clinics', { params: { status, q } });
  return mockRequest(() =>
    db
      .all('clinics')
      .filter((clinic) => status === 'all' || clinic.verificationStatus === status)
      .filter((clinic) => !q || `${clinic.name} ${clinic.licenseNumber} ${clinic.districtLabel}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt))
      .map((clinic) => {
        const owner = db.find('users', clinic.ownerId);
        return {
          ...clinicSummary(clinic, { withNextSlot: false }),
          crNumber: clinic.crNumber,
          contactNo: clinic.contactNo,
          documents: clinic.documents ?? [],
          submittedAt: clinic.submittedAt ?? clinic.createdAt,
          verifiedAt: clinic.verifiedAt,
          rejectionReason: clinic.rejectionReason ?? null,
          owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
        };
      }),
  );
}

/** Admin verification decision: verified | rejected | suspended | pending. */
export function setClinicStatus(clinicId, { status, reason = '', adminId }) {
  if (!USE_MOCK_API) return http(`/admin/clinics/${clinicId}/status`, { method: 'PATCH', body: { status, reason } });
  return mockRequest(() => {
    const clinic = db.find('clinics', clinicId);
    if (!clinic) throw notFound('Clinic');
    // Paired CHECK: verified_at and verified_by_admin_id are both set or both null.
    const verification = status === 'verified' ? { verifiedAt: new Date().toISOString(), verifiedByAdminId: adminId } : { verifiedAt: null, verifiedByAdminId: null };
    return db.update('clinics', clinicId, { verificationStatus: status, rejectionReason: status === 'rejected' ? reason : null, ...verification });
  });
}
