import { clinicServices } from './clinicServices';
import { relativeScheduledAt } from '@/utils/date';

/**
 * Appointments (`appointments` table). Dates are generated relative to
 * "today" so the Stitch dashboard queue ("Today's (18)", incoming requests,
 * upcoming visits) always looks current when the app runs.
 *
 * price_charged is locked at booking time from the clinic service price;
 * idempotency_key mirrors the API-level double-submit guard.
 */

function appointment({ id, clinicServiceId, day, slot, createdDaysBefore = 6, ...rest }) {
  const service = clinicServices.find((item) => item.id === clinicServiceId);
  const scheduledAt = relativeScheduledAt(day, slot);
  const createdAt = new Date(new Date(scheduledAt).getTime() - createdDaysBefore * 86400000).toISOString();
  return {
    id,
    clinicId: service.clinicId,
    clinicServiceId,
    treatmentId: service.treatmentId,
    scheduledAt,
    durationMinutes: service.durationMinutes,
    priceCharged: service.priceMin,
    currency: 'SAR',
    status: 'confirmed',
    idempotencyKey: `idem-${id}`,
    patientNotes: '',
    preferences: { privateSuite: false, femaleStaff: false },
    paymentMethod: 'clinic',
    suite: null,
    cancelledAt: null,
    createdAt,
    ...rest,
  };
}

