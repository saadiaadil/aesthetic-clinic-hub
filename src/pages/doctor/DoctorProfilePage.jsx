import { BadgeCheck, ExternalLink, UserRound } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/States';
import { PageHeader } from '@/components/dashboard/DashboardUI';
import { DoctorCardSkeleton } from '@/components/doctor/DoctorCard';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getDoctorById } from '@/services/doctorService';
import { DoctorProfileForm } from './components/DoctorProfileForm';

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12" aria-hidden="true">
      <div className="space-y-space-lg xl:col-span-8">
        <Skeleton className="h-[520px] rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="xl:col-span-4">
        <DoctorCardSkeleton />
      </div>
    </div>
  );
}

/** Doctor professional profile — public introduction, practice details and credentials. */
export default function DoctorProfilePage() {
  useDocumentTitle('Professional Profile');
  const { user } = useAuth();
  const { data: doctor, isLoading, error, reload, setData } = useAsync(() => getDoctorById(user.doctorId), [user.doctorId]);

  return (
    <>
      <PageHeader
        pills={
          doctor ? (
            <>
              <Badge tone="gold" size="md" uppercase icon={BadgeCheck} className="text-on-secondary-fixed">
                SCFHS Verified
              </Badge>
              {doctor.clinic && (
                <Badge tone="neutral" size="md">
                  {doctor.clinic.name} • {doctor.clinic.districtLabel}
                </Badge>
              )}
              <Badge tone="muted" size="md" className="hidden bg-surface-container sm:inline-flex">
                {doctor.specialization}
              </Badge>
            </>
          ) : (
            <Skeleton className="h-6 w-60 rounded-full" />
          )
        }
        title="Professional Profile"
        meta={
          <>
            <UserRound className="size-4 text-secondary" aria-hidden="true" />
            <span>{doctor?.name ?? user.name}</span>
            <span className="text-outline-variant">•</span>
            <span>How patients discover and choose you</span>
          </>
        }
        actions={
          doctor && (
            <Button to={ROUTES.doctor(doctor.id)} variant="tonal" rightIcon={ExternalLink}>
              View public profile
            </Button>
          )
        }
      />

      {isLoading ? (
        <ProfileSkeleton />
      ) : error ? (
        <ErrorState title="We couldn’t load your profile" error={error} onRetry={reload} />
      ) : (
        <DoctorProfileForm doctor={doctor} onSaved={(values) => setData((previous) => ({ ...previous, ...values }))} />
      )}
    </>
  );
}
