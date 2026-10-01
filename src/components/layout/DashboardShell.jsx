import { Suspense } from 'react';
import { ExternalLink, Menu } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { BrandLogo } from '@/components/common/BrandLogo';
import { IconButton } from '@/components/common/IconButton';
import { Drawer } from '@/components/common/Overlay';
import { LoadingState } from '@/components/common/States';
import { NotificationsMenu } from '@/components/navigation/NotificationsMenu';
import { UserMenu } from '@/components/navigation/UserMenu';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useDisclosure } from '@/hooks/useDisclosure';
import { cn } from '@/utils/cn';

function SidebarNav({ config, footer, onNavigate }) {
  return (
    <div className="flex h-full flex-col justify-between gap-space-md p-space-md">
      <div className="space-y-space-md">
        <p className="px-2 py-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{config.sectionLabel}</p>
        <nav aria-label={config.sectionLabel} className="space-y-1">
          {config.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-3 py-2 font-title-md text-title-md transition-colors',
                  isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      {footer && <div className="rounded-xl bg-surface-container p-space-sm">{footer}</div>}
    </div>
  );
}

/**
 * Dashboard shell from the Stitch clinic management screen: 64px glass top
 * bar with role pill, fixed 256px "Operations" sidebar on desktop and a
 * drawer on tablet/mobile.
 */
export function DashboardShell({ config, footer, userSubtitle }) {
  const { user } = useAuth();
  const sidebar = useDisclosure();

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 z-50 w-full bg-surface/90 shadow-header backdrop-blur-xl">
        <div className="flex h-16 w-full items-center justify-between gap-gutter px-gutter-mobile md:px-margin">
          <div className="flex min-w-0 items-center gap-space-sm">
            <IconButton icon={Menu} label="Open navigation" size="md" onClick={sidebar.open} className="lg:hidden" />
            <BrandLogo compact />
            <span className="hidden whitespace-nowrap rounded-full bg-secondary-fixed/50 px-2.5 py-0.5 font-label-sm text-label-sm uppercase tracking-wider text-secondary sm:inline-flex">
              {config.badge}
            </span>
          </div>
          <div className="flex items-center gap-space-xs sm:gap-space-sm">
            <Link
              to={ROUTES.home}
              className="hidden items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 font-label-md text-label-md text-on-surface-variant hover:text-on-surface lg:inline-flex"
            >
              Consumer Portal
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
            {user && <NotificationsMenu userId={user.id} size="md" />}
            {user && <UserMenu showName="always" subtitle={userSubtitle} />}
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-64 border-r border-outline-variant/30 bg-surface-container-low lg:block">
        <SidebarNav config={config} footer={footer} />
      </aside>

      <Drawer isOpen={sidebar.isOpen} onClose={sidebar.close} side="left" title={config.badge} className="bg-surface-container-low">
        <SidebarNav config={config} footer={footer} onNavigate={sidebar.close} />
      </Drawer>

      <main id="main" className="min-h-screen w-full pt-16 lg:pl-64">
        <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-space-lg px-gutter-mobile py-space-lg sm:px-gutter lg:px-margin">
          <Suspense fallback={<LoadingState label="Loading workspace" />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
