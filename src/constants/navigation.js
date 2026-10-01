import { ROUTES } from './routes';

/** Public header navigation (Stitch: Discover · Treatments · Clinics …). */
export const PUBLIC_NAV = [
  { label: 'Discover', to: ROUTES.home, end: true },
  { label: 'Treatments', to: ROUTES.treatments },
  { label: 'Clinics', to: ROUTES.clinics },
  { label: 'Specialists', to: ROUTES.doctors },
];

/** Extra links shown in the mobile menu. */
export const MOBILE_EXTRA_NAV = [
  { label: 'How It Works', to: ROUTES.howItWorks },
  { label: 'Book an Appointment', to: ROUTES.booking.root },
];

export const FOOTER_COLUMNS = [
  {
    title: 'Popular Treatments',
    links: [
      { label: 'Botox & Neurotoxins', to: ROUTES.treatment('botox-anti-wrinkle') },
      { label: 'Hyaluronic Fillers', to: ROUTES.treatments + '?specialty=fillers' },
      { label: 'Laser Skin Resurfacing', to: ROUTES.treatments + '?specialty=laser' },
      { label: 'Hydrafacial Elite', to: ROUTES.treatment('hydrafacial-elite') },
      { label: 'Morpheus8 RF Microneedling', to: ROUTES.treatment('morpheus8-rf-microneedling') },
    ],
  },
  {
    title: 'Riyadh Districts',
    links: [
      { label: 'Al Olaya (Medical Core)', to: ROUTES.clinics + '?district=olaya' },
      { label: 'Al Nakheel', to: ROUTES.clinics + '?district=nakheel' },
      { label: 'Hittin', to: ROUTES.clinics + '?district=hittin' },
      { label: 'Al Malqa', to: ROUTES.clinics + '?district=malqa' },
      { label: 'Diplomatic Quarter', to: ROUTES.clinics + '?district=dq' },
    ],
  },
  {
    title: 'For Clinics & Patients',
    links: [
      { label: 'Partner With Us', to: ROUTES.clinicRegister },
      { label: 'Clinic Provider Portal', to: ROUTES.providerLogin },
      { label: 'Patient Health Records', to: ROUTES.patient.dashboard },
      { label: 'Privacy & Data Ethics', to: ROUTES.legal('privacy') },
      { label: 'VIP Concierge Booking', to: ROUTES.booking.root },
    ],
  },
];

export const FOOTER_LEGAL = [
  { label: 'Terms', to: ROUTES.legal('terms') },
  { label: 'Privacy', to: ROUTES.legal('privacy') },
  { label: 'Licenses', to: ROUTES.legal('licenses') },
];

/**
 * Sidebar navigation for each dashboard area. Labels for the clinic portal
 * follow the Stitch "Operations" sidebar (Overview, Bookings & Consults …).
 */
export const DASHBOARD_NAV = {
  patient: {
    badge: 'Patient Sanctuary',
    sectionLabel: 'My Journey',
    items: [
      { label: 'Overview', to: ROUTES.patient.dashboard },
      { label: 'My Appointments', to: ROUTES.patient.appointments },
      { label: 'Saved Clinics', to: ROUTES.patient.saved },
      { label: 'My Reviews', to: ROUTES.patient.reviews },
      { label: 'Profile & Preferences', to: ROUTES.patient.profile },
    ],
  },
  clinic: {
    badge: 'Provider Hub',
    sectionLabel: 'Operations',
    items: [
      { label: 'Overview', to: ROUTES.clinicPortal.dashboard },
      { label: 'Bookings & Consults', to: ROUTES.clinicPortal.appointments },
      { label: 'Treatment Catalog', to: ROUTES.clinicPortal.services },
      { label: 'Specialists', to: ROUTES.clinicPortal.doctors },
      { label: 'Schedule', to: ROUTES.clinicPortal.schedule },
      { label: 'Patient Reviews', to: ROUTES.clinicPortal.reviews },
      { label: 'Branch Profile', to: ROUTES.clinicPortal.profile },
    ],
  },
  doctor: {
    badge: 'Specialist Workstation',
    sectionLabel: 'Clinical Day',
    items: [
      { label: 'Overview', to: ROUTES.doctorPortal.dashboard },
      { label: 'My Appointments', to: ROUTES.doctorPortal.appointments },
      { label: 'Availability', to: ROUTES.doctorPortal.schedule },
      { label: 'Professional Profile', to: ROUTES.doctorPortal.profile },
    ],
  },
  admin: {
    badge: 'Admin Console',
    sectionLabel: 'Platform',
    items: [
      { label: 'Overview', to: ROUTES.admin.dashboard },
      { label: 'Clinic Verification', to: ROUTES.admin.clinics },
      { label: 'Users', to: ROUTES.admin.users },
      { label: 'Doctors', to: ROUTES.admin.doctors },
      { label: 'Service Catalog', to: ROUTES.admin.services },
      { label: 'Appointments', to: ROUTES.admin.appointments },
      { label: 'Review Moderation', to: ROUTES.admin.reviews },
    ],
  },
};
