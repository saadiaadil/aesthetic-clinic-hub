import { useParams } from 'react-router';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Layout';
import { Breadcrumb, Tabs } from '@/components/common/Navigation';
import { EmptyState } from '@/components/common/States';
import { ROUTES } from '@/constants/routes';
import { LEGAL_PAGES } from '@/data/content';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate } from 'react-router';

/** Terms, Privacy & Data Ethics, Licenses (footer links). */
export default function LegalPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const page = LEGAL_PAGES[slug];
  useDocumentTitle(page?.title ?? 'Legal');

  if (!page) {
    return (
      <Container className="py-space-xl">
        <EmptyState title="Page not found" description="This legal document does not exist." action={<Button to={ROUTES.home}>Back to home</Button>} />
      </Container>
    );
  }

  return (
    <Container className="max-w-4xl py-space-xl">
      <Breadcrumb items={[{ label: 'Home', to: ROUTES.home }, { label: page.title }]} className="mb-space-md" />
      <Tabs
        variant="underline"
        label="Legal documents"
        value={slug}
        onChange={(value) => navigate(ROUTES.legal(value))}
        tabs={Object.entries(LEGAL_PAGES).map(([value, item]) => ({ value, label: item.title }))}
        className="mb-space-lg"
      />
      <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">{page.title}</h1>
      <p className="mt-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Last updated {page.updated}</p>
      <div className="mt-space-lg space-y-space-md">
        {page.sections.map((section) => (
          <section key={section.heading} className="rounded-xl bg-surface-container-low p-space-md sm:p-space-lg">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{section.heading}</h2>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{section.body}</p>
          </section>
        ))}
      </div>
    </Container>
  );
}
