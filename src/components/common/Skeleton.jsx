import { cn } from '@/utils/cn';

/** Warm shimmer placeholder used while service calls resolve. */
export function Skeleton({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative block overflow-hidden rounded-lg bg-surface-container-high', className)}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface-container-lowest/60 to-transparent" />
    </span>
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <span className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </span>
  );
}

/** Generic card skeleton (image + text) matching Stitch card proportions. */
export function CardSkeleton({ imageClassName = 'h-60', className }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl bg-surface-container-low shadow-sm', className)} aria-hidden="true">
      <Skeleton className={cn('w-full rounded-none', imageClassName)} />
      <div className="space-y-3 p-space-md">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <SkeletonText lines={2} />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  );
}

/** Row skeleton for lists and dashboard queues. */
export function RowSkeleton({ className }) {
  return (
    <div className={cn('flex items-center gap-space-md rounded-xl bg-surface-container-low p-space-md', className)} aria-hidden="true">
      <Skeleton className="h-12 w-16" />
      <Skeleton className="size-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="hidden h-8 w-24 sm:block" />
    </div>
  );
}
