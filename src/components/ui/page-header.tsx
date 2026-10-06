import Link from 'next/link'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold leading-7 tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** PRD section 16: label, value, optional supporting text. No big icons.
 *  Passing href turns the card into the shortcut to the page behind the number. */
export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string
  value: string | number
  hint?: string
  href?: string
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] text-muted">{label}</p>
        {href && (
          <span
            aria-hidden
            className="text-xs text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          >
            View →
          </span>
        )}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  )

  const className = 'block rounded-lg border border-line bg-surface px-4 py-3.5'

  if (!href) return <div className={className}>{body}</div>

  return (
    <Link
      href={href}
      className={`${className} group transition-colors duration-150 hover:border-brand-700/40 hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700`}
    >
      {body}
    </Link>
  )
}

export function StatGrid({ children, columns = 4 }: { children: React.ReactNode; columns?: 3 | 4 }) {
  const layout =
    columns === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-2 gap-3 lg:grid-cols-4'
  return <div className={`grid ${layout} gap-3`}>{children}</div>
}
