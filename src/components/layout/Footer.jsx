import { BadgeCheck } from 'lucide-react';
import { Link } from 'react-router';
import { BrandLogo } from '@/components/common/BrandLogo';
import { BRAND } from '@/constants/brand';
import { FOOTER_COLUMNS, FOOTER_LEGAL } from '@/constants/navigation';
import { useToast } from '@/hooks/useToast';

/** Public footer — Stitch five-column layout on warm alabaster. */
export function Footer() {
  const toast = useToast();
  return (
    <footer className="w-full bg-surface-container-low">
      <div className="mx-auto w-full max-w-page px-margin-mobile pb-space-lg pt-space-xl md:px-margin">
        <div className="mb-space-xl grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-space-md lg:col-span-2">
            <BrandLogo />
            <p className="max-w-sm font-body-md text-body-md text-on-surface-variant">{BRAND.description}</p>
            <span className="inline-flex items-center gap-space-xs rounded-full bg-secondary-fixed/40 px-3 py-1.5 font-label-sm text-label-sm text-secondary">
              <BadgeCheck className="size-4" aria-hidden="true" />
              MOH Saudi Compliant Platform
            </span>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="space-y-space-sm">
              <h3 className="font-title-md text-title-md text-on-surface">{column.title}</h3>
              <ul className="space-y-2 font-body-sm text-body-sm text-on-surface-variant">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="transition-colors hover:text-on-surface">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-space-md pt-space-md font-label-md text-label-md text-on-surface-variant md:flex-row">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. {BRAND.country}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-space-lg">
            <div className="flex items-center gap-space-xs" aria-label="Language">
              <button type="button" className="rounded px-2 py-1 font-bold text-on-surface" aria-pressed="true">
                EN
              </button>
              <span className="text-outline-variant" aria-hidden="true">
                |
              </span>
              <button
                type="button"
                lang="ar"
                aria-pressed="false"
                onClick={() => toast.info('Arabic interface coming soon', 'Full Arabic (RTL) support is planned for a future release.')}
                className="rounded px-2 py-1 text-on-surface-variant transition-colors hover:text-on-surface"
              >
                العربية
              </button>
            </div>
            {FOOTER_LEGAL.map((link) => (
              <Link key={link.label} to={link.to} className="transition-colors hover:text-on-surface">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
