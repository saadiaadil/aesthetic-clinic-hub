import { isRouteErrorResponse, useRouteError } from 'react-router';
import { RefreshCw } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/constants/routes';

/**
 * Router-level error boundary (requirements §3.12: generic, non-technical
 * message; details stay in logs).
 */
export default function RouteErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  if (import.meta.env.DEV && !notFound) console.error(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-space-md bg-surface px-margin-mobile text-center">
      <BrandLogo />
      <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">{notFound ? 'Error 404' : 'Unexpected error'}</p>
      <h1 className="max-w-xl font-headline-lg text-headline-lg text-on-surface">
        {notFound ? 'This page could not be found.' : 'Something went wrong. Please try again later.'}
      </h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
        Our team has been notified. You can reload the page or return to the homepage to continue browsing verified clinics.
      </p>
      <div className="flex flex-wrap justify-center gap-space-sm">
        <Button leftIcon={RefreshCw} onClick={() => window.location.reload()}>
          Reload page
        </Button>
        <Button href={ROUTES.home} variant="soft">
          Back to home
        </Button>
      </div>
    </div>
  );
}
