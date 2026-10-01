# Aesthetic Clinic Hub — Frontend

Discovery, comparison and booking platform for aesthetic clinics in Riyadh.
This repository is the **frontend only** (React + Vite + Tailwind CSS). All data comes from a
local mock layer that mirrors the REST API the future Express.js/MongoDB backend will expose.

- **Visual source of truth:** the Google Stitch export (`stitch_aesthetic_clinic_hub/`).
- **Functional source of truth:** the GP1 requirements report (FR-1 … FR-8).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build
npm run lint       # ESLint (flat config)
```

Requires Node.js 20+. Copy `.env.example` to `.env.local` to change settings:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_USE_MOCK_API` | `true` | `true` = in-browser mock data; `false` = call the REST API |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Base URL of the Express API |

## Demo accounts (mock mode only)

All accounts use the password **`Aesthetic@2026`**. The sign-in pages also list them as one-click
demo buttons, shown only while `VITE_USE_MOCK_API=true`.

| Role | Email | Sign in at | Lands on |
| --- | --- | --- | --- |
| Patient | `sara@demo.sa` | `/login` | `/patient/dashboard` |
| Clinic manager | `manager@dermaart.sa` | `/login/provider` → Administrator | `/clinic/dashboard` |
| Doctor | `reem.alsaud@dermaart.sa` | `/login/provider` → Practitioner | `/doctor/dashboard` |
| Platform admin | `admin@aestheticclinichub.sa` | `/login/provider` → Administrator | `/admin/dashboard` |

Providers can also sign in with their MOH license (clinics) or SCFHS number (doctors), as in the Stitch design.

> **Mock authentication is not security.** In mock mode, passwords are compared in the browser and the
> "session" is a user object in `localStorage`. Route guards (`RequireRole`) are only there for UX.
> Real authentication, including JWT in HTTP-only cookies, password hashing and server-side role
> checks, belongs to the backend phase.

The mock database is saved in `localStorage` (`ach.mockdb`) so bookings and edits survive a reload.
It is reseeded every day so the relative appointment dates stay current. To reset it by hand, run
`__resetMockData()` in the browser console.

## Routes

| Area | Routes |
| --- | --- |
| Public | `/`, `/clinics`, `/clinics/:id`, `/doctors`, `/doctors/:id`, `/treatments`, `/treatments/:id`, `/clinic/register`, `/legal/:slug` |
| Auth | `/login`, `/login/provider`, `/signup`, `/forgot-password`, `/reset-password` |
| Booking | `/booking` (deep links: `?clinic=&service=&doctor=`), `/booking/clinic`, `/booking/service`, `/booking/doctor`, `/booking/date-time`, `/booking/confirmation`, `/booking/success` |
| Patient | `/patient/dashboard`, `/patient/appointments`, `/patient/appointments/:id`, `/patient/saved`, `/patient/reviews`, `/patient/profile` |
| Clinic | `/clinic/dashboard`, `/clinic/appointments`, `/clinic/services`, `/clinic/doctors`, `/clinic/schedule`, `/clinic/profile`, `/clinic/reviews` |
| Doctor | `/doctor/dashboard`, `/doctor/appointments`, `/doctor/schedule`, `/doctor/profile` |
| Admin | `/admin/dashboard`, `/admin/users`, `/admin/clinics`, `/admin/doctors`, `/admin/services`, `/admin/appointments`, `/admin/reviews` |

`/patient`, `/clinic`, `/doctor` and `/admin` redirect to their dashboards. Anyone can browse
the booking steps, but confirming a booking requires a patient sign-in (FR-5). After signing in,
the patient returns to the step they were on.

## Project structure

