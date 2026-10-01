import { DashboardShell } from '@/components/layout/DashboardShell';
import { DASHBOARD_NAV } from '@/constants/navigation';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { getDoctorSchedule } from '@/services/doctorService';

export default function DoctorLayout() {
  const { user } = useAuth();
  const { data } = useAsync(() => getDoctorSchedule(user.doctorId), [user?.doctorId]);
  return (
    <DashboardShell
      config={DASHBOARD_NAV.doctor}
      userSubtitle="Specialist View"
      footer={
        <>
          <p className="font-label-sm text-label-sm font-semibold text-secondary">{data?.doctor?.clinic?.name ?? 'Riyadh'}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{data?.doctor?.specialization ?? 'Specialist'}</p>
        </>
      }
    />
  );
}
