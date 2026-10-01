import { Heart, Menu, Search } from 'lucide-react';
import { NavLink } from 'react-router';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { DistrictPicker } from '@/components/navigation/DistrictPicker';
import { MobileMenu } from '@/components/navigation/MobileMenu';
import { NotificationsMenu } from '@/components/navigation/NotificationsMenu';
import { SearchDialog } from '@/components/navigation/SearchDialog';
import { UserMenu } from '@/components/navigation/UserMenu';
import { PUBLIC_NAV } from '@/constants/navigation';
import { ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useFavoritesStore } from '@/store/favoritesStore';
import { cn } from '@/utils/cn';

/**
 * Public header — Stitch: fixed 80px ivory glass bar with brand, Riyadh
 * location pill, primary navigation and account actions. Adds a working
 * mobile menu below the lg breakpoint.
 */
export function Header() {
  const { user } = useAuth();
  const savedCount = useFavoritesStore((state) => state.clinicIds.length);
  const search = useDisclosure();
  const mobileMenu = useDisclosure();

  const savedLink = user?.role === ROLES.PATIENT || !user ? ROUTES.patient.saved : ROUTES.clinics;

  return (
    <header className="fixed top-0 z-50 w-full bg-surface/90 shadow-header backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-page items-center justify-between gap-gutter px-margin-mobile md:px-margin">
        <div className="flex min-w-0 items-center gap-space-md">
          <BrandLogo />
          <DistrictPicker className="hidden xl:block" />
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 font-title-md text-title-md transition-colors',
                  isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-space-sm">
          <IconButton icon={Search} label="Search treatments and clinics" onClick={search.open} />
          <IconButton icon={Heart} label={`Saved clinics (${savedCount})`} badge={savedCount || null} to={savedLink} className="hidden sm:inline-flex" />
          {user && <NotificationsMenu userId={user.id} />}
          {user ? (
            <UserMenu />
          ) : (
            <Button to={ROUTES.login} size="sm" variant="primary" className="hidden shadow-none sm:inline-flex">
              Sign In
            </Button>
          )}
          <Button to={ROUTES.clinicRegister} size="sm" variant="soft" className="hidden xl:inline-flex">
            List Clinic
          </Button>
          <IconButton icon={Menu} label="Open menu" onClick={mobileMenu.open} className="lg:hidden" aria-expanded={mobileMenu.isOpen} />
        </div>
      </div>

      <SearchDialog isOpen={search.isOpen} onClose={search.close} />
      <MobileMenu isOpen={mobileMenu.isOpen} onClose={mobileMenu.close} />
    </header>
  );
}
