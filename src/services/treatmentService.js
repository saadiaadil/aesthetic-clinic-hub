import { USE_MOCK_API } from '@/constants/config';
import { badRequest, generateId, http, mockRequest, notFound, paginate } from './apiClient';
import { db } from './mock/mockDb';
import { clinicSummary, doctorSummary, getTreatment, isPublicClinic } from './mock/selectors';

/**
 * Treatments (global `services` catalog) and specialties.
 * REST endpoints (Phase 5): GET /treatments, GET /treatments/:id,
 * GET /specialties, GET /search/suggestions, POST/PATCH/DELETE /admin/treatments
 */

function publicOffers(treatmentId) {
  return db
    .where('clinicServices', (service) => service.treatmentId === treatmentId && service.isAvailable)
    .filter((service) => isPublicClinic(db.find('clinics', service.clinicId)));
}

function withStats(treatment) {
  const offers = publicOffers(treatment.id);
  return {
    ...treatment,
    clinicCount: new Set(offers.map((offer) => offer.clinicId)).size,
    priceFrom: offers.length ? Math.min(...offers.map((offer) => offer.priceMin)) : null,
    priceTo: offers.length ? Math.max(...offers.map((offer) => offer.priceMax)) : null,
  };
}

function matchesQuery(treatment, q) {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  return [treatment.name, treatment.shortDescription, ...(treatment.keywords ?? [])].some((text) =>
    text.toLowerCase().includes(needle),
  );
}

export function getSpecialties() {
  if (!USE_MOCK_API) return http('/specialties');
  return mockRequest(() =>
    db.all('specialties').map((specialty) => {
      const stats = db
        .where('treatments', (treatment) => treatment.specialtyId === specialty.id)
        .map(withStats)
        .filter((treatment) => treatment.clinicCount > 0);
      const clinicIds = new Set(stats.flatMap((treatment) => publicOffers(treatment.id).map((offer) => offer.clinicId)));
      return {
        ...specialty,
        treatmentCount: stats.length,
        clinicCount: clinicIds.size,
        priceFrom: stats.length ? Math.min(...stats.map((treatment) => treatment.priceFrom)) : null,
      };
    }),
  );
}

export function getTreatments({ q = '', specialty = 'all', sort = 'popular', page = 1, pageSize = 9 } = {}) {
  if (!USE_MOCK_API) return http('/treatments', { params: { q, specialty, sort, page, pageSize } });
  return mockRequest(() => {
    let items = db
      .all('treatments')
      .filter((treatment) => specialty === 'all' || treatment.specialtyId === specialty)
      .filter((treatment) => matchesQuery(treatment, q))
      .map(withStats);

    const sorters = {
      popular: (a, b) => Number(b.popular) - Number(a.popular) || b.clinicCount - a.clinicCount,
      'price-asc': (a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity),
      'price-desc': (a, b) => (b.priceFrom ?? 0) - (a.priceFrom ?? 0),
      name: (a, b) => a.name.localeCompare(b.name),
    };
    items = [...items].sort(sorters[sort] ?? sorters.popular);
    return paginate(items, { page, pageSize });
  });
}

export function getPopularTreatments(limit = 6) {
  if (!USE_MOCK_API) return http('/treatments', { params: { popular: true, limit } });
  return mockRequest(() =>
    db
      .all('treatments')
      .filter((treatment) => treatment.popular)
      .map(withStats)
      .slice(0, limit),
  );
}

