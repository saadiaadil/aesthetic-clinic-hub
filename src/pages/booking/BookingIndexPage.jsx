import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { LoadingState } from '@/components/common/States';
import { ROUTES } from '@/constants/routes';
import { useBookingStore } from '@/store/bookingStore';
import { firstIncompleteStep } from '@/utils/booking';

/**
 * /booking entry point. Accepts deep links from cards and profiles
 * (?clinic=dermaart&service=cs-…&doctor=doc-…) and forwards to the first
 * step that still needs input; without params it resumes the saved booking.
 */
export default function BookingIndexPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const start = useBookingStore((state) => state.start);

  useEffect(() => {
    const clinicId = params.get('clinic');
    if (clinicId) {
      start({ clinicId, clinicServiceId: params.get('service'), doctorId: params.get('doctor') });
      const next = firstIncompleteStep(useBookingStore.getState());
      navigate(next.path, { replace: true });
      return;
    }
    const state = useBookingStore.getState();
    navigate(state.confirmedAppointmentId ? ROUTES.booking.clinic : firstIncompleteStep(state).path, { replace: true });
    if (state.confirmedAppointmentId) state.reset();
  }, [params, navigate, start]);

  return <LoadingState label="Preparing your booking" className="min-h-[40vh]" />;
}
