import { Building2, ChevronRight, LayoutDashboard, LogIn, LogOut, UserPlus, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router';
import { Avatar } from '@/components/common/Avatar';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Button } from '@/components/common/Button';
import { Drawer } from '@/components/common/Overlay';
import { ALL_DISTRICTS, DISTRICTS } from '@/constants/districts';
import { MOBILE_EXTRA_NAV, PUBLIC_NAV } from '@/constants/navigation';
import { ROLE_LABELS } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { usePreferencesStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

/**
 * Mobile navigation drawer (below the lg breakpoint). Stitch only hid the
 * desktop nav on small screens; this gives phones the full navigation,
 * district preference and account actions.
 */
export function MobileMenu({ isOpen, onClose }) {
  const { user, homePath, logout } = useAuth();
  const district = usePreferencesStore((state) => state.district);
  const setDistrict = usePreferencesStore((state) => state.setDistrict);
  const navigate = useNavigate();

  const signOut = async () => {
    onClose();
    await logout();
    navigate(ROUTES.home);
  };

  const linkClass = ({ isActive }) =>
    cn(
      'flex items-center justify-between rounded-lg px-3 py-3 font-title-md text-title-md transition-colors',
      isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface hover:bg-surface-container',
    );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="right" labelledBy="mobile-menu-title">
      <div className="flex items-center justify-between border-b border-surface-container-high px-space-md py-space-sm">
        <span id="mobile-menu-title" className="sr-only">
          Main menu
        </span>
        <BrandLogo compact to={ROUTES.home} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Mobile" className="space-y-1 px-space-sm py-space-md" onClick={(event) => event.target.closest('a') && onClose()}>
        {[...PUBLIC_NAV, ...MOBILE_EXTRA_NAV].map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            {item.label}
            <ChevronRight className="size-4 opacity-60" aria-hidden="true" />
          </NavLink>
        ))}
      </nav>

      <div className="mx-space-md space-y-2 rounded-xl bg-surface-container-low p-space-sm">
        <label htmlFor="mobile-district" className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          Your Riyadh district
        </label>
        <select
          id="mobile-district"
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          className="w-full rounded-lg bg-surface px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value={ALL_DISTRICTS}>All Districts</option>
          {DISTRICTS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 px-space-md py-space-md">
        {user ? (
          <>
            <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
              <Avatar src={user.avatar} name={user.name} size="md" />
              <div className="min-w-0">
                <p className="truncate font-title-md text-title-md text-on-surface">{user.name}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
            <Button to={homePath} onClick={onClose} variant="primary" fullWidth leftIcon={LayoutDashboard}>
              Go to Dashboard
            </Button>
            <Button onClick={signOut} variant="soft" fullWidth leftIcon={LogOut}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Button to={ROUTES.login} onClick={onClose} variant="primary" fullWidth leftIcon={LogIn}>
              Sign In
            </Button>
            <Button to={ROUTES.signup} onClick={onClose} variant="soft" fullWidth leftIcon={UserPlus}>
              Create an account
            </Button>
          </>
        )}
        <Button to={ROUTES.clinicRegister} onClick={onClose} variant="outline" fullWidth leftIcon={Building2}>
          List Your Clinic
        </Button>
      </div>
    </Drawer>
  );
}
