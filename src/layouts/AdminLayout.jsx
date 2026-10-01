import { DashboardShell } from '@/components/layout/DashboardShell';
import { USE_MOCK_API } from '@/constants/config';
import { DASHBOARD_NAV } from '@/constants/navigation';

export default function AdminLayout() {
  return (
    <DashboardShell
      config={DASHBOARD_NAV.admin}
      userSubtitle="Platform Admin"
      footer={
        <>
          <p className="font-label-sm text-label-sm font-semibold text-secondary">Riyadh Verification Committee</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{USE_MOCK_API ? 'Demo data (mock API)' : 'Live API'}</p>
        </>
      }
    />
  );
}