```
src/
  assets/images/     Stitch imagery, bundled locally (no external image URLs)
  components/
    common/          Design-system primitives: Button, Badge, Form fields, Modal/Drawer, Tabs, States, Skeleton…
    layout/          Header, Footer, DashboardShell (sidebar + mobile drawer)
    navigation/      Search dialog, district picker, user & notification menus, mobile menu
    clinic/ doctor/ treatment/ review/ appointment/ dashboard/ auth/   Domain components
  constants/         Brand, routes, roles, statuses, navigation, config
  data/              Mock seed data (clinics, doctors, treatments, users, appointments, reviews…)
  hooks/             useAsync, useQueryState, useDisclosure, useToast…
  layouts/           Root, Public, Booking and one layout per portal
  pages/             One folder per area (public, auth, booking, patient, clinic, doctor, admin)
  routes/            router.jsx (lazy-loaded pages) and RequireRole guard
  services/          API service layer (see below)
    mock/            In-browser mock DB, availability engine and view selectors
  store/             Zustand stores: auth, booking wizard, favorites, UI/toasts
  utils/             Formatting (SAR, Riyadh time), dates, Zod helpers, booking rules
```

### Design system

`tailwind.config.js` copies the Stitch Material 3 tokens exactly: colors (`primary`, `secondary`,
`surface-container-*`…), type scale (`display-lg` … `label-sm`), spacing (`space-xs` … `space-xl`,
`gutter`, `margin`), radii and shadows. Fonts are Playfair Display (headings) and Plus Jakarta Sans
(UI), both bundled with Fontsource. Stitch's Material Symbols are replaced by the closest Lucide icons.
`cn()` (in `utils/cn.js`) is `tailwind-merge` configured with the custom tokens, so `className`
overrides work as expected.

### Service layer and backend integration

Pages never read `src/data` directly. They call functions in `src/services/*Service.js`, and each
function has two paths:

```js
export function getClinicById(id) {
  if (!USE_MOCK_API) return http(`/clinics/${id}`);            // real REST call
  return mockRequest(() => /* read the mock DB */);           // simulated latency + JSON clone
}
```

`services/apiClient.js` provides `http()`. It uses `fetch` with `credentials: 'include'` so it is
ready for HTTP-only cookie sessions, parses JSON, and throws an `ApiError` carrying `status`, `code`
and `fieldErrors`. Forms map `fieldErrors` onto their fields, so the Express API should return
validation errors in this shape:

```json
{ "message": "An account with this email already exists.", "code": "BAD_REQUEST", "fieldErrors": { "email": "This email is already registered." } }
```

To connect the backend, set `VITE_USE_MOCK_API=false` and add endpoints that match the `http()`
calls. Each service file lists its paths and payloads. Uncomment the `/api` proxy in
`vite.config.js` for local development.

### Business rules from the requirements report

| Rule | Where |
| --- | --- |
| FR-1 Unique email; Saudi mobile (+966 5X XXX XXXX) | `authService.register`, `utils/validation.js` |
| FR-3 Only verified clinics appear in search; admin approves applications | `mock/selectors.isPublicClinic`, `/clinic/register`, `/admin/clinics` |
| FR-5 Sign-in required to confirm; slot re-checked on confirm (409 if taken); idempotency key; price locked at booking | `appointmentService.createAppointment`, `store/bookingStore.js` |
| Availability from doctor schedules, leave and existing bookings (Riyadh time) | `services/mock/availability.js` |
| FR-6 Clinic accepts, rejects or reschedules; allowed status transitions | `appointmentService.updateAppointmentStatus` |
| FR-8 Reviews only after a completed visit; moderation before publishing | `reviewService.createReview`, `/admin/reviews` |

Prices are in SAR and include VAT; the VAT share is shown at checkout. Online card payment comes in
Phase 2. For now patients pick "Pay at Clinic" or Tabby/Tamara installments, and the app takes no
payment.

## Quality notes

- Every data view has loading (skeleton), empty and error/retry states.
- Forms use React Hook Form with Zod schemas: inline errors, required markers, disabled submit
  while sending, and success feedback.
- Accessibility: skip link, landmarks, labelled controls, focus trapping and restoring in modals
  and drawers, `aria-current` on navigation, and reduced-motion support.
- Responsive: mobile navigation drawer, filters in a drawer, dashboard sidebar in a drawer, and
  tables that turn into cards on small screens.
- Pages are lazy-loaded. Vendor code is split into `react`, `motion` and `forms` chunks.
