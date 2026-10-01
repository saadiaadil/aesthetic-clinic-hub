import { MessageSquareText, ShieldCheck } from 'lucide-react';
import { Tabs } from '@/components/common/Navigation';
import { RowSkeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { PageHeader, Panel } from '@/components/dashboard/DashboardUI';
import { ReviewCard } from '@/components/review/ReviewCards';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQueryState } from '@/hooks/useQueryState';
import { useToast } from '@/hooks/useToast';
import { getAdminReviews, moderateReview } from '@/services/reviewService';
import { cn } from '@/utils/cn';
import { formatNumber, pluralize } from '@/utils/format';
import { AdminPills, FilterBar, MetaDot, PolicyNote, ReviewDecisionActions, SearchField } from './components/AdminUI';
import { REVIEW_DECISION_TOASTS, reviewProvenance } from './components/adminMeta';
import { useUrlSearch } from './components/useUrlSearch';

const TABS = [
  {
    value: 'pending',
    label: 'In Moderation',
    title: 'Awaiting Moderation',
    emptyTitle: 'Moderation queue is clear',
    emptyText: 'New patient reviews will appear here for approval before they are published.',
  },
  { value: 'approved', label: 'Published', title: 'Published Reviews', emptyTitle: 'No published reviews', emptyText: 'Approved reviews appear on clinic profiles and count towards ratings.' },
  { value: 'rejected', label: 'Rejected', title: 'Rejected Reviews', emptyTitle: 'No rejected reviews', emptyText: 'Reviews you reject or unpublish are kept here and can be restored.' },
  { value: 'all', label: 'All', title: 'All Reviews', emptyTitle: 'No reviews yet', emptyText: 'Reviews from completed visits will appear here.' },
];

function ReviewListSkeleton() {
  return (
    <div className="space-y-space-sm" role="status">
      <span className="sr-only">Loading reviews</span>
      <RowSkeleton />
      <RowSkeleton />
      <RowSkeleton />
    </div>
  );
}

/** Review moderation (FR-8): approve or reject pending reviews, unpublish or restore decided ones. */
export default function AdminReviewsPage() {
  useDocumentTitle('Review Moderation');
  const toast = useToast();
  const [filters, setFilters] = useQueryState({ status: 'pending', q: '' });
  const [keyword, setKeyword] = useUrlSearch(filters.q, (q) => setFilters({ q }));
  const tab = TABS.find((item) => item.value === filters.status) ?? TABS[0];

  const { data, isLoading, error, reload, setData } = useAsync(() => getAdminReviews({ status: tab.value, q: filters.q }), [tab.value, filters.q], {
    keepPreviousData: true,
  });

  const decide = async (review, status) => {
    const from = review.status;
    // Optimistic: move the review between tabs immediately; refetch if the server disagrees.
    setData((prev) => ({
      items:
        tab.value === 'all' ? prev.items.map((item) => (item.id === review.id ? { ...item, status } : item)) : prev.items.filter((item) => item.id !== review.id),
      counts: { ...prev.counts, [from]: Math.max(0, (prev.counts[from] ?? 1) - 1), [status]: (prev.counts[status] ?? 0) + 1 },
    }));
    try {
      await moderateReview(review.id, status);
      const copy = REVIEW_DECISION_TOASTS[`${from}>${status}`];
      if (copy) toast.success(copy.title, copy.text(review.clinic?.name ?? 'the clinic profile'));
    } catch (err) {
      toast.error('Moderation not saved', err.message);
      reload();
    }
  };

  const counts = data?.counts;
  const pending = counts?.pending ?? 0;

  return (
    <>
      <PageHeader
        pills={<AdminPills />}
        title="Review Moderation"
        meta={
          <>
            <MessageSquareText className="size-4 text-secondary" aria-hidden="true" />
            <span>{counts ? `${pluralize(pending, 'review')} awaiting a decision` : 'Patient reviews from completed visits'}</span>
            <MetaDot />
            <span>{counts ? `${formatNumber(counts.all ?? 0)} reviews on record` : 'Verified bookings only'}</span>
          </>
        }
      />

      <PolicyNote icon={ShieldCheck}>
        Only patients with a completed booking can review. Reviews stay hidden until approved; published reviews count towards the clinic’s rating.
      </PolicyNote>

      <Panel title={tab.title} subtitle={data ? pluralize(data.items.length, 'review') : 'Loading reviews…'}>
        <FilterBar>
          <Tabs
            label="Moderation status"
            value={tab.value}
            onChange={(status) => setFilters({ status })}
            tabs={TABS.map((item) => ({ value: item.value, label: item.label, count: counts ? (counts[item.value] ?? 0) : undefined }))}
          />
          <SearchField value={keyword} onChange={setKeyword} label="Search reviews" placeholder="Search patient, clinic or text" />
        </FilterBar>

        {error && !data ? (
          <ErrorState compact error={error} onRetry={reload} />
        ) : !data ? (
          <ReviewListSkeleton />
        ) : data.items.length === 0 ? (
          <EmptyState
            compact
            icon={tab.value === 'pending' ? ShieldCheck : MessageSquareText}
            title={filters.q ? `No reviews match “${filters.q}”` : tab.emptyTitle}
            description={filters.q ? 'Try another search term or status.' : tab.emptyText}
          />
        ) : (
          <ul className={cn('space-y-space-sm transition-opacity', isLoading && 'opacity-60')}>
            {data.items.map((review) => (
              <li key={review.id}>
                <ReviewCard
                  review={review}
                  showStatus
                  showClinic
                  className="bg-surface-container-low"
                  actions={<ReviewDecisionActions review={review} onDecide={decide} note={reviewProvenance(review)} />}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
