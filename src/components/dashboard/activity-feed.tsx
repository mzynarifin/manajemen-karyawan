import { formatRelative } from '@/lib/formatters'
import type { ActivityItem } from '@/features/dashboard/queries'

const LABELS: Record<string, string> = {
  create_employee: 'Employee added',
  update_employee: 'Employee updated',
  deactivate_employee: 'Employee deactivated',
  reactivate_employee: 'Employee reactivated',
  approve_leave: 'Leave approved',
  reject_leave: 'Leave rejected',
  create_payroll: 'Payroll created',
  update_payroll: 'Payroll updated',
  publish_payroll: 'Payroll published',
  create_department: 'Department created',
  update_department: 'Department updated',
}

/** PRD section 18: simple list with timestamp. */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="px-5 py-8 text-center text-[13px] text-muted">No activity recorded yet.</p>
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink">{LABELS[item.action] ?? item.action.replace(/_/g, ' ')}</p>
            {item.description && <p className="mt-0.5 truncate text-xs text-muted">{item.description}</p>}
          </div>
          <time className="shrink-0 text-xs text-muted" dateTime={item.created_at}>
            {formatRelative(item.created_at)}
          </time>
        </li>
      ))}
    </ul>
  )
}