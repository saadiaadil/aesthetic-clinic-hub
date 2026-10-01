/** In-app notifications shown in the header bell (per user). */

const hoursAgo = (hours) => new Date(Date.now() - hours * 3600000).toISOString();

export const notifications = [
  { id: 'ntf-1', userId: 'usr-sara-al-muqrin', type: 'appointment', title: 'Appointment confirmed', body: 'DermaArt confirmed your Profhilo session with Dr. Reem Al-Saud.', link: '/patient/appointments/apt-2001', read: false, createdAt: hoursAgo(5) },
  { id: 'ntf-2', userId: 'usr-sara-al-muqrin', type: 'review', title: 'Share your experience', body: 'How was your Botox visit at DermaArt? Your verified review helps other patients.', link: '/patient/appointments/apt-2003', read: false, createdAt: hoursAgo(26) },
  { id: 'ntf-3', userId: 'usr-sara-al-muqrin', type: 'reminder', title: 'Prep reminder', body: 'Avoid retinoids for 48 hours before your Profhilo treatment.', link: '/patient/appointments/apt-2001', read: true, createdAt: hoursAgo(50) },

  { id: 'ntf-10', userId: 'usr-lina-al-shammari', type: 'booking', title: '3 booking requests awaiting approval', body: 'Lulwa Al-Kabeer, Danah Al-Dosari and Majed Al-Mutairi requested slots.', link: '/clinic/appointments', read: false, createdAt: hoursAgo(1) },
  { id: 'ntf-11', userId: 'usr-lina-al-shammari', type: 'review', title: 'New 5★ review', body: 'Munira K. reviewed Baby Botox with Dr. Reem Al-Saud.', link: '/clinic/reviews', read: false, createdAt: hoursAgo(2) },

  { id: 'ntf-20', userId: 'usr-reem-al-saud', type: 'appointment', title: 'Patient checked in', body: 'Hessa Al-Otaibi is in Suite 3 (Executive Chamber).', link: '/doctor/appointments', read: false, createdAt: hoursAgo(0.5) },
  { id: 'ntf-21', userId: 'usr-reem-al-saud', type: 'booking', title: 'New request for you', body: 'Lulwa Al-Kabeer requested Sculptra tomorrow at 11:00 AM.', link: '/doctor/appointments', read: true, createdAt: hoursAgo(20) },

  { id: 'ntf-30', userId: 'usr-omar-al-fahad', type: 'verification', title: '2 clinics awaiting verification', body: 'Dr. Reem Al-Nuaim Aesthetic Sanctuary and Lumina Dermatology submitted documents.', link: '/admin/clinics', read: false, createdAt: hoursAgo(4) },
  { id: 'ntf-31', userId: 'usr-omar-al-fahad', type: 'review', title: 'Reviews in moderation', body: '2 new patient reviews need moderation.', link: '/admin/reviews', read: false, createdAt: hoursAgo(3) },
];
