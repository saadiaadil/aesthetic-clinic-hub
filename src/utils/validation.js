import { z } from 'zod';

/**
 * Shared Zod field schemas. Business rules come from the requirements document:
 * FR-1 "Email must be unique, Password ≥ 6 characters"; clinic phone numbers are
 * stored in E.164 format (+966XXXXXXXXX).
 */

export const MESSAGES = {
  required: 'This field is required.',
  email: 'Invalid email format. Please enter a valid email.',
  saudiMobile: 'Enter a valid Saudi mobile number (e.g. 50 123 4567).',
  passwordMin: 'Password must be at least 8 characters.',
  passwordMatch: 'Passwords do not match.',
};

export const requiredText = (label = 'This field', min = 2) =>
  z
    .string({ required_error: MESSAGES.required })
    .trim()
    .min(1, `${label} is required.`)
    .min(min, `${label} must be at least ${min} characters.`);

export const emailField = z
  .string({ required_error: MESSAGES.required })
  .trim()
  .min(1, 'Email is required.')
  .email(MESSAGES.email);

/** Saudi mobile, entered without the +966 prefix: 5XXXXXXXX (spaces allowed). */
export const saudiMobileField = z
  .string({ required_error: MESSAGES.required })
  .trim()
  .min(1, 'Mobile number is required.')
  .transform((value) => value.replace(/\s|-/g, '').replace(/^(\+?966|0)/, ''))
  .refine((value) => /^5\d{8}$/.test(value), MESSAGES.saudiMobile);

/** Converts a validated local mobile ("501234567") to E.164 ("+966501234567"). */
export const toE164 = (localMobile) => `+966${localMobile}`;

export const passwordField = z
  .string({ required_error: MESSAGES.required })
  .min(8, MESSAGES.passwordMin)
  .regex(/[A-Za-z]/, 'Password must include at least one letter.')
  .regex(/\d/, 'Password must include at least one number.');

/** Email or Saudi mobile number (patient sign in: "Mobile or Email"). */
export const identifierField = z
  .string({ required_error: MESSAGES.required })
  .trim()
  .min(1, 'Enter your mobile number or email.')
  .refine(
    (value) => z.string().email().safeParse(value).success || /^(\+?966|0)?5\d{8}$/.test(value.replace(/\s|-/g, '')),
    'Enter a valid email or Saudi mobile number.',
  );

/** Password strength for the Stitch "Data Privacy & Security Grade" meter. */
export function getPasswordStrength(value = '') {
  if (!value) return { score: 0, label: 'Awaiting password', tone: 'neutral' };
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (value.length < 8 || score <= 1) return { score: 1, label: 'Basic / Incomplete', tone: 'error' };
  if (score <= 3) return { score: 2, label: 'Standard Discretion', tone: 'secondary' };
  if (score === 4) return { score: 3, label: 'Strong Safeguard', tone: 'secondary' };
  return { score: 4, label: 'High Clinical Shield', tone: 'primary' };
}
