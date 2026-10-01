import { Compass } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Layout';
import { ROUTES } from '@/constants/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-space-md py-space-xl text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-surface-container text-primary">
        <Compass className="size-6" aria-hidden="true" />
      </span>
      <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Error 404</p>
      <h1 className="max-w-xl font-headline-lg text-headline-lg text-on-surface">We couldn’t find that page.</h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
        The link may be outdated. Continue discovering verified aesthetic clinics and treatments across Riyadh.
      </p>
      <div className="flex flex-wrap justify-center gap-space-sm">
        <Button to={ROUTES.clinics}>Browse clinics</Button>
        <Button to={ROUTES.home} variant="soft">
          Back to home
        </Button>
      </div>
    </Container>
  );
}
