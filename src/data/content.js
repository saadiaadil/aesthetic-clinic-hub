/**
 * Static marketing copy taken from the Stitch screens, kept out of the page
 * components. `icon` keys are resolved by <DynamicIcon />.
 */

export const HOME_TRUST_ITEMS = [
  { icon: 'shieldCheck', tone: 'secondary', title: '100% MOH Licensed', text: 'Strict compliance with Saudi Health Authority' },
  { icon: 'messageSquareHeart', tone: 'primary', title: 'Verified Patient Reviews', text: 'Post-consultation authenticated ratings only' },
  { icon: 'banknote', tone: 'tertiary', title: 'Upfront Pricing', text: 'Transparent fee matrix with zero hidden costs' },
  { icon: 'lock', tone: 'gold', title: 'Discreet & Instant', text: 'Direct calendar slots & private lounge arrival' },
];

export const HOW_IT_WORKS_STEPS = [
  { index: '01', title: 'Curated Discovery', text: 'Explore strictly MOH-audited aesthetic clinics and Saudi-board certified dermatologists and plastic surgeons.' },
  { index: '02', title: 'Transparent Comparison', text: 'Review detailed price matrices, authentic untouched case logs, and machine specifications before committing.' },
  { index: '03', title: 'Direct Priority Booking', text: 'Reserve exact time slots in real time. Enjoy confidential private waiting lounges and VIP check-ins.' },
  { index: '04', title: 'Authenticated Care', text: 'Post-treatment guidance via our concierge, digital health records, and authentic, closed-loop review verification.' },
];

export const HERO_QUICK_SEARCHES = [
  { label: 'Botox & Neurotoxins', query: 'Botox' },
  { label: 'Juvederm & Fillers', query: 'Filler' },
  { label: 'Clarity II Laser', query: 'Clarity' },
  { label: 'Hydrafacial Elite', query: 'Hydrafacial' },
  { label: 'Exosomes & Hair PRP', query: 'PRP' },
  { label: 'Body Tone & Onda', query: 'Onda' },
];

export const AVAILABILITY_OPTIONS = [
  { id: 'any', label: 'Anytime' },
  { id: 'soon', label: 'Today / Tomorrow' },
  { id: 'week', label: 'This Week' },
  { id: 'weekend', label: 'Weekend VIP Slot' },
];

export const CLINIC_SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended for You' },
  { id: 'rating', label: 'Highest Rated (5.0 → 4.5)' },
  { id: 'price', label: 'Price: Low to High' },
  { id: 'reviews', label: 'Most Reviewed' },
];

export const PRICE_RANGES = [
  { id: 'all', label: 'Any Price', min: 0, max: Infinity },
  { id: 'under-600', label: 'Under 600 SAR', min: 0, max: 599 },
  { id: '600-1000', label: '600 – 1,000 SAR', min: 600, max: 1000 },
  { id: '1000-plus', label: '1,000+ SAR', min: 1000, max: Infinity },
];

export const RATING_OPTIONS = [
  { id: 'any', label: 'Any Rating', min: 0 },
  { id: '4.5', label: '4.5+ ★', min: 4.5 },
  { id: '4.8', label: '4.8+ ★', min: 4.8 },
  { id: '4.9', label: '4.9+ ★', min: 4.9 },
];

export const REGISTRATION_BENEFITS = [
  { icon: 'stethoscope', title: 'Direct Priority Booking', text: "Skip long waiting lists with board-certified dermatologists & plastic surgeons across Riyadh's prime medical districts." },
  { icon: 'concierge', title: 'VIP Concierge & Escort Suites', text: 'Private lounge reception, private rear entrances, and tailored post-procedure discreet exits upon request.' },
  { icon: 'banknote', title: 'Transparent Rates & Tabby / Tamara', text: 'Zero hidden consult markups. Flexible split payments in 4 zero-interest installments approved immediately.' },
  { icon: 'folderLock', title: 'Unified Health & Aesthetic Vault', text: 'Encrypted before/after records, treatment dosage history, and safe medical notes accessible on your phone.' },
];

export const ACCREDITATION_BENEFITS = [
  'Direct exposure to over 25,000+ luxury aesthetic clients in Riyadh.',
  'Encrypted VIP booking engine synchronized with your existing clinic PMS.',
  'High-tier verified badge placement on interactive district search maps.',
];

export const CLINIC_SPECIALTY_OPTIONS = [
  { id: 'dermatology', label: 'Dermatology' },
  { id: 'plastic-surgery', label: 'Plastic Surgery' },
  { id: 'laser', label: 'Laser & Esthetics' },
  { id: 'longevity', label: 'Longevity & Anti-Aging' },
];

export const CLINIC_AMENITY_OPTIONS = [
  { id: 'valet', label: 'Dedicated Valet', icon: 'parking' },
  { id: 'privateLounges', label: 'Private VIP Suites', icon: 'bed' },
  { id: 'femaleWing', label: 'Female-Only Wing', icon: 'venus' },
  { id: 'pharmacy', label: 'In-House Pharmacy', icon: 'pill' },
];

export const LEGAL_PAGES = {
  terms: {
    title: 'Terms of Service',
    updated: '1 September 2026',
    sections: [
      { heading: 'Using Aesthetic Clinic Hub', body: 'Aesthetic Clinic Hub is a directory and booking platform connecting patients with independently operated, MOH-licensed aesthetic clinics in Riyadh. Clinics remain responsible for all medical advice and treatment.' },
      { heading: 'Bookings & Cancellations', body: 'Appointment requests are confirmed by the clinic. Each clinic publishes its own cancellation window; most allow complimentary cancellation up to 24 hours before the appointment.' },
      { heading: 'Reviews', body: 'Only patients with a completed appointment can publish a review. Reviews are moderated for authenticity and respectful language before they appear publicly.' },
    ],
  },
  privacy: {
    title: 'Privacy & Data Ethics',
    updated: '1 September 2026',
    sections: [
      { heading: 'What we collect', body: 'Account details, booking history and the medical intake notes you choose to share with a clinic. Intake notes are visible only to the clinic and practitioner treating you.' },
      { heading: 'How we protect it', body: 'Data is transmitted over HTTPS and handled in line with the Saudi Personal Data Protection Law (PDPL) and National Cybersecurity Authority controls.' },
      { heading: 'Your choices', body: 'You can update communication preferences, download your data or request account deletion from your profile at any time.' },
    ],
  },
  licenses: {
    title: 'Licenses & Accreditation',
    updated: '1 September 2026',
    sections: [
      { heading: 'Clinic verification', body: 'Every listed clinic submits its Ministry of Health facility license and Balady municipal permit, which are reviewed by the platform verification committee before the clinic becomes visible.' },
      { heading: 'Practitioner credentials', body: 'Practitioners are listed with their Saudi Commission for Health Specialties (SCFHS) registration. Credentials are re-checked annually.' },
    ],
  },
};
