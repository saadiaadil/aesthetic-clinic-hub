/**
 * Platform roles (requirements §3.2 User Characteristics):
 * patient (User), clinic (Vendor / clinic staff), doctor, admin.
 */
export const ROLES = Object.freeze({
  PATIENT: 'patient',
  CLINIC: 'clinic',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
});

export const ROLE_LABELS = {
  [ROLES.PATIENT]: 'Patient',
  [ROLES.CLINIC]: 'Clinic Manager',
  [ROLES.DOCTOR]: 'Specialist',
  [ROLES.ADMIN]: 'Platform Admin',
};

/** Where each role lands after signing in. */
export const ROLE_HOME = {
  [ROLES.PATIENT]: '/patient/dashboard',
  [ROLES.CLINIC]: '/clinic/dashboard',
  [ROLES.DOCTOR]: '/doctor/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
};
