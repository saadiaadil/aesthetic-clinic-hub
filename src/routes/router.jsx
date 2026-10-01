import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { ROLES } from '@/constants/roles';
import AdminLayout from '@/layouts/AdminLayout';
import BookingLayout from '@/layouts/BookingLayout';
import ClinicLayout from '@/layouts/ClinicLayout';
import DoctorLayout from '@/layouts/DoctorLayout';
import PatientLayout from '@/layouts/PatientLayout';
import PublicLayout from '@/layouts/PublicLayout';
import RootLayout from '@/layouts/RootLayout';
import RouteErrorPage from '@/pages/public/RouteErrorPage';
import { RequireRole } from './RequireRole';

// Pages are code-split per route so each dashboard area loads on demand.
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const ClinicsPage = lazy(() => import('@/pages/public/ClinicsPage'));
const ClinicDetailPage = lazy(() => import('@/pages/public/ClinicDetailPage'));
const DoctorsPage = lazy(() => import('@/pages/public/DoctorsPage'));
const DoctorDetailPage = lazy(() => import('@/pages/public/DoctorDetailPage'));
const TreatmentsPage = lazy(() => import('@/pages/public/TreatmentsPage'));
const TreatmentDetailPage = lazy(() => import('@/pages/public/TreatmentDetailPage'));
const LegalPage = lazy(() => import('@/pages/public/LegalPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ProviderLoginPage = lazy(() => import('@/pages/auth/ProviderLoginPage'));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

const BookingIndexPage = lazy(() => import('@/pages/booking/BookingIndexPage'));
const BookingClinicPage = lazy(() => import('@/pages/booking/BookingClinicPage'));
const BookingServicePage = lazy(() => import('@/pages/booking/BookingServicePage'));
const BookingDoctorPage = lazy(() => import('@/pages/booking/BookingDoctorPage'));
const BookingDateTimePage = lazy(() => import('@/pages/booking/BookingDateTimePage'));
const BookingConfirmationPage = lazy(() => import('@/pages/booking/BookingConfirmationPage'));
const BookingSuccessPage = lazy(() => import('@/pages/booking/BookingSuccessPage'));

const PatientDashboardPage = lazy(() => import('@/pages/patient/PatientDashboardPage'));
const PatientAppointmentsPage = lazy(() => import('@/pages/patient/PatientAppointmentsPage'));
const PatientAppointmentDetailPage = lazy(() => import('@/pages/patient/PatientAppointmentDetailPage'));
const SavedClinicsPage = lazy(() => import('@/pages/patient/SavedClinicsPage'));
const PatientReviewsPage = lazy(() => import('@/pages/patient/PatientReviewsPage'));
const PatientProfilePage = lazy(() => import('@/pages/patient/PatientProfilePage'));

const ClinicRegisterPage = lazy(() => import('@/pages/clinic/ClinicRegisterPage'));
const ClinicDashboardPage = lazy(() => import('@/pages/clinic/ClinicDashboardPage'));
const ClinicAppointmentsPage = lazy(() => import('@/pages/clinic/ClinicAppointmentsPage'));
const ClinicServicesPage = lazy(() => import('@/pages/clinic/ClinicServicesPage'));
const ClinicDoctorsPage = lazy(() => import('@/pages/clinic/ClinicDoctorsPage'));
const ClinicSchedulePage = lazy(() => import('@/pages/clinic/ClinicSchedulePage'));
const ClinicProfilePage = lazy(() => import('@/pages/clinic/ClinicProfilePage'));
const ClinicReviewsPage = lazy(() => import('@/pages/clinic/ClinicReviewsPage'));

const DoctorDashboardPage = lazy(() => import('@/pages/doctor/DoctorDashboardPage'));
const DoctorAppointmentsPage = lazy(() => import('@/pages/doctor/DoctorAppointmentsPage'));
const DoctorSchedulePage = lazy(() => import('@/pages/doctor/DoctorSchedulePage'));
const DoctorProfilePage = lazy(() => import('@/pages/doctor/DoctorProfilePage'));

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminClinicsPage = lazy(() => import('@/pages/admin/AdminClinicsPage'));
const AdminDoctorsPage = lazy(() => import('@/pages/admin/AdminDoctorsPage'));
const AdminServicesPage = lazy(() => import('@/pages/admin/AdminServicesPage'));
const AdminAppointmentsPage = lazy(() => import('@/pages/admin/AdminAppointmentsPage'));
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      // ── Public marketplace, auth and booking ───────────────────────────
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'clinics', element: <ClinicsPage /> },
          { path: 'clinics/:clinicId', element: <ClinicDetailPage /> },
          { path: 'doctors', element: <DoctorsPage /> },
          { path: 'doctors/:doctorId', element: <DoctorDetailPage /> },
          { path: 'treatments', element: <TreatmentsPage /> },
          { path: 'treatments/:treatmentId', element: <TreatmentDetailPage /> },
          { path: 'legal/:slug', element: <LegalPage /> },
          { path: 'clinic/register', element: <ClinicRegisterPage /> },

          { path: 'login', element: <LoginPage /> },
          { path: 'login/provider', element: <ProviderLoginPage /> },
          { path: 'signup', element: <SignupPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },

          {
            path: 'booking',
            element: <BookingLayout />,
            children: [
              { index: true, element: <BookingIndexPage /> },
              { path: 'clinic', element: <BookingClinicPage /> },
              { path: 'service', element: <BookingServicePage /> },
              { path: 'doctor', element: <BookingDoctorPage /> },
              { path: 'date-time', element: <BookingDateTimePage /> },
              // FR-5 precondition: the patient must be logged in to confirm.
              {
                element: <RequireRole roles={[ROLES.PATIENT]} />,
                children: [
                  { path: 'confirmation', element: <BookingConfirmationPage /> },
                  { path: 'success', element: <BookingSuccessPage /> },
                ],
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },

      // ── Patient ─────────────────────────────────────────────────────────
      {
        path: 'patient',
        element: (
          <RequireRole roles={[ROLES.PATIENT]}>
            <PatientLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <PatientDashboardPage /> },
          { path: 'appointments', element: <PatientAppointmentsPage /> },
          { path: 'appointments/:appointmentId', element: <PatientAppointmentDetailPage /> },
          { path: 'saved', element: <SavedClinicsPage /> },
          { path: 'reviews', element: <PatientReviewsPage /> },
          { path: 'profile', element: <PatientProfilePage /> },
        ],
      },

      // ── Clinic portal ───────────────────────────────────────────────────
      {
        path: 'clinic',
        element: (
          <RequireRole roles={[ROLES.CLINIC]}>
            <ClinicLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <ClinicDashboardPage /> },
          { path: 'appointments', element: <ClinicAppointmentsPage /> },
          { path: 'services', element: <ClinicServicesPage /> },
          { path: 'doctors', element: <ClinicDoctorsPage /> },
          { path: 'schedule', element: <ClinicSchedulePage /> },
          { path: 'profile', element: <ClinicProfilePage /> },
          { path: 'reviews', element: <ClinicReviewsPage /> },
        ],
      },

      // ── Doctor workstation ──────────────────────────────────────────────
      {
        path: 'doctor',
        element: (
          <RequireRole roles={[ROLES.DOCTOR]}>
            <DoctorLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <DoctorDashboardPage /> },
          { path: 'appointments', element: <DoctorAppointmentsPage /> },
          { path: 'schedule', element: <DoctorSchedulePage /> },
          { path: 'profile', element: <DoctorProfilePage /> },
        ],
      },

      // ── Admin console ───────────────────────────────────────────────────
      {
        path: 'admin',
        element: (
          <RequireRole roles={[ROLES.ADMIN]}>
            <AdminLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboardPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'clinics', element: <AdminClinicsPage /> },
          { path: 'doctors', element: <AdminDoctorsPage /> },
          { path: 'services', element: <AdminServicesPage /> },
          { path: 'appointments', element: <AdminAppointmentsPage /> },
          { path: 'reviews', element: <AdminReviewsPage /> },
        ],
      },
    ],
  },
]);
