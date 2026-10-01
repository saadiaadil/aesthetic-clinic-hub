import { DashboardShell } from '@/components/layout/DashboardShell';
import { getDistrictName } from '@/constants/districts';
import { DASHBOARD_NAV } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function PatientLayout() {
  const { user } = useAuth();
  const since = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();
  return (
    <DashboardShell
      config={DASHBOARD_NAV.patient}
      userSubtitle="Patient Sanctuary"
      footer={
        <>
          <p className="font-label-sm text-label-sm font-semibold text-secondary">{getDistrictName(user?.district)} Member</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Verified patient since {since}</p>
        </>
      }
    />
  );
}
