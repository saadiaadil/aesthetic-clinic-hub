import { DashboardShell } from '@/components/layout/DashboardShell';
import { DASHBOARD_NAV } from '@/constants/navigation';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { getClinicById } from '@/services/clinicService';

export default function ClinicLayout() {
  const { user } = useAuth();
  const { data: clinic } = useAsync(() => getClinicById(user.clinicId, { includeUnverified: true }), [user?.clinicId]);
  return (
    <DashboardShell
      config={DASHBOARD_NAV.clinic}
      userSubtitle={user?.jobTitle ?? 'Clinic Manager'}
      footer={
        <>
          <p className="font-label-sm text-label-sm font-semibold text-secondary">{clinic?.districtLabel ?? 'Riyadh'}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">MOH License #{clinic?.licenseNumber?.replace(/^MOH-/, '') ?? '—'}</p>
        </>
      }
    />
  );
}
