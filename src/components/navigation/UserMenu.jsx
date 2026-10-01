import { CalendarDays, ChevronDown, Heart, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Avatar } from '@/components/common/Avatar';
import { Popover } from '@/components/common/Popover';
import { ROLE_LABELS, ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';
import { getFirstName } from '@/utils/format';

const QUICK_LINKS = {
  [ROLES.PATIENT]: [
    { label: 'My Appointments', to: ROUTES.patient.appointments, icon: CalendarDays },
    { label: 'Saved Clinics', to: ROUTES.patient.saved, icon: Heart },
    { label: 'Profile & Preferences', to: ROUTES.patient.profile, icon: UserRound },
  ],
  [ROLES.CLINIC]: [
    { label: 'Bookings & Consults', to: ROUTES.clinicPortal.appointments, icon: CalendarDays },
    { label: 'Branch Profile', to: ROUTES.clinicPortal.profile, icon: UserRound },
  ],
  [ROLES.DOCTOR]: [
    { label: 'My Appointments', to: ROUTES.doctorPortal.appointments, icon: CalendarDays },
    { label: 'Professional Profile', to: ROUTES.doctorPortal.profile, icon: UserRound },
  ],
  [ROLES.ADMIN]: [{ label: 'Clinic Verification', to: ROUTES.admin.clinics, icon: CalendarDays }],
};

/** Signed-in account chip + dropdown (Stitch: avatar, name, role, chevron). */
export function UserMenu({ showName = 'md', subtitle }) {
  const { user, homePath, logout } = useAuth();
  const { isOpen, toggle, close } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();

  const signOut = async () => {
    close();
    await logout();
    toast.info('Signed out', 'See you again soon.');
    navigate(ROUTES.home);
  };

  const nameVisibility = { md: 'hidden md:flex lg:hidden 2xl:flex', always: 'hidden sm:flex', never: 'hidden' }[showName];

  return (
    <Popover
      isOpen={isOpen}
      onClose={close}
      panelClassName="w-64"
      trigger={
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={`Account menu for ${user.name}`}
          className="flex items-center gap-space-xs rounded-full p-1 transition-colors hover:bg-surface-container"
        >
          <Avatar src={user.avatar} name={user.name} size="sm" />
          <span className={cn('flex-col whitespace-nowrap pr-1.5 text-left', nameVisibility)}>
            <span className="font-label-md text-label-md text-on-surface">{getFirstName(user.name)}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{subtitle ?? ROLE_LABELS[user.role]}</span>
          </span>
          <ChevronDown className={cn('size-4 text-on-surface-variant', nameVisibility)} aria-hidden="true" />
        </button>
      }
    >
      <div className="flex items-center gap-3 px-2 pb-3 pt-1">
        <Avatar src={user.avatar} name={user.name} size="md" />
        <div className="min-w-0">
          <p className="truncate font-title-md text-title-md text-on-surface">{user.name}</p>
          <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{user.email}</p>
        </div>
      </div>
      <div role="menu" className="space-y-0.5 border-t border-surface-container-high pt-2">
        <Link role="menuitem" to={homePath} onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container">
          <LayoutDashboard className="size-4 text-primary" aria-hidden="true" />
          Dashboard
        </Link>
        {(QUICK_LINKS[user.role] ?? []).map((link) => (
          <Link key={link.to} role="menuitem" to={link.to} onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container">
            <link.icon className="size-4 text-primary" aria-hidden="true" />
            {link.label}
          </Link>
        ))}
        <button role="menuitem" type="button" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-body-sm text-body-sm text-error hover:bg-error-container/40">
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </Popover>
  );
}
