import { AlertCircle, Inbox } from 'lucide-react'

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
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400">
        <AlertCircle className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>
    </div>
  )
}

/** Neutral placeholder block for route fallbacks and late-loading chunks. */
export function Placeholder({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`motion-safe:animate-pulse rounded-md bg-line ${className}`} />
}
