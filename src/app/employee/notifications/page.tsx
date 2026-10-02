import type { Metadata } from 'next'
import { EmployeeShell } from '@/components/layout/shell'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { FilterBar } from '@/components/ui/filter-bar'
import { ErrorState } from '@/components/ui/states'
import { NotificationList } from '@/components/notifications/notification-list'
import { requireEmployeeSession } from '@/lib/supabase/session'
import { listNotifications } from '@/features/notifications/queries'

export const metadata: Metadata = { title: 'Notifications' }

type Search = Record<string, string | string[] | undefined>

export default async function EmployeeNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const session = await requireEmployeeSession()
  const params = await searchParams

  const page = Math.max(1, Number(params.page) || 1)
  const isRead = params.is_read === 'true' ? true : params.is_read === 'false' ? false : undefined

  let data: Awaited<ReturnType<typeof listNotifications>> | null = null
  try {
    data = await listNotifications(session.supabase, { userId: session.userId, page, limit: 20, isRead })
  } catch {
    data = null
  }

  return (
    <EmployeeShell title="Notifications">
      <div className="space-y-4">
        <PageHeader title="Notifications" description="Updates about your leave, payroll and account." />

        <Card>
          <CardBody>
            <FilterBar
              options={{
                is_read: [
                  { value: '', label: 'All' },
                  { value: 'false', label: 'Unread' },
                  { value: 'true', label: 'Read' },
                ],
                type: [
                  { value: '', label: 'All types' },
                  { value: 'leave', label: 'Leave' },
                  { value: 'payroll', label: 'Payroll' },
                  { value: 'employee', label: 'Employee' },
                  { value: 'system', label: 'System' },
                ],
              }}
            />
          </CardBody>

          {!data ? (
            <ErrorState title="Unable to load notifications" />
          ) : (
            <>
              <NotificationList items={data.items} />
              <Pagination
                page={page}
                limit={20}
                total={data.pagination.total}
                label="notifications"
                buildHref={(next) => {
                  const query = new URLSearchParams()
                  for (const [key, value] of Object.entries(params)) {
                    if (typeof value === 'string' && value && key !== 'page') query.set(key, value)
                  }
                  query.set('page', String(next))
                  return `/employee/notifications?${query.toString()}`
                }}
              />
            </>
          )}
        </Card>
      </div>
    </EmployeeShell>
  )
}