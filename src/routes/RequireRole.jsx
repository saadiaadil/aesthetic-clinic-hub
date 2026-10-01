import { ShieldAlert } from 'lucide-react';
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Button } from '@/components/common/Button';
import { ROLE_HOME, ROLE_LABELS, ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

function AccessDenied({ role, required }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-space-md bg-surface px-margin-mobile text-center">
      <BrandLogo />
      <span className="flex size-14 items-center justify-center rounded-full bg-error-container text-on-error-container">
        <ShieldAlert className="size-6" aria-hidden="true" />
      </span>
      <h1 className="font-headline-md text-headline-md text-on-surface">Access restricted</h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
        This area is for {required.map((item) => ROLE_LABELS[item]).join(' or ')} accounts. You are signed in as a {ROLE_LABELS[role]}.
      </p>
      <div className="flex flex-wrap justify-center gap-space-sm">
        <Button to={ROLE_HOME[role]}>Go to my dashboard</Button>
        <Button to={ROUTES.home} variant="soft">
          Back to home
        </Button>
      </div>
    </div>
  );
}

/**
 * Route guard. Unauthenticated visitors are sent to the right sign-in page
 * (patients → /login, providers → /login/provider) and returned afterwards.
 * Frontend guards are UX only; the Express API enforces the same role
 * matrix (SEC-6) on every request.
 */
export function RequireRole({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();
  // Forward the parent outlet context (e.g. booking flow data) to nested routes.
  const parentContext = useOutletContext();

  if (!user) {
    const providerArea = roles.some((role) => role !== ROLES.PATIENT);
    return <Navigate to={providerArea ? ROUTES.providerLogin : ROUTES.login} state={{ from: location }} replace />;
  }
  if (!roles.includes(user.role)) return <AccessDenied role={user.role} required={roles} />;
  return children ?? <Outlet context={parentContext} />;
}
