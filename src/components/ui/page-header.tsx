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

/** PRD section 16: label, value, optional supporting text. No big icons. */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3.5">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function StatGrid({ children, columns = 4 }: { children: React.ReactNode; columns?: 3 | 4 }) {
  const layout =
    columns === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-2 gap-3 lg:grid-cols-4'
  return <div className={`grid ${layout} gap-3`}>{children}</div>
}