import { useState } from 'react';
import { MessageSquareReply, MessageSquareHeart } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Form';
import { Tabs } from '@/components/common/Navigation';
import { Stars } from '@/components/common/Rating';
import { RowSkeleton, Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { PageHeader, Panel, ProgressBar } from '@/components/dashboard/DashboardUI';
import { RatingBreakdown, ReviewCard } from '@/components/review/ReviewCards';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { getClinicById } from '@/services/clinicService';
import { getClinicReviews, replyToReview } from '@/services/reviewService';
import { formatNumber, formatRating } from '@/utils/format';

function ReplyBox({ review, clinicName, onReplied }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    if (text.trim().length < 10) {
      setError('Replies need at least 10 characters.');
      return;
    }
    setSending(true);
    try {
      await replyToReview(review.id, { text, authorName: `${clinicName} Manager` });
      toast.success('Reply published', 'Visible on your public profile.');
      onReplied();
    } catch (err) {
      toast.error('Reply not sent', err.message);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <Button variant="soft" size="sm" leftIcon={MessageSquareReply} onClick={() => setOpen(true)}>
        Reply publicly
      </Button>
    );
  }
  return (
    <div className="space-y-2">
      <label htmlFor={`reply-${review.id}`} className="font-label-md text-label-md uppercase tracking-wider text-on-surface">
        Reply as clinic manager
      </label>
      <Textarea id={`reply-${review.id}`} rows={3} surface="filled" invalid={Boolean(error)} value={text} onChange={(event) => { setText(event.target.value); setError(''); }} placeholder={`Thank ${review.author.name.split(' ')[0]} and address any feedback…`} />
      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="soft" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" loading={sending} onClick={send} className="shadow-none">
          Publish reply
        </Button>
      </div>
    </div>
  );
}

/** Clinic patient reviews — ratings overview and public replies. */
export default function ClinicReviewsPage() {
  useDocumentTitle('Patient Reviews');
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const clinic = useAsync(() => getClinicById(user.clinicId, { includeUnverified: true }), [user.clinicId]);
  const { data, isLoading, error, reload } = useAsync(
    () => getClinicReviews(user.clinicId, { status: 'approved', rating: ['all', 'unanswered'].includes(filter) ? 'all' : filter, pageSize: 100 }),
    [user.clinicId, filter],
    { keepPreviousData: true },
  );

  const items = (data?.items ?? []).filter((review) => filter !== 'unanswered' || !review.reply);
  const totalPublished = data?.distribution.reduce((sum, row) => sum + row.count, 0) ?? 0;

  return (
    <>
      <PageHeader title="Patient Reviews" meta={<span>Verified reviews from completed visits. Moderation is handled by the platform; replies are public.</span>} />

      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        <div className="flex flex-col gap-space-lg xl:col-span-4">
          <Panel titleSize="title" title="Overall Score">
            {clinic.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="flex items-center gap-4 rounded-xl bg-surface-container-low px-6 py-4">
                <span className="font-display-md text-display-md font-bold text-primary">{formatRating(clinic.data?.rating ?? 0)}</span>
                <div className="space-y-1">
                  <Stars value={clinic.data?.rating ?? 0} size="lg" />
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Based on {formatNumber(clinic.data?.reviewCount ?? 0)} MOH-authenticated visits</p>
                </div>
              </div>
            )}
            <ul className="mt-space-md space-y-2">
              {(data?.distribution ?? []).map((row) => (
                <li key={row.stars} className="flex items-center gap-3 font-label-md text-label-md text-on-surface-variant">
                  <span className="w-8 shrink-0">{row.stars} ★</span>
                  <ProgressBar value={row.count} max={Math.max(1, totalPublished)} tone="secondary" label={`${row.stars} star reviews`} />
                  <span className="w-6 shrink-0 text-right">{row.count}</span>
                </li>
              ))}
            </ul>
          </Panel>
          {clinic.data && (
            <Panel titleSize="title" title="Quality Metrics">
              <RatingBreakdown breakdown={clinic.data.ratingBreakdown} className="lg:grid-cols-1 sm:grid-cols-2 [&>div]:bg-surface-container-low" />
            </Panel>
          )}
        </div>

        <Panel
          className="xl:col-span-8"
          title="Published Reviews"
          action={
            <Tabs
              label="Filter reviews"
              value={filter}
              onChange={setFilter}
              tabs={[
                { value: 'all', label: 'All' },
                { value: 'unanswered', label: 'Needs reply', count: data?.awaitingReply },
                { value: '5', label: '5★' },
                { value: '4', label: '4★' },
                { value: '3', label: '3★' },
              ]}
            />
          }
        >
          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : isLoading && !data ? (
            <div className="space-y-space-sm">
              <RowSkeleton />
              <RowSkeleton />
            </div>
          ) : items.length === 0 ? (
            <EmptyState compact icon={MessageSquareHeart} title={filter === 'unanswered' ? 'Every review has a reply' : 'No reviews in this view'} description="New verified reviews appear here after moderation." />
          ) : (
            <div className="space-y-space-sm">
              {items.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  className="bg-surface-container-low"
                  actions={!review.reply && <ReplyBox review={review} clinicName={clinic.data?.name ?? 'Clinic'} onReplied={reload} />}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
