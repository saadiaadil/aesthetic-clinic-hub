import { MessageSquareHeart, PenLine } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { RowSkeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { ReviewCard } from '@/components/review/ReviewCards';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getPatientReviews, getReviewableAppointments } from '@/services/reviewService';
import { formatDate } from '@/utils/format';

/** The patient's reviews (with moderation status) and visits still awaiting a review. */
export default function PatientReviewsPage() {
  useDocumentTitle('My Reviews');
  const { user } = useAuth();
  const reviews = useAsync(() => getPatientReviews(user.id), [user.id]);
  const pending = useAsync(() => getReviewableAppointments(user.id), [user.id]);

  return (
    <>
      <PageHeader title="My Reviews" meta={<span>Verified reviews help other patients in Riyadh choose with confidence.</span>} />
      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        <Panel title="Published & In Moderation" className="xl:col-span-8" bodyClassName="space-y-space-sm">
          {reviews.error ? (
            <ErrorState compact error={reviews.error} onRetry={reviews.reload} />
          ) : reviews.isLoading ? (
            <RowSkeleton />
          ) : reviews.data.length === 0 ? (
            <EmptyState compact icon={MessageSquareHeart} title="No reviews yet" description="After a completed visit you can rate your clinic and specialist." />
          ) : (
            reviews.data.map((review) => <ReviewCard key={review.id} review={review} showStatus showClinic className="bg-surface-container-low" />)
          )}
        </Panel>
        <Panel title="Awaiting Your Review" titleSize="title" className="xl:col-span-4">
          {pending.isLoading ? (
            <RowSkeleton />
          ) : pending.data?.length ? (
            <ul className="space-y-space-sm">
              {pending.data.map((item) => (
                <li key={item.id} className="space-y-2 rounded-lg bg-surface-container-low p-space-sm">
                  <p className="font-title-md text-title-md text-on-surface">{item.serviceTitle}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {item.clinicName} • {formatDate(item.scheduledAt)}
                  </p>
                  <Button to={`${ROUTES.patient.appointment(item.id)}#review`} size="sm" leftIcon={PenLine} className="shadow-none">
                    Write review
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No visits are waiting for a review.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
