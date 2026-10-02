export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-lg border border-line bg-surface ${className}`}>{children}</section>
}

export function CardHeader({
  title,
  description,
  action,
  className = '',
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <header className={`flex items-start justify-between gap-4 border-b border-line px-5 py-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

export function CardBody({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}

/** Label/value row used across detail pages (PRD section 26). */
export function DescriptionRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-line/70 py-2.5 last:border-0">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-ink">{children}</dd>
    </div>
  )
}