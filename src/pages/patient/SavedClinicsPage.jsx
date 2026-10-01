import { Heart, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { EmptyState, ErrorState } from '@/components/common/States';
import { ClinicCard, ClinicCardSkeleton } from '@/components/clinic/ClinicCard';
import { PageHeader } from '@/components/dashboard/DashboardUI';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { searchClinics } from '@/services/clinicService';
import { useFavoritesStore } from '@/store/favoritesStore';

/** Saved clinics (header heart). Removing a heart updates the list instantly. */
export default function SavedClinicsPage() {
  useDocumentTitle('Saved Clinics');
  const savedIds = useFavoritesStore((state) => state.clinicIds);
  const { data, isLoading, error, reload } = useAsync(() => searchClinics({ pageSize: 50 }), []);
  const clinics = (data?.items ?? []).filter((clinic) => savedIds.includes(clinic.id));

  return (
    <>
      <PageHeader
        title="Saved Clinics"
        meta={<span>Your shortlist of verified Riyadh clinics — compare and book when you are ready.</span>}
        actions={
          <Button to={ROUTES.clinics} leftIcon={Search} variant="tonal">
            Discover more clinics
          </Button>
        }
      />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <ClinicCardSkeleton key={index} />
          ))}
        </div>
      ) : clinics.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved clinics yet"
          description="Tap the heart on any clinic to keep it here for later."
          action={<Button to={ROUTES.clinics}>Browse verified clinics</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 2xl:grid-cols-3">
          {clinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      )}
    </>
  );
}
