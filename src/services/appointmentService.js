import { USE_MOCK_API } from '@/constants/config';
import { UPCOMING_APPOINTMENT_STATUSES } from '@/constants/status';
import { fromScheduledAt, getMonthMatrix, toScheduledAt, todayKey } from '@/utils/date';
import { badRequest, conflict, forbidden, generateId, http, mockRequest, notFound, paginate } from './apiClient';
import { getDayStatus, getDoctorSlots, getMergedSlots, isSlotAvailable } from './mock/availability';
import { db } from './mock/mockDb';
import { appointmentView, isPublicClinic } from './mock/selectors';

/**
 * Appointments — availability, booking (FR-5), patient management (view /
 * cancel), clinic management (FR-6) and admin oversight.
 * REST endpoints (Phase 5): GET /availability, GET /availability/slots,
 * POST /appointments, GET /appointments/:id, PATCH /appointments/:id/status,
 * PATCH /appointments/:id/reschedule, GET /me/appointments,
 * GET /clinics/:id/appointments, GET /doctors/:id/appointments, GET /admin/appointments
 */

const nowIso = () => new Date().toISOString();

function serviceDoctors(clinicServiceId, doctorId) {
  const service = db.find('clinicServices', clinicServiceId);
  if (!service) throw notFound('Treatment');
  const ids = doctorId && doctorId !== 'any' ? [doctorId] : service.doctorIds;
  return { service, doctorIds: ids };
}

// ── Availability ──────────────────────────────────────────────────────────

/** Calendar month: [{ key, day, inMonth, status: 'available'|'full'|'closed' }]. */
export function getMonthAvailability({ clinicId, clinicServiceId, doctorId, year, month }) {
  if (!USE_MOCK_API) return http('/availability', { params: { clinicId, clinicServiceId, doctorId, year, month } });
  return mockRequest(
    () => {
      const { service, doctorIds } = serviceDoctors(clinicServiceId, doctorId);
      return getMonthMatrix(year, month).map((cell) => ({
        ...cell,
        status: cell.inMonth ? getDayStatus({ clinicId, doctorIds, dateKey: cell.key, durationMinutes: service.durationMinutes }) : 'closed',
      }));
    },
    { delay: 250 },
  );
}

/** Time slots for a date: [{ slot, status, doctorId }]. */
export function getSlots({ clinicId, clinicServiceId, doctorId, dateKey }) {
  if (!USE_MOCK_API) return http('/availability/slots', { params: { clinicId, clinicServiceId, doctorId, date: dateKey } });
  return mockRequest(
    () => {
      const { service, doctorIds } = serviceDoctors(clinicServiceId, doctorId);
      return getMergedSlots({ clinicId, doctorIds, dateKey, durationMinutes: service.durationMinutes });
    },
    { delay: 250 },
  );
}

// ── Booking (FR-5) ────────────────────────────────────────────────────────

/**
 * Creates an appointment. Business rules from the requirements:
 * - user must be logged in (enforced by the route + API auth guard),
 * - the time slot must still be available (double-booking prevention),
 * - idempotency_key prevents duplicate submissions,
 * - price_charged is locked at booking time.
 * Clinics with instant confirmation confirm immediately; others start Pending.
 */
export function createAppointment(payload) {
  if (!USE_MOCK_API) return http('/appointments', { method: 'POST', body: payload });
  return mockRequest(() => {
    const { userId, clinicId, clinicServiceId, doctorId, dateKey, slot, idempotencyKey } = payload;
    const existing = db.all('appointments').find((apt) => apt.idempotencyKey === idempotencyKey);
    if (existing) return appointmentView(existing);

    const clinic = db.find('clinics', clinicId);
    if (!isPublicClinic(clinic)) throw badRequest('This clinic is not accepting bookings right now.');
    const service = db.find('clinicServices', clinicServiceId);
    if (!service || !service.isAvailable || service.clinicId !== clinicId) throw badRequest('This treatment is no longer available.');
    if (dateKey < todayKey()) throw badRequest('Please choose a future date.');

    const candidates = doctorId && doctorId !== 'any' ? [doctorId] : service.doctorIds;
    const assignedDoctor = candidates.find((id) =>
      isSlotAvailable({ clinicId, doctorId: id, dateKey, slot, durationMinutes: service.durationMinutes }),
    );
    if (!assignedDoctor) throw conflict('Selected time slot is no longer available.');

    const vat = Math.round(service.priceMin * 0.15);
    const record = db.insert('appointments', {
      id: generateId('apt'),
      clinicId,
      clinicServiceId,
      treatmentId: service.treatmentId,
      userId,
      doctorId: assignedDoctor,
      scheduledAt: toScheduledAt(dateKey, slot),
      durationMinutes: service.durationMinutes,
      priceCharged: service.priceMin,
      vatAmount: vat,
      currency: 'SAR',
      status: clinic.features.instantConfirmation ? 'confirmed' : 'pending',
      idempotencyKey,
      patientNotes: payload.patientNotes ?? '',
      preferences: payload.preferences ?? { privateSuite: false, femaleStaff: false },
      paymentMethod: payload.paymentMethod ?? 'clinic',
      suite: payload.preferences?.privateSuite ? 'Private VIP Suite' : null,
      cancelledAt: null,
      createdAt: nowIso(),
    });
    db.insert('notifications', {
      id: generateId('ntf'),
      userId,
      type: 'appointment',
      title: record.status === 'confirmed' ? 'Appointment confirmed' : 'Request sent to clinic',
      body: `${service.shortTitle} at ${clinic.name}.`,
      link: `/patient/appointments/${record.id}`,
      read: false,
      createdAt: nowIso(),
    });
    return appointmentView(record);
  });
}

