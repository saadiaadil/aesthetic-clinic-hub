import { images } from '@/assets/images';

/**
 * Users (`users` table). `role` drives route protection on the frontend:
 * patient | clinic | doctor | admin.
 *
 * MOCK ONLY: seeded accounts share DEMO_PASSWORD and are checked in the
 * browser by authService. This is not security — Phase 5 replaces it with
 * bcrypt/Argon2 hashing and JWT in HTTP-only cookies on the Express API.
 */
export const DEMO_PASSWORD = 'Aesthetic@2026';

const patient = (id, name, extra = {}) => ({
  id,
  name,
  role: 'patient',
  status: 'active',
  district: 'olaya',
  avatar: null,
  createdAt: '2026-01-15T10:00:00.000Z',
  lastLoginAt: '2026-09-29T18:00:00.000Z',
  preferences: { femaleStaff: true, whatsappReminders: true, privateArrival: false },
  ...extra,
});

export const users = [
  // ── Demo accounts (one per role) ────────────────────────────────────────
  patient('usr-sara-al-muqrin', 'Sara Abdulaziz Al-Muqrin', {
    email: 'sara@demo.sa',
    phone: '+966501234567',
    district: 'olaya',
    dateOfBirth: '1994-03-12',
    createdAt: '2025-12-02T10:00:00.000Z',
    preferences: { femaleStaff: true, whatsappReminders: true, privateArrival: false },
  }),
  {
    id: 'usr-lina-al-shammari',
    name: 'Lina Al-Shammari',
    email: 'manager@dermaart.sa',
    phone: '+966551110022',
    role: 'clinic',
    clinicId: 'dermaart',
    jobTitle: 'Clinic Operations Manager',
    status: 'active',
    avatar: null,
    createdAt: '2025-10-18T08:00:00.000Z',
    lastLoginAt: '2026-09-30T07:45:00.000Z',
  },
  {
    id: 'usr-reem-al-saud',
    name: 'Dr. Reem Al-Saud',
    email: 'reem.alsaud@dermaart.sa',
    phone: '+966552220033',
    role: 'doctor',
    doctorId: 'doc-reem-al-saud',
    clinicId: 'dermaart',
    status: 'active',
    avatar: images.misc.drReemAvatar,
    createdAt: '2025-10-18T08:30:00.000Z',
    lastLoginAt: '2026-09-30T08:10:00.000Z',
  },
  {
    id: 'usr-omar-al-fahad',
    name: 'Omar Al-Fahad',
    email: 'admin@aestheticclinichub.sa',
    phone: '+966553330044',
    role: 'admin',
    jobTitle: 'Platform Administrator',
    status: 'active',
    avatar: null,
    createdAt: '2025-09-01T08:00:00.000Z',
    lastLoginAt: '2026-09-30T09:00:00.000Z',
  },

  // ── Patients (Stitch dashboard queue, reviews & testimonials) ───────────
  patient('usr-nouf-al-bader', 'Nouf Al-Bader', { email: 'nouf.b@mail.sa', phone: '+966504441122', avatar: images.patients.noufAlBader, fileNo: 'RY-9021' }),
  patient('usr-reema-al-harbi', 'Reema Al-Harbi', { email: 'reema.h@mail.sa', phone: '+966505552233', avatar: images.patients.reemaAlHarbi, tier: 'VIP Regular', district: 'nakheel' }),
  patient('usr-hessa-al-otaibi', 'Hessa Al-Otaibi', { email: 'hessa.o@mail.sa', phone: '+966506663344', avatar: images.patients.hessaAlOtaibi, tier: 'Royal Tier VIP', district: 'dq' }),
  patient('usr-sarah-al-ghamdi', 'Sarah Al-Ghamdi', { email: 'sarah.g@mail.sa', phone: '+966507774455', avatar: images.patients.sarahAlGhamdi, tier: 'First Visit', district: 'malqa' }),
  patient('usr-lulwa-al-kabeer', 'Lulwa Al-Kabeer', { email: 'lulwa.k@mail.sa', phone: '+966508885566', tier: 'Royal Tier VIP', district: 'dq' }),
  patient('usr-danah-al-dosari', 'Danah Al-Dosari', { email: 'danah.d@mail.sa', phone: '+966509996677', district: 'hittin' }),
  patient('usr-majed-al-mutairi', 'Majed Al-Mutairi', { email: 'majed.m@mail.sa', phone: '+966531117788', district: 'yasmin', preferences: { femaleStaff: false, whatsappReminders: true, privateArrival: false } }),
  patient('usr-munira-al-khaldi', 'Munira Al-Khaldi', { email: 'munira.k@mail.sa', phone: '+966532228899' }),
  patient('usr-fahad-al-anazi', 'Fahad Al-Anazi', { email: 'fahad.a@mail.sa', phone: '+966533339900', district: 'wurud', preferences: { femaleStaff: false, whatsappReminders: false, privateArrival: true } }),
  patient('usr-hanan-al-mutairi', 'Hanan Al-Mutairi', { email: 'hanan.m@mail.sa', phone: '+966534440011', district: 'nakheel' }),
  patient('usr-sultan-al-ghamdi', 'Sultan Al-Ghamdi', { email: 'sultan.g@mail.sa', phone: '+966535551122', district: 'dq', preferences: { femaleStaff: false, whatsappReminders: true, privateArrival: true } }),
  patient('usr-nouf-al-husseini', 'Nouf Al-Husseini', { email: 'nouf.h@mail.sa', phone: '+966536662233' }),
  patient('usr-bander-al-otaibi', 'Bander Al-Otaibi', { email: 'bander.o@mail.sa', phone: '+966537773344', district: 'hittin', preferences: { femaleStaff: false, whatsappReminders: true, privateArrival: false } }),
  patient('usr-loulwa-al-saud', 'Loulwa Al-Saud', { email: 'loulwa.s@mail.sa', phone: '+966538884455', createdAt: '2024-05-10T10:00:00.000Z' }),
  patient('usr-maryam-al-subaie', 'Maryam Al-Subaie', { email: 'maryam.s@mail.sa', phone: '+966539995566', status: 'suspended', district: 'sulaimaniyah' }),

  // ── Clinic owners / managers ────────────────────────────────────────────
  { id: 'usr-faisal-al-mansour', name: 'Faisal Al-Mansour', email: 'ops@lauraskin.sa', phone: '+966541112233', role: 'clinic', clinicId: 'laura-skin', jobTitle: 'Practice Manager', status: 'active', avatar: null, createdAt: '2025-10-22T08:00:00.000Z', lastLoginAt: '2026-09-29T11:00:00.000Z' },
  { id: 'usr-noura-al-harthi', name: 'Noura Al-Harthi', email: 'admin@elysianhub.sa', phone: '+966542223344', role: 'clinic', clinicId: 'elysian', jobTitle: 'Clinic Director', status: 'active', avatar: null, createdAt: '2025-10-25T08:00:00.000Z', lastLoginAt: '2026-09-28T15:00:00.000Z' },
  { id: 'usr-clinique-owner', name: 'Camille Haddad', email: 'bonjour@cliniqueelysee.sa', phone: '+966543334455', role: 'clinic', clinicId: 'clinique-elysee', jobTitle: 'General Manager', status: 'active', avatar: null, createdAt: '2025-11-20T08:00:00.000Z', lastLoginAt: '2026-09-27T12:00:00.000Z' },
  { id: 'usr-aurelia-owner', name: 'Hind Al-Tamimi', email: 'concierge@aurelia.sa', phone: '+966544445566', role: 'clinic', clinicId: 'aurelia', jobTitle: 'Operations Director', status: 'active', avatar: null, createdAt: '2025-11-02T08:00:00.000Z', lastLoginAt: '2026-09-30T06:30:00.000Z' },
  { id: 'usr-royal-owner', name: 'Abeer Al-Zahrani', email: 'hello@royalglow.sa', phone: '+966545556677', role: 'clinic', clinicId: 'royal-glow', jobTitle: 'Clinic Manager', status: 'active', avatar: null, createdAt: '2025-12-01T08:00:00.000Z', lastLoginAt: '2026-09-26T16:20:00.000Z' },
  { id: 'usr-reem-al-nuaim', name: 'Dr. Reem Al-Nuaim', email: 'medical.board@reemalnuaim.sa', phone: '+966554918832', role: 'clinic', clinicId: 'al-nuaim-sanctuary', jobTitle: 'Medical Director', status: 'active', avatar: null, createdAt: '2026-09-28T10:30:00.000Z', lastLoginAt: '2026-09-28T10:30:00.000Z' },
  { id: 'usr-lumina-owner', name: 'Yousef Al-Qahtani', email: 'director@luminaclinic.sa', phone: '+966546667788', role: 'clinic', clinicId: 'lumina-dermatology', jobTitle: 'Owner', status: 'active', avatar: null, createdAt: '2026-09-25T14:10:00.000Z', lastLoginAt: '2026-09-25T14:10:00.000Z' },

  // ── Doctor accounts (besides the demo doctor) ───────────────────────────
  ...[
    ['usr-tariq-al-khatib', 'Dr. Tariq Al-Khatib', 'tariq.k@dermaart.sa', 'doc-tariq-al-khatib', 'dermaart'],
    ['usr-mona-al-husseini', 'Dr. Mona Al-Husseini', 'mona.h@dermaart.sa', 'doc-mona-al-husseini', 'dermaart'],
    ['usr-lama-al-mutawa', 'Dr. Lama Al-Mutawa', 'lama.m@dermaart.sa', 'doc-lama-al-mutawa', 'dermaart'],
    ['usr-sara-al-otaibi', 'Dr. Sara Al-Otaibi', 'sara.o@dermaart.sa', 'doc-sara-al-otaibi', 'dermaart'],
    ['usr-haya-al-majed', 'Dr. Haya Al-Majed', 'haya@lauraskin.sa', 'doc-haya-al-majed', 'laura-skin'],
    ['usr-khalid-al-shehri', 'Dr. Khalid Al-Shehri', 'khalid@lauraskin.sa', 'doc-khalid-al-shehri', 'laura-skin'],
    ['usr-faisal-al-ghamdi', 'Dr. Faisal Al-Ghamdi', 'faisal@elysianhub.sa', 'doc-faisal-al-ghamdi', 'elysian'],
    ['usr-tariq-mansoor', 'Dr. Tariq Mansoor', 'tariq.m@elysianhub.sa', 'doc-tariq-mansoor', 'elysian'],
    ['usr-nora-al-sudairi', 'Dr. Nora Al-Sudairi', 'nora@cliniqueelysee.sa', 'doc-nora-al-sudairi', 'clinique-elysee'],
    ['usr-abdullah-al-rashid', 'Dr. Abdullah Al-Rashid', 'abdullah@aurelia.sa', 'doc-abdullah-al-rashid', 'aurelia'],
    ['usr-yara-haddad', 'Dr. Yara Haddad', 'yara@aurelia.sa', 'doc-yara-haddad', 'aurelia'],
    ['usr-maha-al-qahtani', 'Dr. Maha Al-Qahtani', 'maha@royalglow.sa', 'doc-maha-al-qahtani', 'royal-glow'],
  ].map(([id, name, email, doctorId, clinicId]) => ({
    id,
    name,
    email,
    phone: null,
    role: 'doctor',
    doctorId,
    clinicId,
    status: 'active',
    avatar: null,
    createdAt: '2025-11-01T08:00:00.000Z',
    lastLoginAt: '2026-09-25T08:00:00.000Z',
  })),
];

/** One account per role, surfaced on the sign-in pages while running on mock data. */
export const DEMO_ACCOUNTS = [
  { role: 'patient', label: 'Patient', email: 'sara@demo.sa', name: 'Sara Al-Muqrin' },
  { role: 'clinic', label: 'Clinic Manager', email: 'manager@dermaart.sa', name: 'DermaArt Luxury Clinic' },
  { role: 'doctor', label: 'Specialist', email: 'reem.alsaud@dermaart.sa', name: 'Dr. Reem Al-Saud' },
  { role: 'admin', label: 'Platform Admin', email: 'admin@aestheticclinichub.sa', name: 'Omar Al-Fahad' },
];
