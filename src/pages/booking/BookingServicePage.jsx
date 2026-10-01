import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Navigate, useNavigate, useOutletContext, useSearchParams } from 'react-router';
import { BookingSummary } from '@/components/appointment/BookingSummary';
import { BookingWorkspace } from '@/components/appointment/BookingWorkspace';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Navigation';
import { RowSkeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { ServiceMenuItem } from '@/components/clinic/ServiceMenuItem';
import { ROUTES } from '@/constants/routes';
import { specialties } from '@/data/treatments';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useBookingStore } from '@/store/bookingStore';
import { canAccessStep, firstIncompleteStep } from '@/utils/booking';

/** Step 2 — choose a treatment from the clinic's menu. */
export default function BookingServicePage() {
  useDocumentTitle('Book · Choose Treatment');
  const { booking, clinic, clinicLoading, clinicError, reloadClinic } = useOutletContext();
  const selectService = useBookingStore((state) => state.selectService);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const treatment = params.get('treatment');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => {
    if (!clinic) return [];
    const ids = [...new Set(clinic.services.map((service) => service.treatment?.specialtyId))];
    return [{ value: 'all', label: `All Services (${clinic.services.length})` }, ...specialties.filter((item) => ids.includes(item.id)).map((item) => ({ value: item.id, label: item.shortLabel }))];
  }, [clinic]);

  if (!canAccessStep(booking, 'service')) return <Navigate to={firstIncompleteStep(booking).path} replace />;

  const services = (clinic?.services ?? [])
    .filter((service) => category === 'all' || service.treatment?.specialtyId === category)
    .sort((a, b) => Number(b.treatmentId === treatment) - Number(a.treatmentId === treatment));
  const selected = clinic?.services.find((service) => service.id === booking.clinicServiceId);

  const choose = (service) => {
    selectService(service.id);
    navigate(ROUTES.booking.doctor);
  };

  return (
    <BookingWorkspace
      overline="Step 02 · Choose Treatment"
      title="Treatment Menu & Transparent Pricing"
      description="All prices include 15% VAT and are locked at the moment you confirm."
      aside={
        <BookingSummary clinic={clinic} service={selected} loading={clinicLoading}>
          <div className="flex gap-2">
            <Button variant="soft" leftIcon={ArrowLeft} onClick={() => navigate(ROUTES.booking.clinic)}>
              Back
            </Button>
            <Button className="flex-1" rightIcon={ArrowRight} disabled={!selected} onClick={() => navigate(ROUTES.booking.doctor)}>
              Continue to Specialist
            </Button>
          </div>
        </BookingSummary>
      }
    >
      {clinicError ? (
        <ErrorState error={clinicError} onRetry={reloadClinic} />
      ) : clinicLoading || !clinic ? (
        <div className="space-y-space-sm">
          {Array.from({ length: 4 }, (_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      ) : clinic.services.length === 0 ? (
        <EmptyState title="No bookable treatments" description="This clinic has not published treatments yet." action={<Button to={ROUTES.booking.clinic}>Choose another clinic</Button>} />
      ) : (
        <>
          <Tabs variant="chips" tabs={categories} value={category} onChange={setCategory} label="Treatment categories" />
          <div className="space-y-4">
            {services.map((service) => (
              <ServiceMenuItem key={service.id} service={service} selected={service.id === booking.clinicServiceId} onSelect={choose} />
            ))}
          </div>
        </>
      )}
    </BookingWorkspace>
  );
}