/** Treatment detail + price comparison across verified clinics (Comparison & Decision Support). */
export function getTreatmentById(id) {
  if (!USE_MOCK_API) return http(`/treatments/${id}`);
  return mockRequest(() => {
    const treatment = getTreatment(id);
    if (!treatment) throw notFound('Treatment');
    const specialty = db.find('specialties', treatment.specialtyId);
    const offers = publicOffers(id)
      .map((offer) => {
        const clinic = db.find('clinics', offer.clinicId);
        const doctors = offer.doctorIds.map((doctorId) => doctorSummary(db.find('doctors', doctorId))).filter(Boolean);
        return { ...offer, clinic: clinicSummary(clinic), doctors };
      })
      .sort((a, b) => a.priceMin - b.priceMin);
    const related = db
      .where('treatments', (item) => item.specialtyId === treatment.specialtyId && item.id !== id)
      .map(withStats)
      .slice(0, 3);
    return { ...withStats(treatment), specialty, offers, related };
  });
}

/** Autocomplete for the header search and the hero search module. */
export function getSearchSuggestions(q = '') {
  if (!USE_MOCK_API) return http('/search/suggestions', { params: { q } });
  return mockRequest(
    () => {
      const needle = q.trim().toLowerCase();
      const treatments = db
        .all('treatments')
        .filter((treatment) => (needle ? matchesQuery(treatment, needle) : treatment.popular))
        .map(withStats)
        .filter((treatment) => treatment.clinicCount > 0)
        .slice(0, needle ? 5 : 4)
        .map(({ id, name, clinicCount, specialtyId }) => ({ id, name, clinicCount, specialtyId }));
      const clinics = needle
        ? db
            .all('clinics')
            .filter(isPublicClinic)
            .filter((clinic) => clinic.name.toLowerCase().includes(needle) || clinic.districtLabel.toLowerCase().includes(needle))
            .slice(0, 3)
            .map(({ id, name, districtLabel }) => ({ id, name, districtLabel }))
        : [];
      return { treatments, clinics };
    },
    { delay: 120 },
  );
}

// ── Admin: global service catalog (FR-9) ──────────────────────────────────

export function getAdminTreatments({ q = '', specialty = 'all' } = {}) {
  if (!USE_MOCK_API) return http('/admin/treatments', { params: { q, specialty } });
  return mockRequest(() =>
    db
      .all('treatments')
      .filter((treatment) => specialty === 'all' || treatment.specialtyId === specialty)
      .filter((treatment) => matchesQuery(treatment, q))
      .map((treatment) => ({
        ...withStats(treatment),
        listingCount: db.where('clinicServices', (service) => service.treatmentId === treatment.id).length,
      })),
  );
}

export function saveTreatment(data) {
  if (!USE_MOCK_API) {
    return data.id ? http(`/admin/treatments/${data.id}`, { method: 'PATCH', body: data }) : http('/admin/treatments', { method: 'POST', body: data });
  }
  return mockRequest(() => {
    // Omitted optional fields keep their stored (or default) values.
    const values = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
    const duplicate = db.all('treatments').find((item) => item.name.toLowerCase() === values.name.trim().toLowerCase() && item.id !== values.id);
    if (duplicate) throw badRequest('A treatment with this name already exists.', { name: 'Treatment names must be unique.' });
    const specialty = db.find('specialties', values.specialtyId);
    if (values.id) return db.update('treatments', values.id, { ...values, category: specialty?.category ?? 'OTHER' });
    return db.insert('treatments', {
      id: generateId('trt'),
      keywords: [],
      bestFor: [],
      popular: false,
      image: specialty?.image ?? null,
      downtime: 'Varies',
      resultsIn: 'Varies',
      longevity: 'Varies',
      sessions: 'As advised',
      anesthesia: 'As advised',
      ...values,
      category: specialty?.category ?? 'OTHER',
    });
  });
}

export function deleteTreatment(id) {
  if (!USE_MOCK_API) return http(`/admin/treatments/${id}`, { method: 'DELETE' });
  return mockRequest(() => {
    const listings = db.where('clinicServices', (service) => service.treatmentId === id).length;
    // services.id is referenced ON DELETE RESTRICT by clinic_service.
    if (listings > 0) throw badRequest(`This treatment is listed by ${listings} clinic${listings > 1 ? 's' : ''} and cannot be deleted.`);
    db.remove('treatments', id);
    return { id };
  });
}
