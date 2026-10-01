import { USE_MOCK_API } from '@/constants/config';
import { DEMO_PASSWORD } from '@/data/users';
import { badRequest, generateId, http, mockRequest, unauthorized } from './apiClient';
import { db } from './mock/mockDb';
import { publicUser } from './mock/selectors';

/**
 * Authentication (FR-1 registration, FR-2 login, UC-1 password reset).
 *
 * ⚠️ MOCK AUTH — while USE_MOCK_API is true, credentials are checked in the
 * browser against mock data and the "session" is just the user id kept by
 * the auth store. It provides no security. Phase 5 swaps these functions
 * for the Express API: passwords hashed with bcrypt/Argon2 server-side and
 * a JWT issued in an HTTP-only, Secure, SameSite cookie. Components already
 * depend only on these function signatures, so nothing else changes.
 *
 * REST endpoints (Phase 5): POST /auth/login, POST /auth/logout,
 * POST /auth/register, GET /auth/me, POST /auth/forgot-password,
 * POST /auth/reset-password, PATCH /me, PATCH /me/password
 */

const normalizePhone = (value) => value.replace(/\s|-/g, '').replace(/^(\+?966|0)/, '');

function findByIdentifier(identifier) {
  const value = identifier.trim().toLowerCase();
  // Provider sign in also accepts an MOH facility license (clinic owner) or SCFHS license (practitioner).
  const clinic = db.all('clinics').find((item) => item.licenseNumber.toLowerCase() === value);
  if (clinic) return db.find('users', clinic.ownerId);
  const doctor = db.all('doctors').find((item) => item.scfhsLicense?.toLowerCase() === value);
  if (doctor?.userId) return db.find('users', doctor.userId);
  return db.all('users').find((user) => {
    if (user.email?.toLowerCase() === value) return true;
    return user.phone && normalizePhone(user.phone) === normalizePhone(value) && /\d/.test(value);
  });
}

/** portal: 'patient' | 'provider' — the provider sign-in rejects patient accounts. */
export function login({ identifier, password, portal = 'patient' }) {
  if (!USE_MOCK_API) return http('/auth/login', { method: 'POST', body: { identifier, password, portal } });
  return mockRequest(() => {
    const user = findByIdentifier(identifier);
    const expected = user?.password ?? DEMO_PASSWORD;
    if (!user || password !== expected) throw unauthorized();
    if (user.status === 'suspended') throw unauthorized('This account has been suspended. Please contact support.');
    if (portal === 'provider' && user.role === 'patient') {
      throw unauthorized('This is the clinic provider sign in. Patients can sign in from the Patient Sanctuary.');
    }
    const updated = db.update('users', user.id, { lastLoginAt: new Date().toISOString() });
    return { user: publicUser(updated) };
  });
}

export function logout() {
  if (!USE_MOCK_API) return http('/auth/logout', { method: 'POST' });
  return mockRequest(() => ({ ok: true }), { delay: 150 });
}

/** Restores the session on app start. With the API this reads the HTTP-only cookie. */
export function getCurrentUser(userId) {
  if (!USE_MOCK_API) return http('/auth/me');
  return mockRequest(() => {
    const user = userId ? db.find('users', userId) : null;
    if (!user || user.status === 'suspended') throw unauthorized('Your session has expired. Please sign in again.');
    return { user: publicUser(user) };
  }, { delay: 120 });
}

/** FR-1: validate → check uniqueness → store user. */
export function register({ name, email, phone, password, district, preferences }) {
  if (!USE_MOCK_API) return http('/auth/register', { method: 'POST', body: { name, email, phone, password, district, preferences } });
  return mockRequest(() => {
    const normalizedEmail = email.trim().toLowerCase();
    if (db.all('users').some((user) => user.email?.toLowerCase() === normalizedEmail)) {
      throw badRequest('An account with this email already exists.', { email: 'This email is already registered. Try signing in instead.' });
    }
    if (db.all('users').some((user) => user.phone && normalizePhone(user.phone) === normalizePhone(phone))) {
      throw badRequest('An account with this mobile number already exists.', { phone: 'This mobile number is already registered.' });
    }
    const now = new Date().toISOString();
    const user = db.insert('users', {
      id: generateId('usr'),
      name: name.trim(),
      email: normalizedEmail,
      phone,
      password, // mock only — never stored in plain text by the real API
      role: 'patient',
      status: 'active',
      district,
      preferences,
      avatar: null,
      createdAt: now,
      lastLoginAt: now,
    });
    return { user: publicUser(user) };
  });
}

/**
 * Always resolves (never reveals whether an email exists). The mock returns
 * the reset token so the demo can continue without an email inbox.
 */
export function requestPasswordReset(email) {
  if (!USE_MOCK_API) return http('/auth/forgot-password', { method: 'POST', body: { email } });
  return mockRequest(() => {
    const user = findByIdentifier(email);
    return { sent: true, demoToken: user ? `reset-${user.id}` : null };
  });
}

export function resetPassword({ token, password }) {
  if (!USE_MOCK_API) return http('/auth/reset-password', { method: 'POST', body: { token, password } });
  return mockRequest(() => {
    const userId = token?.startsWith('reset-') ? token.slice(6) : null;
    const user = userId ? db.find('users', userId) : null;
    if (!user) throw badRequest('This reset link is invalid or has expired. Please request a new one.');
    db.update('users', user.id, { password, lastPasswordChangedAt: new Date().toISOString() });
    return { ok: true };
  });
}

export function updateProfile(userId, patch) {
  if (!USE_MOCK_API) return http('/me', { method: 'PATCH', body: patch });
  return mockRequest(() => {
    if (patch.email) {
      const taken = db.all('users').some((user) => user.id !== userId && user.email?.toLowerCase() === patch.email.toLowerCase());
      if (taken) throw badRequest('This email is already used by another account.', { email: 'Email must be unique.' });
    }
    return { user: publicUser(db.update('users', userId, patch)) };
  });
}

export function changePassword(userId, { currentPassword, newPassword }) {
  if (!USE_MOCK_API) return http('/me/password', { method: 'PATCH', body: { currentPassword, newPassword } });
  return mockRequest(() => {
    const user = db.find('users', userId);
    if ((user.password ?? DEMO_PASSWORD) !== currentPassword) throw badRequest('Your current password is incorrect.', { currentPassword: 'Incorrect password.' });
    db.update('users', userId, { password: newPassword, lastPasswordChangedAt: new Date().toISOString() });
    return { ok: true };
  });
}
