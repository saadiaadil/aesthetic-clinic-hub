import { BrandEmblem } from '@/components/common/BrandLogo';

/** Centered auth card (forgot / reset password) in the provider sign-in style. */
export function AuthCard({ overline, title, description, children }) {
  return (
    <section className="relative flex min-h-[calc(100vh-80px)] w-full items-center justify-center overflow-hidden bg-surface px-margin-mobile py-space-xl">
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary-fixed/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 size-[28rem] rounded-full bg-secondary-fixed/20 blur-3xl" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-space-lg shadow-xl md:p-space-xl">
        <BrandEmblem className="mb-space-md size-11" />
        <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">{overline}</span>
        <h1 className="mt-1 font-headline-md text-headline-md text-on-surface">{title}</h1>
        {description && <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{description}</p>}
        <div className="mt-space-md">{children}</div>
      </div>
    </section>
  );
}
