import { formatRelative } from '@/lib/formatters'
import type { ActivityItem } from '@/features/dashboard/queries'

const LABELS: Record<string, string> = {
  create_employee: 'Employee added',
  update_employee: 'Employee updated',
  deactivate_employee: 'Employee deactivated',
  reactivate_employee: 'Employee reactivated',
  delete_employee: 'Employee deleted',
  approve_leave: 'Leave approved',
  reject_leave: 'Leave rejected',
  create_payroll: 'Payroll created',
  create_payroll_batch: 'Payroll batch created',
  update_payroll: 'Payroll updated',
  publish_payroll: 'Payroll published',
  create_department: 'Department created',
  update_department: 'Department updated',
}

type Entry = { label: string; items: ActivityItem[] }

/**
 * A bulk import writes one audit row per employee, so eight identical
 * "Employee added" lines would push everything else off the card. Runs of the
 * same action collapse into one row with a count.
 */
function collapse(items: ActivityItem[]): Entry[] {
  const entries: Entry[] = []

  for (const item of items) {
    const label = LABELS[item.action] ?? item.action.replace(/_/g, ' ')
    const last = entries.at(-1)

    if (last && last.label === label) last.items.push(item)
    else entries.push({ label, items: [item] })
  }

  return entries
}

/** PRD section 18: simple list with timestamp. */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="px-5 py-8 text-center text-[13px] text-muted">No activity recorded yet.</p>
  }

  return (
    <ul className="divide-y divide-line">
      {collapse(items).map((entry) => {
        const newest = entry.items[0]
        const count = entry.items.length
        const actor = newest.profiles?.full_name

        return (
          <li key={newest.id} className="flex items-start justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink">
                {entry.label}
                {count > 1 && (
                  <span className="ml-1.5 rounded-full bg-canvas px-1.5 py-0.5 text-[11px] font-normal tabular-nums text-muted">
                    {count}
                  </span>
                )}
              </p>
              {newest.description && (
                <p className="mt-0.5 truncate text-xs text-muted">
                  {count > 1 ? `${count} records` : newest.description}
                  {actor ? ` · ${actor}` : ''}
                </p>
              )}
              {!newest.description && actor && <p className="mt-0.5 truncate text-xs text-muted">{actor}</p>}
            </div>
            <time className="shrink-0 text-xs text-muted" dateTime={newest.created_at}>
              {formatRelative(newest.created_at)}
            </time>
          </li>
        )
      })}
    </ul>
  )
}