export const appointments = [
  // ── DermaArt — today’s queue (Stitch clinic dashboard) ──────────────────
  appointment({ id: 'apt-1001', clinicServiceId: 'cs-dermaart-morpheus8', userId: 'usr-nouf-al-bader', doctorId: 'doc-tariq-al-khatib', day: 0, slot: '10:00', status: 'completed', suite: 'Suite 2 (Laser Suite)', patientNotes: 'Full face & neck. Second session of three.' }),
  appointment({ id: 'apt-1002', clinicServiceId: 'cs-dermaart-hydrafacial', userId: 'usr-reema-al-harbi', doctorId: 'doc-mona-al-husseini', day: 0, slot: '11:30', status: 'in_session', suite: 'Suite 1 (Hydra Lounge)', patientNotes: 'Monthly maintenance. Prefers the brightening booster.' }),
  appointment({ id: 'apt-1003', clinicServiceId: 'cs-dermaart-baby-botox', userId: 'usr-hessa-al-otaibi', doctorId: 'doc-reem-al-saud', day: 0, slot: '14:00', status: 'checked_in', suite: 'Suite 3 (Executive Chamber)', preferences: { privateSuite: true, femaleStaff: true }, patientNotes: 'Upper face & glabella. Arrives via private garage entrance.' }),
  appointment({ id: 'apt-1004', clinicServiceId: 'cs-dermaart-profhilo', userId: 'usr-sarah-al-ghamdi', doctorId: 'doc-reem-al-saud', day: 0, slot: '16:30', status: 'confirmed', suite: 'Suite 3 (Executive Chamber)', priceCharged: 2800, patientNotes: 'Profhilo Bioremodeling (2 syringes). First visit to DermaArt.' }),
  appointment({ id: 'apt-1005', clinicServiceId: 'cs-dermaart-lips', userId: 'usr-munira-al-khaldi', doctorId: 'doc-lama-al-mutawa', day: 0, slot: '18:00', status: 'confirmed', suite: 'Suite 3 (Executive Chamber)' }),
  appointment({ id: 'apt-1006', clinicServiceId: 'cs-dermaart-laser-hair', userId: 'usr-fahad-al-anazi', doctorId: 'doc-mona-al-husseini', day: 0, slot: '17:30', status: 'confirmed', suite: 'Suite 4 (Laser Rejuv)' }),

  appointment({ id: 'apt-1030', clinicServiceId: 'cs-dermaart-botox', userId: 'usr-bander-al-otaibi', doctorId: 'doc-reem-al-saud', day: 0, slot: '10:00', status: 'completed', suite: 'Suite 3 (Executive Chamber)' }),
  appointment({ id: 'apt-1031', clinicServiceId: 'cs-dermaart-baby-botox', userId: 'usr-sultan-al-ghamdi', doctorId: 'doc-reem-al-saud', day: 0, slot: '11:30', status: 'completed', suite: 'Suite 3 (Executive Chamber)' }),
  appointment({ id: 'apt-1032', clinicServiceId: 'cs-dermaart-sculptra', userId: 'usr-danah-al-dosari', doctorId: 'doc-tariq-al-khatib', day: 0, slot: '12:15', status: 'completed', suite: 'Suite 3 (Executive Chamber)' }),
  appointment({ id: 'apt-1033', clinicServiceId: 'cs-dermaart-hydrafacial', userId: 'usr-loulwa-al-saud', doctorId: 'doc-mona-al-husseini', day: 0, slot: '13:00', status: 'completed', suite: 'Suite 1 (Hydra Lounge)' }),
  appointment({ id: 'apt-1034', clinicServiceId: 'cs-dermaart-emsculpt', userId: 'usr-reema-al-harbi', doctorId: 'doc-sara-al-otaibi', day: 0, slot: '14:00', status: 'confirmed', suite: 'Suite 4 (Laser Rejuv)' }),
  appointment({ id: 'apt-1035', clinicServiceId: 'cs-dermaart-morpheus8', userId: 'usr-nouf-al-husseini', doctorId: 'doc-tariq-al-khatib', day: 0, slot: '15:30', status: 'confirmed', suite: 'Suite 2 (Laser Suite)' }),
  appointment({ id: 'apt-1036', clinicServiceId: 'cs-dermaart-profhilo', userId: 'usr-hanan-al-mutairi', doctorId: 'doc-reem-al-saud', day: 0, slot: '19:15', status: 'confirmed', suite: 'Suite 3 (Executive Chamber)' }),
  appointment({ id: 'apt-1037', clinicServiceId: 'cs-dermaart-lips', userId: 'usr-loulwa-al-saud', doctorId: 'doc-lama-al-mutawa', day: 0, slot: '20:30', status: 'confirmed', suite: 'Suite 3 (Executive Chamber)' }),

  // ── DermaArt — yesterday (revenue comparison, reviewable visits) ────────
  ...[
    ['apt-1040', 'cs-dermaart-botox', 'usr-bander-al-otaibi', 'doc-reem-al-saud', '10:00'],
    ['apt-1041', 'cs-dermaart-bbl', 'usr-danah-al-dosari', 'doc-mona-al-husseini', '10:00'],
    ['apt-1042', 'cs-dermaart-sculptra', 'usr-lulwa-al-kabeer', 'doc-tariq-al-khatib', '12:15'],
    ['apt-1043', 'cs-dermaart-morpheus8', 'usr-sultan-al-ghamdi', 'doc-mona-al-husseini', '13:00'],
    ['apt-1044', 'cs-dermaart-profhilo', 'usr-nouf-al-bader', 'doc-reem-al-saud', '14:00'],
    ['apt-1045', 'cs-dermaart-emsculpt', 'usr-reema-al-harbi', 'doc-sara-al-otaibi', '15:30'],
    ['apt-1046', 'cs-dermaart-lips', 'usr-hessa-al-otaibi', 'doc-lama-al-mutawa', '16:45'],
    ['apt-1047', 'cs-dermaart-hydrafacial', 'usr-loulwa-al-saud', 'doc-mona-al-husseini', '17:30'],
    ['apt-1048', 'cs-dermaart-laser-hair', 'usr-majed-al-mutairi', 'doc-mona-al-husseini', '18:00'],
    ['apt-1049', 'cs-dermaart-profhilo', 'usr-nouf-al-husseini', 'doc-reem-al-saud', '20:30'],
    ['apt-1050', 'cs-dermaart-bbl', 'usr-fahad-al-anazi', 'doc-mona-al-husseini', '11:30'],
  ].map(([id, clinicServiceId, userId, doctorId, slot]) =>
    appointment({ id, clinicServiceId, userId, doctorId, day: -1, slot, status: 'completed', suite: 'Suite 3 (Executive Chamber)' }),
  ),

  // ── DermaArt — incoming requests awaiting approval (FR-6) ───────────────
  appointment({ id: 'apt-1010', clinicServiceId: 'cs-dermaart-sculptra', userId: 'usr-lulwa-al-kabeer', doctorId: 'doc-reem-al-saud', day: 1, slot: '11:00', status: 'pending', createdDaysBefore: 1, preferences: { privateSuite: true, femaleStaff: true }, patientNotes: 'Prefers Suite 3 • Requested Specialist: Dr. Reem' }),
  appointment({ id: 'apt-1011', clinicServiceId: 'cs-dermaart-bbl', userId: 'usr-danah-al-dosari', doctorId: 'doc-mona-al-husseini', day: 2, slot: '14:30', status: 'pending', createdDaysBefore: 1, patientNotes: 'First-time consultation intake completed online' }),
  appointment({ id: 'apt-1012', clinicServiceId: 'cs-dermaart-laser-hair', userId: 'usr-majed-al-mutairi', doctorId: 'doc-mona-al-husseini', day: 3, slot: '17:00', status: 'pending', createdDaysBefore: 0, patientNotes: 'Laser Hair Reduction (GentleMax Pro) — full back.' }),

  // ── DermaArt — upcoming confirmed ───────────────────────────────────────
  appointment({ id: 'apt-1013', clinicServiceId: 'cs-dermaart-profhilo', userId: 'usr-hanan-al-mutairi', doctorId: 'doc-reem-al-saud', day: 1, slot: '19:15', status: 'confirmed', suite: 'Suite 3 (Executive Chamber)' }),
  appointment({ id: 'apt-1014', clinicServiceId: 'cs-dermaart-morpheus8', userId: 'usr-sultan-al-ghamdi', doctorId: 'doc-mona-al-husseini', day: 4, slot: '16:45', status: 'confirmed', suite: 'Suite 2 (Laser Suite)' }),
  appointment({ id: 'apt-1015', clinicServiceId: 'cs-dermaart-botox', userId: 'usr-nouf-al-bader', doctorId: 'doc-reem-al-saud', day: 1, slot: '12:15', status: 'confirmed', suite: 'Suite 3 (Executive Chamber)' }),
  appointment({ id: 'apt-1016', clinicServiceId: 'cs-dermaart-sculptra', userId: 'usr-sarah-al-ghamdi', doctorId: 'doc-tariq-al-khatib', day: 2, slot: '17:30', status: 'rescheduled', suite: 'Suite 3 (Executive Chamber)' }),

  // ── DermaArt — history (reviews reference these visits) ────────────────
  appointment({ id: 'apt-1020', clinicServiceId: 'cs-dermaart-lips', userId: 'usr-nouf-al-husseini', doctorId: 'doc-lama-al-mutawa', day: -25, slot: '18:00', status: 'completed' }),
  appointment({ id: 'apt-1021', clinicServiceId: 'cs-dermaart-botox', userId: 'usr-hanan-al-mutairi', doctorId: 'doc-reem-al-saud', day: -14, slot: '16:30', status: 'completed' }),
  appointment({ id: 'apt-1022', clinicServiceId: 'cs-dermaart-morpheus8', userId: 'usr-sultan-al-ghamdi', doctorId: 'doc-mona-al-husseini', day: -30, slot: '15:30', status: 'completed' }),
  appointment({ id: 'apt-1023', clinicServiceId: 'cs-dermaart-baby-botox', userId: 'usr-munira-al-khaldi', doctorId: 'doc-reem-al-saud', day: -1, slot: '19:15', status: 'completed' }),
  appointment({ id: 'apt-1024', clinicServiceId: 'cs-dermaart-bbl', userId: 'usr-fahad-al-anazi', doctorId: 'doc-mona-al-husseini', day: -2, slot: '11:30', status: 'completed' }),
  appointment({ id: 'apt-1025', clinicServiceId: 'cs-dermaart-hydrafacial', userId: 'usr-maryam-al-subaie', doctorId: 'doc-mona-al-husseini', day: -5, slot: '12:15', status: 'no_show' }),
  appointment({ id: 'apt-1026', clinicServiceId: 'cs-dermaart-emsculpt', userId: 'usr-reema-al-harbi', doctorId: 'doc-sara-al-otaibi', day: -8, slot: '14:00', status: 'completed' }),

  // ── Demo patient: Sara Al-Muqrin ────────────────────────────────────────
  appointment({
    id: 'apt-2001',
    clinicServiceId: 'cs-dermaart-profhilo',
    userId: 'usr-sara-al-muqrin',
    doctorId: 'doc-reem-al-saud',
    day: 3,
    slot: '19:15',
    status: 'confirmed',
    suite: 'Private VIP Suite #402',
    preferences: { privateSuite: true, femaleStaff: true },
    patientNotes: 'No known allergies. Completed first session of Profhilo in Jeddah 6 months ago with positive skin elasticity response.',
  }),
  appointment({ id: 'apt-2002', clinicServiceId: 'cs-royal-hydrafacial', userId: 'usr-sara-al-muqrin', doctorId: 'doc-maha-al-qahtani', day: 9, slot: '13:00', status: 'pending', createdDaysBefore: 1, preferences: { privateSuite: false, femaleStaff: true } }),
  appointment({ id: 'apt-2003', clinicServiceId: 'cs-dermaart-botox', userId: 'usr-sara-al-muqrin', doctorId: 'doc-reem-al-saud', day: -32, slot: '16:30', status: 'completed', preferences: { privateSuite: true, femaleStaff: true } }),
  appointment({ id: 'apt-2004', clinicServiceId: 'cs-laura-morpheus8', userId: 'usr-sara-al-muqrin', doctorId: 'doc-khalid-al-shehri', day: -64, slot: '18:30', status: 'completed' }),
  appointment({ id: 'apt-2005', clinicServiceId: 'cs-elysian-clarity', userId: 'usr-sara-al-muqrin', doctorId: 'doc-faisal-al-ghamdi', day: -15, slot: '12:00', status: 'cancelled', cancelledAt: relativeScheduledAt(-17, '09:20') }),
  appointment({ id: 'apt-2006', clinicServiceId: 'cs-elysian-glutathione', userId: 'usr-sara-al-muqrin', doctorId: 'doc-tariq-mansoor', day: -120, slot: '15:00', status: 'completed' }),

  // ── Other clinics ───────────────────────────────────────────────────────
  appointment({ id: 'apt-3001', clinicServiceId: 'cs-laura-morpheus8', userId: 'usr-sarah-al-ghamdi', doctorId: 'doc-khalid-al-shehri', day: -40, slot: '17:00', status: 'completed' }),
  appointment({ id: 'apt-3002', clinicServiceId: 'cs-laura-profhilo', userId: 'usr-reema-al-harbi', doctorId: 'doc-haya-al-majed', day: 2, slot: '15:30', status: 'confirmed' }),
  appointment({ id: 'apt-3003', clinicServiceId: 'cs-laura-harmonization', userId: 'usr-loulwa-al-saud', doctorId: 'doc-haya-al-majed', day: 6, slot: '18:00', status: 'pending', createdDaysBefore: 1 }),
  appointment({ id: 'apt-4001', clinicServiceId: 'cs-elysian-clarity', userId: 'usr-bander-al-otaibi', doctorId: 'doc-faisal-al-ghamdi', day: -21, slot: '10:00', status: 'completed' }),
  appointment({ id: 'apt-4002', clinicServiceId: 'cs-elysian-morpheus8', userId: 'usr-danah-al-dosari', doctorId: 'doc-faisal-al-ghamdi', day: 5, slot: '14:00', status: 'confirmed' }),
  appointment({ id: 'apt-5001', clinicServiceId: 'cs-elysee-sofwave', userId: 'usr-loulwa-al-saud', doctorId: 'doc-nora-al-sudairi', day: -50, slot: '19:15', status: 'completed' }),
  appointment({ id: 'apt-6001', clinicServiceId: 'cs-aurelia-thermage', userId: 'usr-hessa-al-otaibi', doctorId: 'doc-yara-haddad', day: -60, slot: '13:00', status: 'completed' }),
  appointment({ id: 'apt-6002', clinicServiceId: 'cs-aurelia-nad', userId: 'usr-lulwa-al-kabeer', doctorId: 'doc-abdullah-al-rashid', day: -10, slot: '11:00', status: 'completed' }),
  appointment({ id: 'apt-7001', clinicServiceId: 'cs-royal-picoway', userId: 'usr-danah-al-dosari', doctorId: 'doc-maha-al-qahtani', day: -45, slot: '20:30', status: 'completed' }),
  appointment({ id: 'apt-7002', clinicServiceId: 'cs-royal-peel', userId: 'usr-majed-al-mutairi', doctorId: 'doc-maha-al-qahtani', day: 5, slot: '20:30', status: 'confirmed' }),
];