// ── Patient ───────────────────────────────────────────────────────────────

export function getPatientAppointments(userId, { scope = 'upcoming' } = {}) {
  if (!USE_MOCK_API) return http('/me/appointments', { params: { scope } });
  return mockRequest(() => {
    const now = nowIso();
    const mine = db.where('appointments', (apt) => apt.userId === userId);
    const scopes = {
      upcoming: (apt) => UPCOMING_APPOINTMENT_STATUSES.includes(apt.status) && apt.scheduledAt >= now,
      past: (apt) => ['completed', 'no_show'].includes(apt.status) || (apt.scheduledAt < now && !['cancelled'].includes(apt.status)),
      cancelled: (apt) => apt.status === 'cancelled',
      all: () => true,
    };
    const list = mine.filter(scopes[scope] ?? scopes.all);
    list.sort((a, b) => (scope === 'upcoming' ? a.scheduledAt.localeCompare(b.scheduledAt) : b.scheduledAt.localeCompare(a.scheduledAt)));
    return list.map(appointmentView);
  });
}

export function getAppointmentById(id, { userId } = {}) {
  if (!USE_MOCK_API) return http(`/appointments/${id}`);
  return mockRequest(() => {
    const appointment = db.find('appointments', id);
    if (!appointment) throw notFound('Appointment');
    if (userId && appointment.userId !== userId) throw forbidden('This appointment belongs to another account.');
    return appointmentView(appointment);
  });
}

export function cancelAppointment(id, { userId, reason = '' } = {}) {
  if (!USE_MOCK_API) return http(`/appointments/${id}/cancel`, { method: 'PATCH', body: { reason } });
  return mockRequest(() => {
    const appointment = db.find('appointments', id);
    if (!appointment) throw notFound('Appointment');
    if (userId && appointment.userId !== userId) throw forbidden();
    if (!UPCOMING_APPOINTMENT_STATUSES.includes(appointment.status)) throw badRequest('Only upcoming appointments can be cancelled.');
    // CHECK: cancelled_at is set iff status = cancelled.
    return appointmentView(db.update('appointments', id, { status: 'cancelled', cancelledAt: nowIso(), cancellationReason: reason }));
  });
}

export function rescheduleAppointment(id, { dateKey, slot, userId }) {
  if (!USE_MOCK_API) return http(`/appointments/${id}/reschedule`, { method: 'PATCH', body: { date: dateKey, slot } });
  return mockRequest(() => {
    const appointment = db.find('appointments', id);
    if (!appointment) throw notFound('Appointment');
    if (userId && appointment.userId !== userId) throw forbidden();
    const available = isSlotAvailable({
      clinicId: appointment.clinicId,
      doctorId: appointment.doctorId,
      dateKey,
      slot,
      durationMinutes: appointment.durationMinutes,
      ignoreAppointmentId: id,
    });
    if (!available) throw conflict('Selected time slot is no longer available.');
    return appointmentView(db.update('appointments', id, { scheduledAt: toScheduledAt(dateKey, slot), status: 'rescheduled' }));
  });
}

/** Slots for rescheduling an existing appointment with the same doctor. */
export function getRescheduleSlots(id, dateKey) {
  if (!USE_MOCK_API) return http(`/appointments/${id}/reschedule-slots`, { params: { date: dateKey } });
  return mockRequest(() => {
    const appointment = db.find('appointments', id);
    if (!appointment) throw notFound('Appointment');
    return getDoctorSlots({
      clinicId: appointment.clinicId,
      doctorId: appointment.doctorId,
      dateKey,
      durationMinutes: appointment.durationMinutes,
      ignoreAppointmentId: id,
    });
  }, { delay: 200 });
}

// ── Clinic & doctor management (FR-6) ─────────────────────────────────────

const TAB_FILTERS = {
  today: (apt, today) => fromScheduledAt(apt.scheduledAt).dateKey === today && apt.status !== 'cancelled',
  upcoming: (apt, today) => fromScheduledAt(apt.scheduledAt).dateKey > today && ['confirmed', 'rescheduled'].includes(apt.status),
  pending: (apt) => apt.status === 'pending',
  completed: (apt) => ['completed', 'no_show'].includes(apt.status),
  cancelled: (apt) => apt.status === 'cancelled',
  all: () => true,
};

