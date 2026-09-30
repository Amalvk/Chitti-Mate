interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800 ${className}`} aria-hidden />
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:shadow-none">
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-7 w-2/3 mb-4" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/**
 * Stand-in for the compact flip-clock countdown while its cycle data is
 * still loading — same digit-pair/separator shape and footprint so the card
 * doesn't reflow once the real countdown mounts.
 */
export function CountdownSkeleton() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: 4 }).map((_, unit) => (
        <div key={unit} className="flex items-center gap-1.5">
          <div className="flex gap-1">
            <Skeleton className="h-[34px] w-[29px]" />
            <Skeleton className="h-[34px] w-[29px]" />
          </div>
          {unit < 3 && <span className="text-ink-300 dark:text-ink-600">:</span>}
        </div>
      ))}
    </div>
  )
}
