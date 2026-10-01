/**
 * Runtime configuration read from Vite env variables (see .env.example).
 *
 * USE_MOCK_API — while true, every service resolves local mock data. Setting
 * VITE_USE_MOCK_API=false switches the same service functions to the Express
 * REST API at API_BASE_URL (Phase 5).
 */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

/** Simulated network latency for mock responses, so loading states are visible. */
export const MOCK_LATENCY_MS = 450;

/** Shows the "demo accounts" helper on sign-in pages while running on mock data. */
export const SHOW_DEMO_ACCOUNTS = USE_MOCK_API;

export const PAGE_SIZE = {
  clinics: 6,
  doctors: 9,
  treatments: 9,
  table: 8,
};
