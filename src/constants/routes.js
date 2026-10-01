/**
 * Every application path in one place. Components link with ROUTES.* instead
 * of hard-coded strings so paths can change without hunting through JSX.
 */
export const ROUTES = {
  home: '/',
  howItWorks: '/#how-it-works',
  clinics: '/clinics',
  clinic: (id) => `/clinics/${id}`,
  doctors: '/doctors',
  doctor: (id) => `/doctors/${id}`,
  treatments: '/treatments',
  treatment: (id) => `/treatments/${id}`,
  legal: (slug) => `/legal/${slug}`,

  login: '/login',
  providerLogin: '/login/provider',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  clinicRegister: '/clinic/register',

  booking: {
    root: '/booking',
    clinic: '/booking/clinic',
    service: '/booking/service',
    doctor: '/booking/doctor',
    dateTime: '/booking/date-time',
    confirmation: '/booking/confirmation',
    success: '/booking/success',
  },

  patient: {
    root: '/patient',
    dashboard: '/patient/dashboard',
    appointments: '/patient/appointments',
    appointment: (id) => `/patient/appointments/${id}`,
    saved: '/patient/saved',
    reviews: '/patient/reviews',
    profile: '/patient/profile',
  },

  clinicPortal: {
    root: '/clinic',
    dashboard: '/clinic/dashboard',
    appointments: '/clinic/appointments',
    services: '/clinic/services',
    doctors: '/clinic/doctors',
    schedule: '/clinic/schedule',
    profile: '/clinic/profile',
    reviews: '/clinic/reviews',
  },

  doctorPortal: {
    root: '/doctor',
    dashboard: '/doctor/dashboard',
    appointments: '/doctor/appointments',
    schedule: '/doctor/schedule',
    profile: '/doctor/profile',
  },

  admin: {
    root: '/admin',
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    clinics: '/admin/clinics',
    doctors: '/admin/doctors',
    services: '/admin/services',
    appointments: '/admin/appointments',
    reviews: '/admin/reviews',
  },
};