function listFor(predicate, { tab = 'today', q = '', doctorId = 'all', page = 1, pageSize = 50 } = {}) {
  const today = todayKey();
  const needle = q.trim().toLowerCase();
  const items = db
    .where('appointments', predicate)
    .filter((apt) => (TAB_FILTERS[tab] ?? TAB_FILTERS.all)(apt, today))
    .filter((apt) => doctorId === 'all' || apt.doctorId === doctorId)
    .map(appointmentView)
    .filter((apt) => !needle || `${apt.patient?.name} ${apt.service?.title} ${apt.doctor?.name}`.toLowerCase().includes(needle))
    .sort((a, b) => (['completed', 'cancelled', 'all'].includes(tab) ? b.scheduledAt.localeCompare(a.scheduledAt) : a.scheduledAt.localeCompare(b.scheduledAt)));
  return paginate(items, { page, pageSize });
}

function tabCounts(predicate) {
  const today = todayKey();
  const scoped = db.where('appointments', predicate);
  return Object.fromEntries(Object.entries(TAB_FILTERS).map(([key, filter]) => [key, scoped.filter((apt) => filter(apt, today)).length]));
}

export function getClinicAppointments(clinicId, params = {}) {
  if (!USE_MOCK_API) return http(`/clinics/${clinicId}/appointments`, { params });
  return mockRequest(() => ({ ...listFor((apt) => apt.clinicId === clinicId, params), counts: tabCounts((apt) => apt.clinicId === clinicId) }));
}

export function getDoctorAppointments(doctorId, params = {}) {
  if (!USE_MOCK_API) return http(`/doctors/${doctorId}/appointments`, { params });
  return mockRequest(() => ({ ...listFor((apt) => apt.doctorId === doctorId, params), counts: tabCounts((apt) => apt.doctorId === doctorId) }));
}

/** Allowed state transitions (Appointment State Diagram). */
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled', 'rescheduled'],
  confirmed: ['checked_in', 'cancelled', 'no_show', 'rescheduled', 'completed'],
  rescheduled: ['confirmed', 'checked_in', 'cancelled', 'no_show'],
  checked_in: ['in_session', 'completed', 'no_show'],
  in_session: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function updateAppointmentStatus(id, status, { reason = '' } = {}) {
  if (!USE_MOCK_API) return http(`/appointments/${id}/status`, { method: 'PATCH', body: { status, reason } });
  return mockRequest(() => {
    const appointment = db.find('appointments', id);
    if (!appointment) throw notFound('Appointment');
    if (!TRANSITIONS[appointment.status]?.includes(status)) {
      throw badRequest(`An appointment that is ${appointment.status.replace('_', ' ')} cannot be moved to ${status.replace('_', ' ')}.`);
    }
    const patch = { status };
    if (status === 'cancelled') Object.assign(patch, { cancelledAt: nowIso(), cancellationReason: reason });
    const updated = db.update('appointments', id, patch);
    const labels = { confirmed: 'Appointment confirmed', cancelled: 'Appointment declined', rescheduled: 'New time proposed', completed: 'Visit completed — share your experience' };
    if (labels[status]) {
      db.insert('notifications', {
        id: generateId('ntf'),
        userId: appointment.userId,
        type: 'appointment',
        title: labels[status],
        body: reason || `${db.find('clinicServices', appointment.clinicServiceId)?.shortTitle ?? 'Your appointment'} at ${db.find('clinics', appointment.clinicId)?.name}.`,
        link: `/patient/appointments/${id}`,
        read: false,
        createdAt: nowIso(),
      });
    }
    return appointmentView(updated);
  });
}

export function proposeNewTime(id, { dateKey, slot }) {
  if (!USE_MOCK_API) return http(`/appointments/${id}/propose`, { method: 'PATCH', body: { date: dateKey, slot } });
  return rescheduleAppointment(id, { dateKey, slot });
}

// ── Admin ─────────────────────────────────────────────────────────────────

export function getAdminAppointments({ status = 'all', clinicId = 'all', q = '', page = 1, pageSize = 10 } = {}) {
  if (!USE_MOCK_API) return http('/admin/appointments', { params: { status, clinicId, q, page, pageSize } });
  return mockRequest(() => {
    const needle = q.trim().toLowerCase();
    const items = db
      .all('appointments')
      .filter((apt) => status === 'all' || apt.status === status)
      .filter((apt) => clinicId === 'all' || apt.clinicId === clinicId)
      .map(appointmentView)
      .filter((apt) => !needle || `${apt.patient?.name} ${apt.clinic?.name} ${apt.doctor?.name} ${apt.service?.title}`.toLowerCase().includes(needle))
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
    const counts = db.all('appointments').reduce((acc, apt) => ({ ...acc, [apt.status]: (acc[apt.status] ?? 0) + 1 }), {});
    return { ...paginate(items, { page, pageSize }), counts };
  });
}
