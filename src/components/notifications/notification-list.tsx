'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/states'
import { useToast } from '@/components/ui/toast'
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/features/notifications/actions'
import { formatRelative } from '@/lib/formatters'
import type { NotificationRow } from '@/features/notifications/queries'

const TYPE_LABELS: Record<string, string> = {
  leave: 'Leave',
  payroll: 'Payroll',
  employee: 'Employee',
  system: 'System',
}

/** PRD section 52: mark as read is the only optimistic action allowed. */
export function NotificationList({ items }: { items: NotificationRow[] }) {
  const router = useRouter()
  const toast = useToast()
  const [pending, startTransition] = useTransition()

  const hasUnread = items.some((item) => !item.is_read)

  function markRead(id: string) {
    startTransition(async () => {
      const result = await markNotificationReadAction(id)
      if (result.ok) router.refresh()
      else toast.push(result.message, 'error')
    })
  }

  function markAll() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction()
      if (result.ok) {
        toast.push(result.message)
        router.refresh()
      } else toast.push(result.message, 'error')
    })
  }

  if (items.length === 0) {
    return <EmptyState title="No notifications" description="Updates about leave, payroll and employees appear here." />
  }

  return (
    <>
      <div className="flex justify-end px-5 py-3">
        <Button variant="secondary" size="sm" onClick={markAll} loading={pending} disabled={!hasUnread}>
          <CheckCheck className="h-3.5 w-3.5" aria-hidden />
          Mark all as read
        </Button>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-start gap-3 px-5 py-3.5 transition-colors duration-150 ${
              item.is_read ? '' : 'bg-brand-50/40 dark:bg-brand-500/10'
            }`}
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas text-muted">
              <Bell className="h-4 w-4" aria-hidden />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-medium text-ink">{item.title}</p>
                <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">
                  {TYPE_LABELS[item.type] ?? item.type}
                </span>
                {!item.is_read && (
                  <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[11px] font-medium text-white">
                    New
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[13px] text-muted">{item.message}</p>
              <time className="mt-1 block text-xs text-muted" dateTime={item.created_at}>
                {formatRelative(item.created_at)}
              </time>
            </div>

            {!item.is_read && (
              <Button variant="ghost" size="sm" onClick={() => markRead(item.id)} disabled={pending}>
                Mark as read
              </Button>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}