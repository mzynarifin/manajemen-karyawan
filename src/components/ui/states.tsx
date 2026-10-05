import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** PRD section 64. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-muted">
        <Inbox className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** PRD section 66. */
export function ErrorState({
  title = 'Unable to load this data',
  description = 'Something went wrong while loading. Please try again.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400">
        <AlertCircle className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}

/** PRD section 65: skeletons for route transitions, never a full page spinner. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800 ${className}`} />
}

export function StatSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3.5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
      <Skeleton className="mt-2 h-3 w-28" />
    </div>
  )
}

export function TableSkeleton({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-5 py-3.5">
            {Array.from({ length: columns }).map((__, cellIndex) => (
              <Skeleton key={cellIndex} className={`h-3.5 ${cellIndex === 0 ? 'w-40' : 'w-full max-w-24'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}