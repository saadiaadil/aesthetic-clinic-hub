import { API_BASE_URL, MOCK_LATENCY_MS } from '@/constants/config';

/**
 * Transport layer for every service module.
 *
 * - `http()` calls the Express REST API (Phase 5). Cookies are sent with
 *   `credentials: 'include'` so the JWT can live in an HTTP-only cookie.
 * - `mockRequest()` resolves a local handler after a short delay so the UI
 *   exercises real loading, empty and error states before the API exists.
 *
 * Services choose between the two with the USE_MOCK_API flag, so switching
 * to the backend never touches a component.
 */

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'UNKNOWN', fieldErrors = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export const notFound = (entity = 'Record') => new ApiError(`${entity} not found.`, { status: 404, code: 'NOT_FOUND' });
export const conflict = (message) => new ApiError(message, { status: 409, code: 'CONFLICT' });
export const badRequest = (message, fieldErrors) => new ApiError(message, { status: 400, code: 'VALIDATION', fieldErrors });
export const unauthorized = (message = 'Invalid email or password. Please try again.') =>
  new ApiError(message, { status: 401, code: 'UNAUTHORIZED' });
export const forbidden = (message = 'You do not have permission to perform this action.') =>
  new ApiError(message, { status: 403, code: 'FORBIDDEN' });

/** Generic, non-technical fallback (requirements §3.12 System & Server Errors). */
export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again later.';

function buildUrl(path, params) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, item));
    else url.searchParams.set(key, value);
  });
  return url.toString();
}

export async function http(path, { method = 'GET', params, body, signal } = {}) {
  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and try again.', { status: 0, code: 'NETWORK' });
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.message ?? GENERIC_ERROR_MESSAGE, {
      status: response.status,
      code: payload?.code,
      fieldErrors: payload?.errors ?? null,
    });
  }
  return payload?.data ?? payload;
}

/** Deep copy so callers can never mutate the mock database by accident. */
const clone = (value) => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

export function mockRequest(handler, { delay = MOCK_LATENCY_MS } = {}) {
  const jitter = Math.round(Math.random() * 200);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(clone(handler()));
      } catch (error) {
        reject(error instanceof ApiError ? error : new ApiError(GENERIC_ERROR_MESSAGE));
        if (!(error instanceof ApiError) && import.meta.env.DEV) {
          // Surface unexpected mock errors during development only.
          console.error(error);
        }
      }
    }, delay + jitter);
  });
}

/** Standard paginated response shape shared by mock handlers and the API. */
export function paginate(items, { page = 1, pageSize = 10 } = {}) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (current - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page: current, pageSize, totalPages };
}

export const generateId = (prefix) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10)}`;
